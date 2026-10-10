import { getBooking, releaseBooking } from "@/lib/bookings";
import { verifyPassAccessToken } from "@/lib/signing";
import { fail, json } from "@/lib/http";
import { BOOKING_ID_PATTERN } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * Buyer walked away before paying. Don't release if they already marked it paid
 * — admin still needs to check the UPI.
 */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const token = new URL(req.url).searchParams.get("t") ?? "";
  if (!BOOKING_ID_PATTERN.test(id)) return fail(404, "Booking not found.");

  const booking = await getBooking(id);
  if (!booking) return fail(404, "Booking not found.");
  if (!verifyPassAccessToken(booking.id, booking.email, token)) return fail(403, "Forbidden.");
  if (booking.status !== "pending") return json({ released: false, status: booking.status });
  if (booking.payment_method) {
    return json({ released: false, status: "pending", paymentInFlight: true });
  }

  const released = await releaseBooking(id, "abandoned");
  return json({ released, status: released ? "cancelled" : booking.status });
}
