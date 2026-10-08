import { isAdminRequest } from "@/lib/admin-auth";
import { getBookingWithTier, unclaimEmailSend } from "@/lib/bookings";
import { ensurePassEmail } from "@/lib/payments";
import { fail, json } from "@/lib/http";
import { BOOKING_ID_PATTERN } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** Re-send the pass email for a confirmed booking (admin only). */
export async function POST(req: Request) {
  if (!(await isAdminRequest())) return fail(401, "Unauthorized.");
  const { id } = (await req.json().catch(() => ({}))) as { id?: string };
  if (!id || !BOOKING_ID_PATTERN.test(id)) return fail(400, "Invalid ID.");

  const res = await getBookingWithTier(id);
  if (!res) return fail(404, "Booking not found.");
  if (res.booking.status !== "confirmed") return fail(409, "Booking is not confirmed.");

  // Reset the claim so ensurePassEmail will send again.
  try {
    await unclaimEmailSend(id);
  } catch (err) {
    console.error("[admin:resend]", err);
    return fail(503, "Could not reset the send. Try again.");
  }
  const sent = await ensurePassEmail({ ...res.booking, email_sent_at: null });
  return sent ? json({ ok: true }) : fail(502, "Email provider rejected the send. Check logs.");
}
