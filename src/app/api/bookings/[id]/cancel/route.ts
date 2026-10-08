import { getBooking, releaseBooking } from "@/lib/bookings";
import { orderHasLivePayment } from "@/lib/razorpay";
import { verifyPassAccessToken } from "@/lib/signing";
import { fail, json } from "@/lib/http";
import { BOOKING_ID_PATTERN } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * Called when the user closes Razorpay Checkout without paying.
 * Releases the hold immediately instead of waiting out the 10-minute timer.
 * Only pending bookings can be cancelled; confirmed ones are untouched.
 */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const token = new URL(req.url).searchParams.get("t") ?? "";
  if (!BOOKING_ID_PATTERN.test(id)) return fail(404, "Booking not found.");

  const booking = await getBooking(id);
  if (!booking) return fail(404, "Booking not found.");
  if (!verifyPassAccessToken(booking.id, booking.email, token)) return fail(403, "Forbidden.");
  if (booking.status !== "pending") return json({ released: false, status: booking.status });

  // Closing the modal doesn't mean no payment: a UPI collect request can be
  // approved after the buyer dismisses Checkout. If money is moving, keep the
  // hold — the webhook will confirm it, or expiry will release it.
  if (booking.razorpay_order_id) {
    try {
      if (await orderHasLivePayment(booking.razorpay_order_id)) {
        return json({ released: false, status: "pending", paymentInFlight: true });
      }
    } catch (err) {
      // Gateway unreachable: release anyway. A late capture is still honoured
      // by confirm_booking, so the buyer is never charged without a pass.
      console.warn(`[bookings:cancel] payment check failed for ${id}`, err);
    }
  }

  const released = await releaseBooking(id, "abandoned");
  return json({ released, status: released ? "cancelled" : booking.status });
}
