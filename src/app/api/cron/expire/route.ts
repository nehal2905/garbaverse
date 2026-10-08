import { expireBookings, listUnsentConfirmed } from "@/lib/bookings";
import { env } from "@/lib/env";
import { ensurePassEmail } from "@/lib/payments";
import { fail, json } from "@/lib/http";
import { safeEqual } from "@/lib/signing";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Vercel Cron (see vercel.json) hits this every 5 minutes to:
 *   1. release holds that were never paid (the app also expires lazily), and
 *   2. retry pass emails that failed to send (provider outage, bad config).
 */
export async function GET(req: Request) {
  const secret = env.cronSecret;
  if (!secret) {
    // Fail closed in production: an unauthenticated endpoint that writes to the
    // database is a free DoS lever. Locally it stays open for convenience.
    if (process.env.NODE_ENV === "production") {
      console.error("[cron:expire] CRON_SECRET is not set — refusing to run");
      return fail(503, "Cron is not configured.");
    }
  } else if (!safeEqual(req.headers.get("authorization") ?? "", `Bearer ${secret}`)) {
    return fail(401, "Unauthorized.");
  }

  let released = 0;
  try {
    released = await expireBookings();
  } catch (err) {
    console.error("[cron:expire]", err);
    return fail(500, "Expiry failed.");
  }

  let emailsRetried = 0;
  let emailsSent = 0;
  try {
    const unsent = await listUnsentConfirmed();
    for (const b of unsent) {
      emailsRetried++;
      if (await ensurePassEmail(b)) emailsSent++;
    }
  } catch (err) {
    console.error("[cron:email-retry]", err);
  }

  return json({ ok: true, released, emailsRetried, emailsSent });
}
