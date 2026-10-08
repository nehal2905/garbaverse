import "server-only";
import { supabaseAdmin } from "./supabase";
import { generateBookingId, passAccessToken, signBookingId } from "./signing";
import { CATALOG, isSupabaseConfigured } from "./catalog";
import { EVENT } from "./event";
import type { Booking, PublicBooking, TicketType } from "./types";

export class BookingError extends Error {
  constructor(
    public code:
      | "SOLD_OUT"
      | "TICKET_TYPE_NOT_FOUND"
      | "QUANTITY_EXCEEDS_LIMIT"
      | "INVALID_QUANTITY"
      | "BOOKING_NOT_FOUND"
      | "UNKNOWN",
    message: string,
    public available?: number
  ) {
    super(message);
  }
}

/* ────────────────────────────── Ticket types ────────────────────────────── */

/**
 * Sweeping expired holds here is housekeeping, not correctness: create_booking
 * releases expired holds for its tier inside the same transaction before it
 * counts. So under a crowd we sweep at most every 15s per instance, and in
 * parallel with the read — never as an extra sequential round trip.
 */
const SWEEP_EVERY_MS = 15_000;
let lastSweep = 0;

export async function getTicketTypes(): Promise<TicketType[]> {
  if (!isSupabaseConfigured()) return CATALOG;
  const db = supabaseAdmin();
  let sweep: PromiseLike<unknown> | null = null;
  if (Date.now() - lastSweep > SWEEP_EVERY_MS) {
    lastSweep = Date.now();
    sweep = db.rpc("expire_bookings"); // resolves to { error } — never throws
  }
  const [{ data, error }] = await Promise.all([
    db.from("ticket_availability").select("*").eq("is_active", true).order("sort_order", { ascending: true }),
    sweep,
  ]);
  if (error) throw error;
  return (data ?? []) as TicketType[];
}

export async function getTicketType(id: string): Promise<TicketType | null> {
  const { data, error } = await supabaseAdmin()
    .from("ticket_availability")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as TicketType) ?? null;
}

/* ────────────────────────────── Bookings ─────────────────────────────────── */

export async function getBooking(id: string): Promise<Booking | null> {
  const { data, error } = await supabaseAdmin()
    .from("bookings")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as Booking) ?? null;
}

export async function getBookingByOrderId(orderId: string): Promise<Booking | null> {
  const { data, error } = await supabaseAdmin()
    .from("bookings")
    .select("*")
    .eq("razorpay_order_id", orderId)
    .maybeSingle();
  if (error) throw error;
  return (data as Booking) ?? null;
}

export async function getBookingWithTier(
  id: string
): Promise<{ booking: Booking; tier: TicketType } | null> {
  const booking = await getBooking(id);
  if (!booking) return null;
  const tier = await getTicketType(booking.ticket_type_id);
  if (!tier) return null;
  return { booking, tier };
}

interface CreateInput {
  ticketTypeId: string;
  quantity: number;
  name: string;
  email: string;
  phone: string;
}

/** Creates a pending booking + reserves inventory. Retries on ID collision. */
export async function createPendingBooking(input: CreateInput): Promise<Booking> {
  const db = supabaseAdmin();
  for (let attempt = 0; attempt < 5; attempt++) {
    const id = generateBookingId();
    const { data, error } = await db.rpc("create_booking", {
      p_id: id,
      p_ticket_type_id: input.ticketTypeId,
      p_quantity: input.quantity,
      p_name: input.name,
      p_email: input.email,
      p_phone: input.phone,
      p_hold_minutes: EVENT.holdMinutes,
    });
    if (!error) return data as Booking;

    // Primary-key collision → try a new ID.
    if (error.code === "23505" && /bookings_pkey/.test(error.message)) continue;

    const msg = error.message ?? "";
    if (msg.startsWith("SOLD_OUT")) {
      const avail = Number(msg.split(":")[1] ?? 0);
      throw new BookingError(
        "SOLD_OUT",
        avail > 0 ? `Only ${avail} left in this tier.` : "This tier is sold out.",
        avail
      );
    }
    if (msg.includes("TICKET_TYPE_NOT_FOUND"))
      throw new BookingError("TICKET_TYPE_NOT_FOUND", "That pass type no longer exists.");
    if (msg.includes("QUANTITY_EXCEEDS_LIMIT"))
      throw new BookingError("QUANTITY_EXCEEDS_LIMIT", "That quantity exceeds the per-order limit.");
    if (msg.includes("INVALID_QUANTITY"))
      throw new BookingError("INVALID_QUANTITY", "Please choose at least one pass.");
    throw new BookingError("UNKNOWN", msg || "Could not create booking.");
  }
  throw new BookingError("UNKNOWN", "Could not allocate a booking ID. Please try again.");
}

export async function attachOrderId(bookingId: string, orderId: string) {
  const { error } = await supabaseAdmin()
    .from("bookings")
    .update({ razorpay_order_id: orderId })
    .eq("id", bookingId);
  if (error) throw error;
}

export async function releaseBooking(id: string, reason: string) {
  const { data, error } = await supabaseAdmin().rpc("release_booking", {
    p_id: id,
    p_reason: reason,
  });
  if (error) throw error;
  return Boolean(data);
}

/**
 * Atomic confirm. Returns { transitioned, booking }. Caller sends the pass
 * email only when transitioned === true.
 */
export async function confirmBooking(
  id: string,
  paymentId: string,
  method?: string | null
): Promise<{ transitioned: boolean; booking: Booking }> {
  const { data, error } = await supabaseAdmin().rpc("confirm_booking", {
    p_id: id,
    p_payment_id: paymentId,
    p_method: method ?? null,
  });
  if (error) {
    if (error.message.includes("BOOKING_NOT_FOUND"))
      throw new BookingError("BOOKING_NOT_FOUND", "Booking not found.");
    throw error;
  }
  const row = (Array.isArray(data) ? data[0] : data) as {
    transitioned: boolean;
    booking: Booking;
  };
  return row;
}

/**
 * Atomically claims the right to send the pass email. Returns true for exactly
 * one caller even if webhook + browser verify race each other.
 */
export async function claimEmailSend(id: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin()
    .from("bookings")
    .update({ email_sent_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "confirmed")
    .is("email_sent_at", null)
    .select("id");
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

/** Undo a claim when sending failed so a later retry can pick it up. */
export async function unclaimEmailSend(id: string) {
  const { error } = await supabaseAdmin().from("bookings").update({ email_sent_at: null }).eq("id", id);
  if (error) throw error;
}

export async function expireBookings(): Promise<number> {
  const { data, error } = await supabaseAdmin().rpc("expire_bookings");
  if (error) throw error;
  return Number(data ?? 0);
}

export async function lookupBooking(id: string, email: string): Promise<Booking | null> {
  // Exact match only. create_booking stores emails lower-cased; ilike would
  // treat "_" / "%" in user input as wildcards and leak other people's passes.
  const { data, error } = await supabaseAdmin()
    .from("bookings")
    .select("*")
    .eq("id", id)
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();
  if (error) throw error;
  return (data as Booking) ?? null;
}

/**
 * Confirmed bookings whose pass email never went out (a failed send releases
 * its claim). The cron retries these. `olderThanMs` leaves the webhook / verify
 * path time to send first.
 */
export async function listUnsentConfirmed(olderThanMs = 2 * 60_000, limit = 25): Promise<Booking[]> {
  const cutoff = new Date(Date.now() - olderThanMs).toISOString();
  const { data, error } = await supabaseAdmin()
    .from("bookings")
    .select("*")
    .eq("status", "confirmed")
    .is("email_sent_at", null)
    .lt("confirmed_at", cutoff)
    .order("confirmed_at", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as Booking[];
}

/* ────────────────────────────── Projection ───────────────────────────────── */

export function toPublicBooking(b: Booking, tier: TicketType): PublicBooking {
  const confirmed = b.status === "confirmed";
  return {
    id: b.id,
    status: b.status,
    name: b.name,
    email: b.email,
    quantity: b.quantity,
    attendees: b.attendees,
    amount_paise: b.amount_paise,
    ticket_type: { id: tier.id, name: tier.name, admits: tier.admits },
    expires_at: b.expires_at,
    confirmed_at: b.confirmed_at,
    checked_in_at: b.checked_in_at,
    qr_payload: confirmed ? signBookingId(b.id) : null,
    access_token: passAccessToken(b.id, b.email),
  };
}
