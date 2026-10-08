import "server-only";
import { env } from "./env";
import { passAccessToken } from "./signing";
import type { Booking } from "./types";

/** All the URLs a pass holder needs. Token-gated so IDs alone reveal nothing. */
export function passLinks(b: Pick<Booking, "id" | "email">) {
  const t = passAccessToken(b.id, b.email);
  const base = env.siteUrl;
  return {
    view: `${base}/booking/${b.id}?t=${t}`,
    pdf: `${base}/api/pass/${b.id}/pdf?t=${t}`,
    ics: `${base}/api/pass/${b.id}/ics?t=${t}`,
    token: t,
  };
}
