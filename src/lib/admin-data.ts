import "server-only";
import { supabaseAdmin } from "./supabase";
import { isSupabaseConfigured, listedTiers } from "./catalog";
import {
  adminStatsLocal,
  allBookingsForExportLocal,
  checkInBookingLocal,
  listBookingsLocal,
  undoCheckInLocal,
} from "./local-store";
import type { Booking, BookingStatus, TicketType } from "./types";

export interface AdminBookingRow extends Booking {
  ticket_types: { name: string } | null;
}

export interface AdminListParams {
  q?: string;
  status?: BookingStatus | "all";
  page?: number;
  pageSize?: number;
}

/**
 * Supabase caps every PostgREST response at `max-rows` (1000 by default).
 * Anything that must see ALL rows — stats, CSV export — pages through here.
 */
const PAGE = 1000;
async function fetchAll<T>(
  build: (from: number, to: number) => PromiseLike<{ data: unknown[] | null; error: unknown }>
): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await build(from, from + PAGE - 1);
    if (error) throw error;
    const rows = (data ?? []) as T[];
    out.push(...rows);
    if (rows.length < PAGE) return out;
  }
}

/** Strip characters that are syntax inside a PostgREST or() filter value. */
function searchTerm(q: string) {
  return q.replace(/[,()"\\]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

export async function listBookings(params: AdminListParams) {
  if (!isSupabaseConfigured()) return listBookingsLocal(params);
  const page = Math.max(1, Math.floor(params.page ?? 1) || 1);
  const pageSize = Math.min(100, Math.max(10, Math.floor(params.pageSize ?? 25) || 25));
  const from = (page - 1) * pageSize;

  let query = supabaseAdmin()
    .from("bookings")
    .select("*, ticket_types(name)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  if (params.status && params.status !== "all") query = query.eq("status", params.status);

  const term = searchTerm(params.q ?? "");
  if (term) {
    // Values are double-quoted so "." / "@" in emails can't be read as operators.
    const like = `"%${term}%"`;
    const idLike = `"%${term.toUpperCase().replace(/\s+/g, "")}%"`;
    query = query.or(
      [
        `name.ilike.${like}`,
        `email.ilike.${like}`,
        `phone.ilike.${like}`,
        `id.ilike.${idLike}`,
        `razorpay_payment_id.ilike.${like}`,
      ].join(",")
    );
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { rows: (data ?? []) as AdminBookingRow[], total: count ?? 0, page, pageSize };
}

/** Every booking (all statuses) for the CSV export, oldest first. */
export async function allBookingsForExport(): Promise<AdminBookingRow[]> {
  if (!isSupabaseConfigured()) return allBookingsForExportLocal();
  return fetchAll<AdminBookingRow>((from, to) =>
    supabaseAdmin()
      .from("bookings")
      .select("*, ticket_types(name)")
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, to)
  );
}

export async function adminStats() {
  if (!isSupabaseConfigured()) return adminStatsLocal();
  const db = supabaseAdmin();
  type Agg = Pick<Booking, "status" | "amount_paise" | "attendees" | "checked_in_at">;
  const [{ data: tiers, error: tierErr }, rows] = await Promise.all([
    db.from("ticket_availability").select("*").order("sort_order"),
    fetchAll<Agg>((from, to) =>
      db
        .from("bookings")
        .select("status, amount_paise, attendees, checked_in_at")
        .in("status", ["confirmed", "pending"])
        .order("id")
        .range(from, to)
    ),
  ]);
  if (tierErr) throw tierErr;
  const confirmed = rows.filter((r) => r.status === "confirmed");
  return {
    tiers: listedTiers((tiers ?? []) as TicketType[]),
    revenuePaise: confirmed.reduce((s, r) => s + r.amount_paise, 0),
    confirmedBookings: confirmed.length,
    attendees: confirmed.reduce((s, r) => s + r.attendees, 0),
    checkedIn: confirmed.filter((r) => r.checked_in_at).length,
    pending: rows.filter((r) => r.status === "pending").length,
  };
}

export async function checkInBooking(id: string, by: string) {
  if (!isSupabaseConfigured()) return checkInBookingLocal(id, by);
  const { data, error } = await supabaseAdmin().rpc("check_in_booking", { p_id: id, p_by: by });
  if (error) throw error;
  const row = (Array.isArray(data) ? data[0] : data) as {
    code: "ok" | "not_found" | "not_confirmed" | "already_used";
    booking: Booking | null;
  };
  return row;
}

export async function undoCheckIn(id: string) {
  if (!isSupabaseConfigured()) return undoCheckInLocal(id);
  const { error } = await supabaseAdmin()
    .from("bookings")
    .update({ checked_in_at: null, checked_in_by: null })
    .eq("id", id);
  if (error) throw error;
}
