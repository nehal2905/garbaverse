import { isAdminRequest } from "@/lib/admin-auth";
import { listBookings } from "@/lib/admin-data";
import { fail, json } from "@/lib/http";
import type { BookingStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUSES = new Set<BookingStatus | "all">(["all", "pending", "confirmed", "cancelled"]);

export async function GET(req: Request) {
  if (!(await isAdminRequest())) return fail(401, "Unauthorized.");
  const sp = new URL(req.url).searchParams;
  const rawStatus = sp.get("status") ?? "all";
  const status = STATUSES.has(rawStatus as BookingStatus | "all") ? (rawStatus as BookingStatus | "all") : "all";
  try {
    const result = await listBookings({
      q: sp.get("q") ?? undefined,
      status,
      page: Number(sp.get("page")) || 1,
      pageSize: Number(sp.get("pageSize")) || 25,
    });
    return json(result);
  } catch (err) {
    console.error("[admin:bookings]", err);
    return fail(500, "Could not load bookings.");
  }
}
