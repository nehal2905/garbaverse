import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format paise → "₹1,299" (no decimals when whole rupees). */
export function formatINR(paise: number) {
  const rupees = paise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: Number.isInteger(rupees) ? 0 : 2,
  }).format(rupees);
}

/** Format paise → "Rs. 1,299" for the PDF (built-in PDF fonts have no ₹ glyph). */
export function formatINRPlain(paise: number) {
  const rupees = paise / 100;
  return `Rs. ${new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: Number.isInteger(rupees) ? 0 : 2,
    minimumFractionDigits: Number.isInteger(rupees) ? 0 : 2,
  }).format(rupees)}`;
}

/**
 * Normalise an Indian mobile number to its 10 national digits, or null if invalid.
 * Accepts the common ways people type it: "98765 43210", "+91 98765-43210",
 * "919876543210", "09876543210".
 */
export function normaliseIndianMobile(input: string): string | null {
  let d = input.replace(/[\s\-().]/g, "");
  if (d.startsWith("+91")) d = d.slice(3);
  else if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  else if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? d : null;
}

export function pluralise(n: number, one: string, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export const BOOKING_ID_PATTERN = /^GV-[A-HJ-NP-Z2-9]{6}$/;

export function normaliseBookingId(input: string) {
  const s = input.trim().toUpperCase().replace(/\s+/g, "");
  return s.startsWith("GV-") ? s : s.startsWith("GV") ? `GV-${s.slice(2)}` : `GV-${s}`;
}
