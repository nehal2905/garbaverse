import { expireBookings, getBookingWithTier, toPublicBooking } from "@/lib/bookings";
import { schedulePassEmail } from "@/lib/payments";
import { verifyPassAccessToken } from "@/lib/signing";
import { fail, json } from "@/lib/http";
import { BOOKING_ID_PATTERN } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** Status poll for the success page. Token-gated. */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const token = new URL(req.url).searchParams.get("t") ?? "";
  if (!BOOKING_ID_PATTERN.test(id)) return fail(404, "Booking not found.");

  const result = await getBookingWithTier(id);
  if (!result) return fail(404, "Booking not found.");
  const { booking, tier } = result;

  if (!verifyPassAccessToken(booking.id, booking.email, token)) {
    return fail(403, "You don't have access to this booking.");
  }

  // Keep the status honest: expire stale holds; self-heal a missed email.
  if (booking.status === "pending" && new Date(booking.expires_at) < new Date()) {
    await expireBookings();
    const fresh = await getBookingWithTier(id);
    if (fresh) return json(toPublicBooking(fresh.booking, fresh.tier));
  }
  // Self-heal a missed email without making the poll wait on PDF + provider.
  schedulePassEmail(booking);

  return json(toPublicBooking(booking, tier));
}
