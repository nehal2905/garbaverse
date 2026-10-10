import { z } from "zod";
import { isAdminRequest } from "@/lib/admin-auth";
import { getBooking } from "@/lib/bookings";
import { handlePaymentSuccess } from "@/lib/payments";
import { fail, json } from "@/lib/http";
import { BOOKING_ID_PATTERN } from "@/lib/utils";

export const dynamic = "force-dynamic";

const schema = z.object({
  id: z.string(),
  ref: z.string().trim().max(40).optional(),
});

/** Organiser confirms a UPI payment after checking their bank / UPI app. */
export async function POST(req: Request) {
  if (!(await isAdminRequest())) return fail(401, "Unauthorized.");
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success || !BOOKING_ID_PATTERN.test(parsed.data.id)) return fail(400, "Invalid ID.");

  const booking = await getBooking(parsed.data.id);
  if (!booking) return fail(404, "Booking not found.");
  if (booking.status === "cancelled" && !booking.payment_method) {
    return fail(409, "This hold expired before anyone marked it paid.");
  }

  try {
    const confirmed = await handlePaymentSuccess({
      bookingId: booking.id,
      paymentId: parsed.data.ref || booking.razorpay_payment_id || `manual-${booking.id}`,
      method: booking.payment_method ?? "upi",
      source: "admin",
      priorStatus: booking.status,
    });
    return json({ ok: true, status: confirmed.status });
  } catch (err) {
    console.error("[admin:confirm]", err);
    return fail(500, "Could not confirm this booking.");
  }
}
