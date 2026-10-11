import "server-only";
import { supabaseAdmin } from "./supabase";
import { generateBookingId, passAccessToken, signBookingId } from "./signing";
import { CATALOG, isOnSale, isSupabaseConfigured, listedTiers } from "./catalog";
import { bookingNight, bookingNights, parseEventNights, passAmountPaise, serializeEventNights } from "./event";
import { EVENT } from "./event";
import { BookingError, type Booking, type PublicBooking, type TicketType } from "./types";
import {
  claimEmailSendLocal,
  confirmBookingLocal,
  createPendingBookingLocal,
  declarePaidLocal,
  expireBookingsLocal,
  getBookingLocal,
  getTicketTypeLocal,
  getTicketTypesLocal,
  listUnsentConfirmedLocal,
  lookupBookingLocal,
  releaseBookingLocal,
  unclaimEmailSendLocal,
} from "./local-store";

export { BookingError };

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
  if (!isSupabaseConfigured()) return listedTiers(getTicketTypesLocal());
  const db = supabaseAdmin();
  let sweep: PromiseLike<unknown> | null = null;
  if (Date.now() - lastSweep > SWEEP_EVERY_MS) {
    lastSweep = Date.now();
    sweep = db.rpc("expire_bookings"); // resolves to { error } — never throws
  }
  const [{ data, error }] = await Promise.all([
    db.from("ticket_availability").select("*").eq("is_active", true).order("sort_order", { ascending: true }),
    sweep,
    syncCatalogToSupabase(db),
  ]);
  if (error) throw error;
  return listedTiers((data ?? []) as TicketType[]);
}

export async function getTicketType(id: string): Promise<TicketType | null> {
  if (!isOnSale(id)) return null;
  if (!isSupabaseConfigured()) return getTicketTypeLocal(id);
  const { data, error } = await supabaseAdmin()
    .from("ticket_availability")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  const row = (data as TicketType) ?? null;
  if (!row) return null;
  return listedTiers([row])[0] ?? null;
}

let catalogSync: Promise<void> | null = null;

/** Keep live ticket_types aligned with CATALOG (drop VIP, Couple ₹500). */
function syncCatalogToSupabase(db: ReturnType<typeof supabaseAdmin>) {
  if (catalogSync) return catalogSync;
  catalogSync = (async () => {
    await db.from("ticket_types").update({ is_active: false }).eq("id", "vip");
    await Promise.all(
      CATALOG.map((t) =>
        db
          .from("ticket_types")
          .update({
            name: t.name,
            tagline: t.tagline,
            description: t.description,
            perks: t.perks,
            price_paise: t.price_paise,
            badge: t.badge,
            admits: t.admits,
            max_per_order: t.max_per_order,
            sort_order: t.sort_order,
            is_active: t.is_active,
          })
          .eq("id", t.id)
      )
    );
  })().catch((err) => {
    catalogSync = null;
    console.error("[catalog] could not sync ticket types", err);
  });
  return catalogSync;
}

/* ────────────────────────────── Bookings ─────────────────────────────────── */

export async function getBooking(id: string): Promise<Booking | null> {
  if (!isSupabaseConfigured()) return getBookingLocal(id);
  const { data, error } = await supabaseAdmin()
    .from("bookings")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as Booking) ?? null;
}

export async function getBookingByOrderId(orderId: string): Promise<Booking | null> {
  if (!isSupabaseConfigured()) return null;
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
  eventDates: string[];
  quantity: number;
  name: string;
  email: string;
  phone: string;
}

/** Creates a pending booking + reserves inventory. Retries on ID collision. */
export async function createPendingBooking(input: CreateInput): Promise<Booking> {
  if (!isOnSale(input.ticketTypeId)) {
    throw new BookingError("TICKET_TYPE_NOT_FOUND", "That pass type no longer exists.");
  }
  const nights = parseEventNights(input.eventDates);
  if (!nights.length) {
    throw new BookingError("INVALID_EVENT_DATE", "Please choose which night you want the pass for.");
  }
  if (!isSupabaseConfigured()) return createPendingBookingLocal({ ...input, eventDates: nights });
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
    if (!error) {
      const created = data as Booking;
      const amount = passAmountPaise(
        Math.round(created.amount_paise / Math.max(1, created.quantity)),
        created.quantity,
        nights.length
      );
      const booking: Booking = {
        ...created,
        event_date: nights[0],
        event_dates: serializeEventNights(nights),
        amount_paise: amount,
      };
      const { error: patchErr } = await db
        .from("bookings")
        .update({
          event_date: nights[0],
          event_dates: booking.event_dates,
          amount_paise: amount,
        })
        .eq("id", booking.id);
      if (patchErr) console.error("[bookings] could not save event dates", patchErr);
      return booking;
    }

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
  if (!isSupabaseConfigured()) return;
  const { error } = await supabaseAdmin()
    .from("bookings")
    .update({ razorpay_order_id: orderId })
    .eq("id", bookingId);
  if (error) throw error;
}

/** Buyer says they paid via UPI. Extends the hold so admin can review. */
export async function declarePaid(id: string, ref?: string): Promise<Booking> {
  if (!isSupabaseConfigured()) return declarePaidLocal(id, ref);
  const booking = await getBooking(id);
  if (!booking) throw new BookingError("BOOKING_NOT_FOUND", "Booking not found.");
  if (booking.status !== "pending") return booking;
  const trimmed = ref?.trim() || null;
  const expires = new Date(Date.now() + EVENT.reviewHours * 3600_000).toISOString();
  const patch: Record<string, string | null> = {
    payment_method: "upi",
    expires_at: expires,
  };
  if (trimmed) patch.razorpay_payment_id = trimmed;
  const { data, error } = await supabaseAdmin()
    .from("bookings")
    .update(patch)
    .eq("id", id)
    .eq("status", "pending")
    .select("*")
    .maybeSingle();
  if (error) {
    if (error.code === "23505") {
      throw new BookingError("UNKNOWN", "That UPI reference is already on another booking.");
    }
    throw error;
  }
  return (data as Booking) ?? booking;
}

export async function releaseBooking(id: string, reason: string) {
  if (!isSupabaseConfigured()) return releaseBookingLocal(id, reason);
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
  if (!isSupabaseConfigured()) return confirmBookingLocal(id, paymentId, method);
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
  if (!isSupabaseConfigured()) return claimEmailSendLocal(id);
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
  if (!isSupabaseConfigured()) return unclaimEmailSendLocal(id);
  const { error } = await supabaseAdmin().from("bookings").update({ email_sent_at: null }).eq("id", id);
  if (error) throw error;
}

export async function expireBookings(): Promise<number> {
  if (!isSupabaseConfigured()) return expireBookingsLocal();
  const { data, error } = await supabaseAdmin().rpc("expire_bookings");
  if (error) throw error;
  return Number(data ?? 0);
}

export async function lookupBooking(id: string, email: string): Promise<Booking | null> {
  if (!isSupabaseConfigured()) return lookupBookingLocal(id, email);
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
  if (!isSupabaseConfigured()) return listUnsentConfirmedLocal(olderThanMs, limit);
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
    event_date: bookingNight(b.event_date),
    event_dates: bookingNights(b),
    ticket_type: { id: tier.id, name: tier.name, admits: tier.admits },
    expires_at: b.expires_at,
    confirmed_at: b.confirmed_at,
    checked_in_at: b.checked_in_at,
    qr_payload: confirmed ? signBookingId(b.id) : null,
    access_token: passAccessToken(b.id, b.email),
    payment_method: b.payment_method,
  };
}
