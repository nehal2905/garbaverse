/**
 * Single source of truth for event facts. Safe to import on client & server.
 * Edit here → landing page, pass, email, PDF, calendar file all update.
 */
export const EVENT = {
  name: "GarbaVerse",
  subtitle: "Garba & Dandiya Nights",
  organiser: "Student Surge",
  organiserLogo: "/art/student-surge.png",
  tagline: "Where every twirl tells a story.",
  partner: "DR Photo Studios",
  partnerLogo: "/art/dr-photo-studios.png",
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

/** A pass is for one or more of these nights. Prices are per night. */
export const EVENT_NIGHTS = ["2026-10-17", "2026-10-18", "2026-10-19", "2026-10-20"] as const;
export type EventNight = (typeof EVENT_NIGHTS)[number];

export function isEventNight(value: string | null | undefined): value is EventNight {
  return Boolean(value && (EVENT_NIGHTS as readonly string[]).includes(value));
}

export function parseEventNights(raw?: string | string[] | null): EventNight[] {
  const parts = Array.isArray(raw)
    ? raw
    : String(raw ?? "")
        .split(/[,\s]+/)
        .map((s) => s.trim())
        .filter(Boolean);
  return [...new Set(parts.filter(isEventNight))].sort() as EventNight[];
}

export function serializeEventNights(nights: readonly string[]): string {
  return parseEventNights(nights as string[]).join(",");
}

export function bookingNights(
  source?:
    | string
    | string[]
    | null
    | { event_date?: string | null; event_dates?: string | string[] | null }
): EventNight[] {
  if (!source) return [EVENT_NIGHTS[0]];
  if (typeof source === "string" || Array.isArray(source)) {
    const nights = parseEventNights(source);
    return nights.length ? nights : [EVENT_NIGHTS[0]];
  }
  const many = parseEventNights(source.event_dates);
  if (many.length) return many;
  return [bookingNight(source.event_date)];
}

export function bookingNight(date?: string | null): EventNight {
  return bookingNights(date)[0];
}

export function formatEventNights(dates: readonly string[] = [EVENT_NIGHTS[0]]) {
  const nights = parseEventNights(dates as string[]);
  const list = nights.length ? nights : [EVENT_NIGHTS[0]];
  if (list.length === 1) return formatEventNight(list[0]);
  const heads = list.slice(0, -1).map((n) => formatEventNight(n, { year: undefined }));
  return `${heads.join(", ")} & ${formatEventNight(list[list.length - 1])}`;
}

export function passAmountPaise(unitPaise: number, quantity: number, nightCount: number) {
  return unitPaise * quantity * Math.max(1, nightCount);
}

/** Today's calendar date in the event timezone, if it is one of the four nights. */
export function todayEventNight(now: number = Date.now()): EventNight | null {
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: EVENT.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(now));
  return isEventNight(ymd) ? ymd : null;
}

export function checkedInNights(source?: {
  checked_in_nights?: string | string[] | null;
  checked_in_at?: string | null;
  event_date?: string | null;
  event_dates?: string | string[] | null;
}): EventNight[] {
  const marked = parseEventNights(source?.checked_in_nights);
  if (marked.length) return marked;
  if (source?.checked_in_at) return [bookingNights(source)[0]];
  return [];
}

export function nextCheckInNight(
  booked: readonly string[],
  already: readonly string[],
  now: number = Date.now()
): { night: EventNight | null; reason: "ok" | "wrong_night" | "already_used" } {
  const nights = parseEventNights(booked as string[]);
  const used = new Set(parseEventNights(already as string[]));
  const unused = nights.filter((n) => !used.has(n));
  if (!unused.length) return { night: null, reason: "already_used" };
  const today = todayEventNight(now);
  if (today) {
    if (!nights.includes(today)) return { night: null, reason: "wrong_night" };
    if (used.has(today)) return { night: null, reason: "already_used" };
    return { night: today, reason: "ok" };
  }
  return { night: unused[0], reason: "ok" };
}

export function nightStartsAt(date: string) {
  return `${date}T18:00:00+05:30`;
}

export function nightEndsAt(date: string) {
  return `${date}T23:00:00+05:30`;
}

export function formatEventNight(
  date: string = EVENT_NIGHTS[0],
  opts: Intl.DateTimeFormatOptions = {}
) {
  return formatEventDate(nightStartsAt(date), opts);
}

export function isSalesOpen(now: number = Date.now()) {
  return now < new Date(EVENT.salesCloseAt).getTime();
}

/** Absolute URL for a brand mark (emails need a hosted PNG, not a relative path). */
export function brandLogoUrl(origin: string, brand: "organiser" | "partner") {
  const src = brand === "organiser" ? EVENT.organiserLogo : EVENT.partnerLogo;
  return `${origin.replace(/\/+$/, "")}${src}`;
}
