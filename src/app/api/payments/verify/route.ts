import { z } from "zod";
import { getBooking } from "@/lib/bookings";
import { fetchPayment, verifyCheckoutSignature } from "@/lib/razorpay";
import { handlePaymentSuccess } from "@/lib/payments";
import { verifyPassAccessToken } from "@/lib/signing";
import { clientIp, fail, json, rateLimit } from "@/lib/http";
import { BOOKING_ID_PATTERN } from "@/lib/utils";

export const dynamic = "force-dynamic";

const schema = z.object({
  bookingId: z.string().regex(BOOKING_ID_PATTERN),
  accessToken: z.string().min(1).max(64),
  razorpay_order_id: z.string().min(1).max(64),
  razorpay_payment_id: z.string().min(1).max(64),
  razorpay_signature: z.string().min(1).max(256),
});

/**
 * Browser-side success path. Razorpay Checkout hands back
 * (order_id, payment_id, signature); we verify the HMAC with our key secret,
 * make sure the order belongs to this booking, double-check with Razorpay's
 * API that the payment is actually captured, then confirm.
 *
 * The webhook does the same job independently — whichever lands first wins,
 * the other is a no-op.
 */
export async function POST(req: Request) {
  if (!rateLimit(`verify:${clientIp(req)}`, 60, 10 * 60 * 1000)) {
    return fail(429, "Too many attempts. Please wait a few minutes.");
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(400, "Invalid payload.");
  const p = parsed.data;

  const booking = await getBooking(p.bookingId);
  if (!booking) return fail(404, "Booking not found.");
  if (!verifyPassAccessToken(booking.id, booking.email, p.accessToken)) {
    return fail(403, "Forbidden.");
  }
  if (booking.razorpay_order_id !== p.razorpay_order_id) {
    return fail(400, "Order does not match booking.");
  }
  if (
    !verifyCheckoutSignature({
      orderId: p.razorpay_order_id,
      paymentId: p.razorpay_payment_id,
      signature: p.razorpay_signature,
    })
  ) {
    return fail(400, "Payment signature invalid.");
  }
  if (booking.status === "confirmed") return json({ status: booking.status });

  // Belt and braces: confirm capture + amount with Razorpay before marking paid.
  try {
    const payment = await fetchPayment(p.razorpay_payment_id);
    if (payment.order_id !== p.razorpay_order_id) return fail(400, "Payment/order mismatch.");
    if (Number(payment.amount) !== booking.amount_paise) return fail(400, "Amount mismatch.");
    // Only "captured" is money in the bank. An "authorized" payment that is
    // never captured is auto-refunded by Razorpay — confirming on it would
    // issue a free pass. Let the payment.captured webhook finish the job.
    if (payment.status !== "captured") {
      return json({ status: booking.status, pending: true });
    }
    const confirmed = await handlePaymentSuccess({
      bookingId: booking.id,
      paymentId: p.razorpay_payment_id,
      method: payment.method,
      source: "verify",
      priorStatus: booking.status,
    });
    return json({ status: confirmed.status });
  } catch (err) {
    console.error("[payments:verify]", err);
    // Signature was valid; webhook will finish the job. Tell the client to poll.
    return json({ status: booking.status, pending: true });
  }
}
