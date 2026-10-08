import { NextResponse } from "next/server";
import { getTicketTypes } from "@/lib/bookings";
import { fail } from "@/lib/http";

export const dynamic = "force-dynamic";

/**
 * Public availability, polled every 30s by every open booking page. Cached at
 * Vercel's edge for 5s so a crowd of pollers costs the database ~1 read per 5s
 * per region instead of one per visitor. Up-to-5s-stale numbers are safe: the
 * real check happens inside create_booking under a row lock.
 */
export async function GET() {
  try {
    const tiers = await getTicketTypes();
    return NextResponse.json(
      { tiers },
      {
        headers: {
          // Browsers always revalidate; the CDN serves for 5s, then refreshes
          // in the background while still answering instantly.
          "Cache-Control": "public, max-age=0, must-revalidate",
          "CDN-Cache-Control": "public, s-maxage=5, stale-while-revalidate=25",
        },
      }
    );
  } catch (err) {
    console.error("[tickets]", err);
    return fail(500, "Could not load passes right now.");
  }
}
