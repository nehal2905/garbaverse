import { ADMIN_COOKIE, adminCookieOptions, checkAdminPassword, createAdminSession } from "@/lib/admin-auth";
import { clientIp, fail, json, rateLimit } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!rateLimit(`admin-login:${clientIp(req)}`, 8, 15 * 60 * 1000)) {
    return fail(429, "Too many attempts. Try again in 15 minutes.");
  }
  const body = (await req.json().catch(() => ({}))) as { password?: unknown };
  if (!checkAdminPassword(body?.password)) {
    return fail(401, "Incorrect password.");
  }
  const res = json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, createAdminSession(), adminCookieOptions());
  return res;
}

export async function DELETE() {
  const res = json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", { ...adminCookieOptions(), maxAge: 0 });
  return res;
}
