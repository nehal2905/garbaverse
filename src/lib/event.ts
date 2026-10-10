/**
 * Single source of truth for event facts. Safe to import on client & server.
 * Edit here → landing page, pass, email, PDF, calendar file all update.
 */
export const EVENT = {
  name: "GarbaVerse",
  subtitle: "Garba & Dandiya Nights",
  organiser: "Student Surge",
  tagline: "Where every twirl tells a story.",
  partner: "DR Photo Studios",
  partnerLogo: "/art/dr-photo-studios.jpg",
  // ISO strings with explicit IST offset.
  startsAt: "2026-10-17T18:00:00+05:30",
  endsAt: "2026-10-20T23:00:00+05:30",
  gatesOpenAt: "2026-10-17T17:30:00+05:30",
  // Online sales stop here (enforced server-side in POST /api/bookings).
  salesCloseAt: "2026-10-20T23:00:00+05:30",
  timezone: "Asia/Kolkata",
  venue: {
    name: "Gymkhana Cricket Ground",
    address: "Gymkhana Grounds, Secunderabad, Hyderabad, Telangana 500003",
    shortAddress: "Secunderabad, Hyderabad",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Gymkhana+Cricket+Ground+Secunderabad",
    // Embed uses the free, keyless Google Maps embed endpoint.
    embedUrl:
      "https://www.google.com/maps?q=Gymkhana+Cricket+Ground,+Secunderabad&output=embed",
    lat: 17.4399,
    lng: 78.4983,
  },
  contact: {
    email: "studentsurge@gmail.com",
    instagram: "https://instagram.com/studentsurge",
  },
  currency: "INR",
  holdMinutes: 30,
  // How long a "I've paid" booking waits for the organiser to confirm.
  reviewHours: 48,
  payment: {
    // Your UPI ID (or set NEXT_PUBLIC_UPI_ID). Also drop your QR at public/art/pay-qr.png.
    upiId: "",
    payeeName: "Student Surge",
  },
  ageNote: "All ages welcome. Under-12s enter free with a paying adult.",
} as const;

export function formatEventDate(
  iso: string = EVENT.startsAt,
  opts: Intl.DateTimeFormatOptions = {}
) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: EVENT.timezone,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    ...opts,
  }).format(new Date(iso));
}

export function formatEventTime(iso: string) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: EVENT.timezone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
    .format(new Date(iso))
    // Normalise across ICU versions (some emit U+202F before am/pm, which PDF
    // fonts can't draw and which breaks server/client hydration parity).
    .replace(/\s*(am|pm)\s*$/i, (_, p: string) => ` ${p.toUpperCase()}`);
}

/** "17–20 October 2026" — opening night through closing night. */
export function formatEventDateRange() {
  const startDay = formatEventDate(EVENT.startsAt, {
    weekday: undefined,
    day: "numeric",
    month: undefined,
    year: undefined,
  });
  const endDay = formatEventDate(EVENT.endsAt, {
    weekday: undefined,
    day: "numeric",
    month: undefined,
    year: undefined,
  });
  const monthYear = formatEventDate(EVENT.endsAt, {
    weekday: undefined,
    day: undefined,
    month: "long",
    year: "numeric",
  });
  return `${startDay}–${endDay} ${monthYear}`;
}

export const EVENT_DATE_LABEL = formatEventDateRange();
export const EVENT_TIME_LABEL = `${formatEventTime(EVENT.startsAt)} – ${formatEventTime(EVENT.endsAt)}`;
export const GATES_OPEN_LABEL = formatEventTime(EVENT.gatesOpenAt); // "5:30 PM"

export function isSalesOpen(now: number = Date.now()) {
  return now < new Date(EVENT.salesCloseAt).getTime();
}
