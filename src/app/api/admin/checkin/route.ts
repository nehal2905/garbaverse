import { z } from "zod";
import { isAdminRequest } from "@/lib/admin-auth";
import { checkInBooking, undoCheckIn } from "@/lib/admin-data";
import { getBookingWithTier } from "@/lib/bookings";
import { verifySignedBookingId } from "@/lib/signing";
import { bookingNights, checkedInNights } from "@/lib/event";
import { fail, json } from "@/lib/http";
import { BOOKING_ID_PATTERN, normaliseBookingId } from "@/lib/utils";

export const dynamic = "force-dynamic";

const schema = z.object({
  /** Either a signed QR payload "GV-XXXXXX.<sig>" or a bare ID typed manually. */
  payload: z.string().min(4).max(120),
  by: z.string().max(40).optional(),
});

export async function POST(req: Request) {
  if (!(await isAdminRequest())) return fail(401, "Unauthorized.");
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(400, "Invalid payload.");

  const raw = parsed.data.payload.trim();
  let id: string | null = null;
  let signatureValid = false;

  if (raw.includes(".")) {
    id = verifySignedBookingId(raw);
    signatureValid = Boolean(id);
    if (!id) return json({ code: "invalid_signature", booking: null });
  } else {
    // Manual entry fallback — no signature, so we rely on the DB lookup.
    id = normaliseBookingId(raw);
    if (!BOOKING_ID_PATTERN.test(id)) return json({ code: "not_found", booking: null });
  }

  let result: Awaited<ReturnType<typeof checkInBooking>>;
  let details: Awaited<ReturnType<typeof getBookingWithTier>> = null;
  try {
    result = await checkInBooking(id, parsed.data.by ?? "gate");
    if (result.booking) details = await getBookingWithTier(result.booking.id);
  } catch (err) {
    console.error("[admin:checkin]", err);
    return fail(503, "Check-in service unavailable. Retry, or note the ID for later.");
  }

  return json({
    code: result.code,
    signatureValid,
    booking: details
      ? {
          id: details.booking.id,
          name: details.booking.name,
          tier: details.tier.name,
          event_date: details.booking.event_date,
          event_dates: bookingNights(details.booking),
          checked_in_nights: checkedInNights(details.booking),
          quantity: details.booking.quantity,
          attendees: details.booking.attendees,
          status: details.booking.status,
          checked_in_at: details.booking.checked_in_at,
          checked_in_by: details.booking.checked_in_by,
        }
      : null,
  });
}

/** Undo a check-in (e.g. scanned the wrong phone). */
export async function DELETE(req: Request) {
  if (!(await isAdminRequest())) return fail(401, "Unauthorized.");
  const { id } = (await req.json().catch(() => ({}))) as { id?: string };
  if (!id || !BOOKING_ID_PATTERN.test(id)) return fail(400, "Invalid ID.");
  try {
    await undoCheckIn(id);
  } catch (err) {
    console.error("[admin:checkin:undo]", err);
    return fail(503, "Could not undo. Try again.");
  }
  return json({ ok: true });
}
