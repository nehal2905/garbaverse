import "server-only";
import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { env } from "./env";
import { safeEqual, sign } from "./signing";

export const ADMIN_COOKIE = "gv_admin";
const SESSION_HOURS = 12;

/**
 * Sessions are bound to the current password: rotating ADMIN_PASSWORD
 * immediately invalidates every outstanding admin cookie.
 */
function sessionSignature(exp: string) {
  const pw = createHash("sha256").update(env.adminPassword).digest("hex").slice(0, 16);
  return sign(`${exp}:${pw}`);
}

/** Cookie value: "<expiresEpochMs>.<hmac>" */
export function createAdminSession() {
  const exp = String(Date.now() + SESSION_HOURS * 3600 * 1000);
  return `${exp}.${sessionSignature(exp)}`;
}

export function verifyAdminSession(value: string | undefined): boolean {
  if (!value) return false;
  const [exp, sig] = value.split(".");
  if (!exp || !sig) return false;
  const expMs = Number(exp);
  if (!Number.isFinite(expMs) || expMs < Date.now()) return false;
  return safeEqual(sessionSignature(exp), sig);
}

export function checkAdminPassword(password: unknown) {
  if (typeof password !== "string" || !password) return false;
  // Hash both sides so the comparison is fixed-length (no length leak via timing).
  const h = (s: string) => createHash("sha256").update(s).digest("hex");
  return safeEqual(h(password), h(env.adminPassword));
}

export async function isAdminRequest() {
  const store = await cookies();
  return verifyAdminSession(store.get(ADMIN_COOKIE)?.value);
}

export function adminCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_HOURS * 3600,
  };
}
