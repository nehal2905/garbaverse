import { NextResponse } from "next/server";

export function json<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, { ...init, headers: { "Cache-Control": "no-store", ...init?.headers } });
}

export function fail(status: number, message: string, extra?: Record<string, unknown>) {
  return json({ error: message, ...extra }, { status });
}

/**
 * Tiny in-memory rate limiter (per serverless instance). Good enough to blunt
 * casual abuse of lookup / booking endpoints; pair with Vercel WAF for more.
 * Limits are deliberately generous: in India, campus Wi-Fi and mobile carrier
 * NAT (Jio/Airtel) put hundreds of real buyers behind ONE public IP. Inventory
 * is protected by Postgres row locks, not by this.
 */
const buckets = new Map<string, { count: number; reset: number }>();
let lastSweep = 0;
export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  // Evict expired buckets once a minute so a warm instance doesn't grow forever.
  if (now - lastSweep > 60_000) {
    lastSweep = now;
    for (const [k, v] of buckets) if (v.reset < now) buckets.delete(k);
  }
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  b.count += 1;
  return b.count <= limit;
}

export function clientIp(req: Request) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}
