import { EVENT, GATES_OPEN_LABEL } from "./event";

function toICSDate(iso: string) {
  // UTC, e.g. 20261010T123000Z
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function escapeText(s: string) {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

const utf8 = new TextEncoder();

/**
 * RFC 5545 §3.1 line folding: at most 75 OCTETS per line (continuations start
 * with a space, which counts). Measured in UTF-8 bytes and split on code-point
 * boundaries, so non-Latin names and emoji are never cut mid-character.
 */
function fold(line: string) {
  const out: string[] = [];
  let cur = "";
  let bytes = 0;
  for (const ch of line) {
    const n = utf8.encode(ch).length;
    if (bytes + n > 75) {
      out.push(cur);
      cur = " ";
      bytes = 1;
    }
    cur += ch;
    bytes += n;
  }
  out.push(cur);
  return out.join("\r\n");
}

export function buildICS(params: { bookingId: string; name: string; passUrl: string }) {
  const uid = `${params.bookingId}@garbaverse`;
  const description = [
    `Your ${EVENT.name} pass (${params.bookingId}) is confirmed.`,
    `Booked for: ${params.name}`,
    `Show your QR at the gate: ${params.passUrl}`,
    `Gates open ${GATES_OPEN_LABEL}.`,
  ].join("\n");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//GarbaVerse//Passes//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${toICSDate(new Date().toISOString())}`,
    `DTSTART:${toICSDate(EVENT.startsAt)}`,
    `DTEND:${toICSDate(EVENT.endsAt)}`,
    `SUMMARY:${escapeText(`${EVENT.name} — ${EVENT.subtitle}`)}`,
    `DESCRIPTION:${escapeText(description)}`,
    `LOCATION:${escapeText(`${EVENT.venue.name}, ${EVENT.venue.address}`)}`,
    `URL:${params.passUrl}`,
    `GEO:${EVENT.venue.lat};${EVENT.venue.lng}`,
    "STATUS:CONFIRMED",
    "BEGIN:VALARM",
    "TRIGGER:-PT3H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeText(`${EVENT.name} starts in 3 hours — don't forget your pass!`)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}

/** Google Calendar deep link (works without a file download on Android). */
export function googleCalendarUrl(params: { bookingId: string; passUrl: string }) {
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: `${EVENT.name} — ${EVENT.subtitle}`,
    dates: `${toICSDate(EVENT.startsAt)}/${toICSDate(EVENT.endsAt)}`,
    details: `Pass ${params.bookingId}. Show your QR at the gate: ${params.passUrl}`,
    location: `${EVENT.venue.name}, ${EVENT.venue.address}`,
    ctz: EVENT.timezone,
  });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}
