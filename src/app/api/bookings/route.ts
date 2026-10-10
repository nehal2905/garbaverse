import { z } from "zod";
import { BookingError, createPendingBooking } from "@/lib/bookings";
import { passAccessToken } from "@/lib/signing";
import { clientIp, fail, json, rateLimit } from "@/lib/http";
import { missingCheckoutConfig } from "@/lib/env";
import { EVENT, isSalesOpen } from "@/lib/event";
import { publicPayment } from "@/lib/payment";
import { normaliseIndianMobile } from "@/lib/utils";

export const dynamic = "force-dynamic";

const schema = z.object({
  ticketTypeId: z.string().min(1).max(40),
  quantity: z.coerce.number().int().min(1).max(20),
  name: z
    .string()
    .transform((v) => v.replace(/[\u0000-\u001f\u007f]/g, "").replace(/\s+/g, " ").trim())
    .pipe(z.string().min(2, "Please enter your full name").max(80)),
  email: z.string().trim().toLowerCase().email("Please enter a valid email").max(120),
  phone: z
    .string()
    .max(20)
    .transform((v, ctx) => {
      const n = normaliseIndianMobile(v);
      if (!n) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Enter a valid 10-digit Indian mobile number" });
        return z.NEVER;
      }
      return n;
    }),
});

export async function POST(req: Request) {
  if (!isSalesOpen()) {
    return fail(410, "Online sales for this event have closed.", { code: "SALES_CLOSED" });
  }
  const missing = missingCheckoutConfig();
  if (missing.length) {
    console.error(`[bookings:create] checkout not configured — missing: ${missing.join(", ")}`);
    return fail(
      503,
      process.env.NODE_ENV === "production"
        ? "Online booking is temporarily unavailable. Please try again shortly."
        : `Checkout isn't connected yet. Add ${missing.join(", ")} to .env.local, then restart the dev server.`,
      { code: "NOT_CONFIGURED" }
    );
  }
  if (!rateLimit(`book:${clientIp(req)}`, 40, 10 * 60 * 1000)) {
    return fail(429, "Too many attempts. Please wait a few minutes.");
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail(400, "Invalid request body.");
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return fail(400, first?.message ?? "Invalid details.", {
      field: first?.path?.[0] ?? null,
    });
  }
  const input = parsed.data;
  const phone = `+91${input.phone}`;

  try {
    const booking = await createPendingBooking({ ...input, phone });
    const pay = publicPayment();
    return json({
      bookingId: booking.id,
      accessToken: passAccessToken(booking.id, booking.email),
      expiresAt: booking.expires_at,
      amountPaise: booking.amount_paise,
      upiId: pay.upiId,
      payeeName: pay.payeeName,
      eventName: EVENT.name,
    });
  } catch (err) {
    if (err instanceof BookingError) {
      const status = err.code === "SOLD_OUT" ? 409 : 400;
      return fail(status, err.message, { code: err.code, available: err.available ?? null });
    }
    console.error("[bookings:create]", err);
    return fail(500, "Could not start your booking. Please try again.");
  }
}
