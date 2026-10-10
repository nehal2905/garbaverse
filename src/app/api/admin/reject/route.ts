import { z } from "zod";
import { isAdminRequest } from "@/lib/admin-auth";
import { getBooking, releaseBooking } from "@/lib/bookings";
import { fail, json } from "@/lib/http";
import { BOOKING_ID_PATTERN } from "@/lib/utils";

export const dynamic = "force-dynamic";

const schema = z.object({ id: z.string() });

/** Organiser did not find the UPI payment — release the hold. */
export async function POST(req: Request) {
  if (!(await isAdminRequest())) return fail(401, "Unauthorized.");
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success || !BOOKING_ID_PATTERN.test(parsed.data.id)) return fail(400, "Invalid ID.");

  const booking = await getBooking(parsed.data.id);
  if (!booking) return fail(404, "Booking not found.");
  if (booking.status === "confirmed") return fail(409, "Already confirmed — cannot reject.");

  const released = await releaseBooking(booking.id, "payment_not_found");
  return json({ ok: true, released, status: released ? "cancelled" : booking.status });
}
