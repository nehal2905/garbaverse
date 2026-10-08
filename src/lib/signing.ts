import "server-only";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { env } from "./env";

/** Alphabet without 0/O/1/I to keep IDs readable when spoken at the gate. */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateBookingId() {
  let s = "";
  for (let i = 0; i < 6; i++) s += ALPHABET[randomInt(0, ALPHABET.length)];
  return `GV-${s}`;
}

function hmac(value: string, length = 16) {
  return createHmac("sha256", env.signingSecret).update(value).digest("hex").slice(0, length);
}

/**
 * Signed QR payload: "GV-ABC123.6f1c2a…". The signature lets the gate scanner
 * reject forged / mistyped IDs before even hitting the database.
 */
export function signBookingId(id: string) {
  return `${id}.${hmac(`pass:${id}`)}`;
}

export function verifySignedBookingId(token: string): string | null {
  const [id, sig] = token.trim().split(".");
  if (!id || !sig) return null;
  const expected = hmac(`pass:${id}`);
  if (sig.length !== expected.length) return null;
  const ok = timingSafeEqual(Buffer.from(sig, "utf8"), Buffer.from(expected, "utf8"));
  return ok ? id : null;
}

/**
 * Bearer token embedded in pass links so emails can fetch PDFs without login.
 * It does not expire — treat any URL carrying it as the pass itself.
 */
export function passAccessToken(id: string, email: string) {
  return hmac(`access:${id}:${email.toLowerCase()}`, 24);
}

export function verifyPassAccessToken(id: string, email: string, token: string) {
  const expected = passAccessToken(id, email);
  if (token.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(token, "utf8"), Buffer.from(expected, "utf8"));
}

/** Generic HMAC helper used by admin cookie signing. */
export function sign(value: string) {
  return hmac(`admin:${value}`, 32);
}

export function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}
