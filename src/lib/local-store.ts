import "server-only";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { CATALOG } from "./catalog";
import {
  EVENT,
  bookingNights,
  checkedInNights,
  nextCheckInNight,
  parseEventNights,
  passAmountPaise,
  serializeEventNights,
} from "./event";
import { generateBookingId } from "./signing";
import { BookingError, type Booking, type BookingStatus, type TicketType } from "./types";

export interface LocalAdminRow extends Booking {
  ticket_types: { name: string } | null;
}

export interface LocalListParams {
  q?: string;
  status?: BookingStatus | "all";
  page?: number;
  pageSize?: number;
}

const FILE = join(process.cwd(), "data", "bookings.json");

interface FileShape {
  bookings: Booking[];
}

function empty(): FileShape {
  return { bookings: [] };
}

function read(): FileShape {
  if (!existsSync(FILE)) return empty();
  try {
    const parsed = JSON.parse(readFileSync(FILE, "utf8")) as FileShape;
    if (!Array.isArray(parsed.bookings)) return empty();
    return {
      bookings: parsed.bookings.map((b) => {
        const nights = bookingNights(b);
        return {
          ...b,
          event_date: nights[0],
          event_dates: serializeEventNights(nights),
          checked_in_nights: serializeEventNights(checkedInNights(b)) || null,
        };
      }),
    };
  } catch {
    return empty();
  }
}

function write(store: FileShape) {
  mkdirSync(dirname(FILE), { recursive: true });
  writeFileSync(FILE, JSON.stringify(store, null, 2), "utf8");
}

function nowIso() {
  return new Date().toISOString();
}

function isExpired(b: Booking, now = Date.now()) {
  if (b.status !== "pending") return false;
  if (b.payment_method) return false;
  return new Date(b.expires_at).getTime() < now;
}

function expireInPlace(store: FileShape, now = Date.now()) {
  let n = 0;
  for (const b of store.bookings) {
    if (!isExpired(b, now)) continue;
    b.status = "cancelled";
    b.cancelled_at = nowIso();
    b.cancel_reason = b.cancel_reason ?? "expired";
    b.updated_at = nowIso();
    n++;
  }
  return n;
}

function counts() {
  const store = read();
  expireInPlace(store);
  const sold: Record<string, number> = {};
  const reserved: Record<string, number> = {};
  for (const b of store.bookings) {
    if (b.status === "confirmed") sold[b.ticket_type_id] = (sold[b.ticket_type_id] ?? 0) + b.quantity;
    if (b.status === "pending") reserved[b.ticket_type_id] = (reserved[b.ticket_type_id] ?? 0) + b.quantity;
  }
  return { store, sold, reserved };
}

function overlayTier(t: TicketType, sold: Record<string, number>, reserved: Record<string, number>): TicketType {
  const s = sold[t.id] ?? 0;
  const r = reserved[t.id] ?? 0;
  return {
    ...t,
    sold: s,
    reserved: r,
    available: Math.max(0, t.capacity - s - r),
  };
}

export function getTicketTypesLocal(): TicketType[] {
  const { sold, reserved } = counts();
  return CATALOG.filter((t) => t.is_active).map((t) => overlayTier(t, sold, reserved));
}

export function getTicketTypeLocal(id: string): TicketType | null {
  const base = CATALOG.find((t) => t.id === id);
  if (!base) return null;
  const { sold, reserved } = counts();
  return overlayTier(base, sold, reserved);
}

export function getBookingLocal(id: string): Booking | null {
  const store = read();
  expireInPlace(store);
  return store.bookings.find((b) => b.id === id) ?? null;
}

export function createPendingBookingLocal(input: {
  ticketTypeId: string;
  eventDates: string[];
  quantity: number;
  name: string;
  email: string;
  phone: string;
}): Booking {
  const store = read();
  expireInPlace(store);
  const base = CATALOG.find((t) => t.id === input.ticketTypeId && t.is_active);
  if (!base) throw new BookingError("TICKET_TYPE_NOT_FOUND", "That pass type no longer exists.");
  const nights = parseEventNights(input.eventDates);
  if (!nights.length) {
    throw new BookingError("INVALID_EVENT_DATE", "Please choose which night you want the pass for.");
  }
  if (input.quantity < 1) throw new BookingError("INVALID_QUANTITY", "Please choose at least one pass.");
  if (input.quantity > base.max_per_order) {
    throw new BookingError("QUANTITY_EXCEEDS_LIMIT", "That quantity exceeds the per-order limit.");
  }

  const sold = store.bookings
    .filter((b) => b.ticket_type_id === base.id && b.status === "confirmed")
    .reduce((s, b) => s + b.quantity, 0);
  const reserved = store.bookings
    .filter((b) => b.ticket_type_id === base.id && b.status === "pending")
    .reduce((s, b) => s + b.quantity, 0);
  const available = Math.max(0, base.capacity - sold - reserved);
  if (available < input.quantity) {
    throw new BookingError(
      "SOLD_OUT",
      available > 0 ? `Only ${available} left in this tier.` : "This tier is sold out.",
      available
    );
  }

  const created = nowIso();
  const booking: Booking = {
    id: generateBookingId(),
    ticket_type_id: base.id,
    event_date: nights[0],
    event_dates: serializeEventNights(nights),
    quantity: input.quantity,
    attendees: input.quantity * base.admits,
    amount_paise: passAmountPaise(base.price_paise, input.quantity, nights.length),
    currency: EVENT.currency,
    name: input.name,
    email: input.email.trim().toLowerCase(),
    phone: input.phone,
    status: "pending",
    razorpay_order_id: null,
    razorpay_payment_id: null,
    payment_method: null,
    expires_at: new Date(Date.now() + EVENT.holdMinutes * 60_000).toISOString(),
    confirmed_at: null,
    cancelled_at: null,
    cancel_reason: null,
    email_sent_at: null,
    checked_in_at: null,
    checked_in_by: null,
    checked_in_nights: null,
    created_at: created,
    updated_at: created,
  };
  store.bookings.unshift(booking);
  write(store);
  return booking;
}

export function declarePaidLocal(id: string, ref?: string): Booking {
  const store = read();
  const b = store.bookings.find((x) => x.id === id);
  if (!b) throw new BookingError("BOOKING_NOT_FOUND", "Booking not found.");
  if (b.status !== "pending") return b;
  const trimmed = ref?.trim() || null;
  if (trimmed) {
    const clash = store.bookings.find((x) => x.id !== id && x.razorpay_payment_id === trimmed);
    if (clash) throw new BookingError("UNKNOWN", "That UPI reference is already on another booking.");
    b.razorpay_payment_id = trimmed;
  }
  b.payment_method = "upi";
  b.expires_at = new Date(Date.now() + EVENT.reviewHours * 3600_000).toISOString();
  b.updated_at = nowIso();
  write(store);
  return b;
}

export function confirmBookingLocal(
  id: string,
  paymentId: string,
  method?: string | null
): { transitioned: boolean; booking: Booking } {
  const store = read();
  const b = store.bookings.find((x) => x.id === id);
  if (!b) throw new BookingError("BOOKING_NOT_FOUND", "Booking not found.");
  if (b.status === "confirmed") return { transitioned: false, booking: b };
  b.status = "confirmed";
  b.confirmed_at = nowIso();
  b.cancelled_at = null;
  b.cancel_reason = null;
  b.razorpay_payment_id = b.razorpay_payment_id ?? paymentId;
  b.payment_method = method ?? b.payment_method ?? "upi";
  b.updated_at = nowIso();
  write(store);
  return { transitioned: true, booking: b };
}

export function releaseBookingLocal(id: string, reason: string): boolean {
  const store = read();
  const b = store.bookings.find((x) => x.id === id);
  if (!b || b.status !== "pending") return false;
  b.status = "cancelled";
  b.cancelled_at = nowIso();
  b.cancel_reason = reason;
  b.updated_at = nowIso();
  write(store);
  return true;
}

export function claimEmailSendLocal(id: string): boolean {
  const store = read();
  const b = store.bookings.find((x) => x.id === id);
  if (!b || b.status !== "confirmed" || b.email_sent_at) return false;
  b.email_sent_at = nowIso();
  b.updated_at = nowIso();
  write(store);
  return true;
}

export function unclaimEmailSendLocal(id: string) {
  const store = read();
  const b = store.bookings.find((x) => x.id === id);
  if (!b) return;
  b.email_sent_at = null;
  b.updated_at = nowIso();
  write(store);
}

export function expireBookingsLocal(): number {
  const store = read();
  const n = expireInPlace(store);
  if (n) write(store);
  return n;
}

export function lookupBookingLocal(id: string, email: string): Booking | null {
  const store = read();
  expireInPlace(store);
  return (
    store.bookings.find((b) => b.id === id && b.email === email.trim().toLowerCase()) ?? null
  );
}

export function listUnsentConfirmedLocal(olderThanMs = 2 * 60_000, limit = 25): Booking[] {
  const cutoff = Date.now() - olderThanMs;
  return read()
    .bookings.filter(
      (b) =>
        b.status === "confirmed" &&
        !b.email_sent_at &&
        b.confirmed_at &&
        new Date(b.confirmed_at).getTime() < cutoff
    )
    .sort((a, b) => (a.confirmed_at ?? "").localeCompare(b.confirmed_at ?? ""))
    .slice(0, limit);
}

function withTierName(b: Booking): LocalAdminRow {
  const t = CATALOG.find((x) => x.id === b.ticket_type_id);
  return { ...b, ticket_types: t ? { name: t.name } : null };
}

export function listBookingsLocal(params: LocalListParams) {
  const store = read();
  expireInPlace(store);
  const page = Math.max(1, Math.floor(params.page ?? 1) || 1);
  const pageSize = Math.min(100, Math.max(10, Math.floor(params.pageSize ?? 25) || 25));
  const term = (params.q ?? "").trim().toLowerCase();
  let rows = store.bookings.slice();
  if (params.status && params.status !== "all") rows = rows.filter((b) => b.status === params.status);
  if (term) {
    rows = rows.filter((b) =>
      [b.name, b.email, b.phone, b.id, b.razorpay_payment_id ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }
  rows.sort((a, b) => b.created_at.localeCompare(a.created_at));
  const total = rows.length;
  const start = (page - 1) * pageSize;
  return {
    rows: rows.slice(start, start + pageSize).map(withTierName),
    total,
    page,
    pageSize,
  };
}

export function allBookingsForExportLocal(): LocalAdminRow[] {
  const store = read();
  expireInPlace(store);
  return store.bookings
    .slice()
    .sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id))
    .map(withTierName);
}

export function adminStatsLocal() {
  const { store, sold, reserved } = counts();
  const confirmed = store.bookings.filter((b) => b.status === "confirmed");
  const pending = store.bookings.filter((b) => b.status === "pending");
  return {
    tiers: CATALOG.map((t) => overlayTier(t, sold, reserved)),
    revenuePaise: confirmed.reduce((s, r) => s + r.amount_paise, 0),
    confirmedBookings: confirmed.length,
    attendees: confirmed.reduce((s, r) => s + r.attendees, 0),
    checkedIn: confirmed.filter((r) => r.checked_in_at).length,
    pending: pending.length,
  };
}

export function checkInBookingLocal(id: string, by: string) {
  const store = read();
  const b = store.bookings.find((x) => x.id === id);
  if (!b) return { code: "not_found" as const, booking: null };
  if (b.status !== "confirmed") return { code: "not_confirmed" as const, booking: b };
  const used = checkedInNights(b);
  const next = nextCheckInNight(bookingNights(b), used);
  if (next.reason !== "ok" || !next.night) {
    return { code: next.reason, booking: b };
  }
  const scanned = serializeEventNights([...used, next.night]);
  b.checked_in_nights = scanned;
  b.checked_in_at = b.checked_in_at ?? nowIso();
  b.checked_in_by = by;
  b.updated_at = nowIso();
  write(store);
  return { code: "ok" as const, booking: b };
}

export function undoCheckInLocal(id: string) {
  const store = read();
  const b = store.bookings.find((x) => x.id === id);
  if (!b) return;
  const used = checkedInNights(b);
  const remaining = used.slice(0, -1);
  b.checked_in_nights = remaining.length ? serializeEventNights(remaining) : null;
  b.checked_in_at = remaining.length ? b.checked_in_at : null;
  b.checked_in_by = remaining.length ? b.checked_in_by : null;
  b.updated_at = nowIso();
  write(store);
}

