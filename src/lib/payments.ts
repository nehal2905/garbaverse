import "server-only";
import { after } from "next/server";
import {
  claimEmailSend,
  confirmBooking,
  getTicketType,
  unclaimEmailSend,
} from "./bookings";
import { sendPassEmail } from "./email";
import type { Booking, BookingStatus } from "./types";

/**
 * Single entry point for "payment succeeded". Called by the admin confirm
 * path (and leftover verify/webhook routes). Safe to call any number of times:
 *   • confirm_booking is a DB state transition (first call wins)
 *   • the pass email is guarded by an atomic claim on email_sent_at
 *
 * The email (PDF render + provider call, several seconds) runs after the
 * response is sent, so Razorpay's webhook timeout and the buyer's "Confirming…"
 * spinner never wait on it. A failed send is retried by the cron.
 */
export async function handlePaymentSuccess(params: {
  bookingId: string;
  paymentId: string;
  method?: string | null;
  source: "webhook" | "verify" | "admin";
  /** Status the caller saw before confirming; only used for diagnostics. */
  priorStatus?: BookingStatus;
}): Promise<Booking> {
  const { transitioned, booking } = await confirmBooking(
    params.bookingId,
    params.paymentId,
    params.method
  );

  if (transitioned) {
    console.info(`[payments] ${params.bookingId} confirmed via ${params.source}`);
    if (params.priorStatus === "cancelled") {
      // Paid after the hold lapsed. We honour it (the buyer has paid), but it
      // can push `sold` past capacity — surface it for the organiser.
      console.warn(`[payments] ${params.bookingId} was paid after its hold was released; check tier capacity`);
    }
  }

  schedulePassEmail(booking);
  return booking;
}

/** Fire-and-forget the pass email once the current response has been sent. */
export function schedulePassEmail(booking: Booking) {
  if (booking.status !== "confirmed" || booking.email_sent_at) return;
  after(() => ensurePassEmail(booking));
}

/** Sends the pass email if (and only if) nobody has yet. Never throws. */
export async function ensurePassEmail(booking: Booking): Promise<boolean> {
  if (booking.status !== "confirmed" || booking.email_sent_at) return false;
  try {
    if (!(await claimEmailSend(booking.id))) return false;
  } catch (err) {
    console.error(`[email] could not claim send for ${booking.id}`, err);
    return false;
  }

  try {
    const tier = await getTicketType(booking.ticket_type_id);
    if (!tier) throw new Error("Ticket type missing");
    await sendPassEmail(booking, tier);
    console.info(`[email] pass sent for ${booking.id}`);
    return true;
  } catch (err) {
    console.error(`[email] failed for ${booking.id}`, err);
    // Release the claim so the cron / admin resend can retry.
    await unclaimEmailSend(booking.id).catch((e) =>
      console.error(`[email] could not release claim for ${booking.id}`, e)
    );
    return false;
  }
}
