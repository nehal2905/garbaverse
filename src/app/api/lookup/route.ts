import { z } from "zod";
import { lookupBooking } from "@/lib/bookings";
import { passLinks } from "@/lib/links";
import { clientIp, fail, json, rateLimit } from "@/lib/http";
import { BOOKING_ID_PATTERN, normaliseBookingId } from "@/lib/utils";

export const dynamic = "force-dynamic";

const schema = z.object({
  bookingId: z.string().min(4).max(20),
  email: z.string().trim().email().max(120),
});

const NOT_FOUND = "We couldn't find a booking with those details.";

/** "Find my booking": email + ID → tokenised pass URL. */
export async function POST(req: Request) {
  if (!rateLimit(`lookup:${clientIp(req)}`, 30, 10 * 60 * 1000)) {
    return fail(429, "Too many attempts. Please wait a few minutes.");
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(400, "Enter your booking ID and email.");

  const id = normaliseBookingId(parsed.data.bookingId);
  if (!BOOKING_ID_PATTERN.test(id)) return fail(404, NOT_FOUND);

  try {
    const booking = await lookupBooking(id, parsed.data.email);
    if (!booking) return fail(404, NOT_FOUND);
    const links = passLinks(booking);
    return json({ url: `/booking/${booking.id}?t=${links.token}`, status: booking.status });
  } catch (err) {
    console.error("[lookup]", err);
    return fail(503, "Lookup is unavailable right now. Please try again in a minute.");
  }
}
