import "server-only";
import { getBookingWithTier } from "./bookings";
import { verifyPassAccessToken } from "./signing";
import { BOOKING_ID_PATTERN } from "./utils";
import type { Booking, TicketType } from "./types";

type Result =
  | { ok: true; booking: Booking; tier: TicketType }
  | { ok: false; status: 403 | 404 | 409; message: string };

/** Shared guard for /api/pass/* — valid ID, valid token, confirmed status. */
export async function loadConfirmedPass(id: string, token: string | null): Promise<Result> {
  if (!BOOKING_ID_PATTERN.test(id)) return { ok: false, status: 404, message: "Not found." };
  const res = await getBookingWithTier(id);
  if (!res) return { ok: false, status: 404, message: "Not found." };
  if (!verifyPassAccessToken(res.booking.id, res.booking.email, token ?? "")) {
    return { ok: false, status: 403, message: "Forbidden." };
  }
  if (res.booking.status !== "confirmed") {
    return { ok: false, status: 409, message: "This booking isn't confirmed yet." };
  }
  return { ok: true, ...res };
}
