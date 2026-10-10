import { z } from "zod";
import { BookingError, declarePaid, getBooking } from "@/lib/bookings";
import { verifyPassAccessToken } from "@/lib/signing";
import { fail, json } from "@/lib/http";
import { BOOKING_ID_PATTERN } from "@/lib/utils";

export const dynamic = "force-dynamic";

const schema = z.object({
  accessToken: z.string().min(8).max(64),
  ref: z
    .string()
    .trim()
    .max(40)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
});

/** Buyer declares they paid the UPI QR. Admin still has to confirm. */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!BOOKING_ID_PATTERN.test(id)) return fail(404, "Booking not found.");

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(400, "Invalid request.");

  const booking = await getBooking(id);
  if (!booking) return fail(404, "Booking not found.");
  if (!verifyPassAccessToken(booking.id, booking.email, parsed.data.accessToken)) {
    return fail(403, "Forbidden.");
  }
  if (booking.status === "confirmed") return json({ status: "confirmed", bookingId: booking.id });
  if (booking.status !== "pending") return fail(409, "This booking can no longer be paid.");

  try {
    const next = await declarePaid(booking.id, parsed.data.ref);
    return json({ status: next.status, bookingId: next.id, paymentMethod: next.payment_method });
  } catch (err) {
    if (err instanceof BookingError) return fail(400, err.message);
    console.error("[bookings:paid]", err);
    return fail(500, "Could not record your payment. Please try again.");
  }
}
