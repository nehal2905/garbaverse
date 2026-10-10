import "server-only";

/**
 * Centralised, fail-fast access to server environment variables.
 * Each accessor throws a clear error at call time if the key is missing,
 * so misconfiguration surfaces immediately in logs rather than as a 500 later.
 */
function required(name: string): string {
  const v = process.env[name];
  if (!v || v.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return v;
}

/**
 * Public base URL (no trailing slash). Every emailed link and QR image depends
 * on it, so fall back to Vercel's production domain rather than localhost.
 */
export function resolveSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercel) return `https://${vercel.replace(/\/+$/, "")}`;
  return "http://localhost:3000";
}

/** Values copied verbatim from .env.example count as "not set". */
const PLACEHOLDER = /x{6,}|replace-with|change-me|^eyJhbGciOi\.\.\.$/i;

/**
 * Env vars that must be real for checkout to work. Returns the missing ones
 * (empty array = ready), so callers can fail fast with a precise message
 * instead of crashing deep inside a request.
 */
export function missingCheckoutConfig(): string[] {
  // UPI QR checkout works without Razorpay or Supabase (local file store).
  // Production still needs a signing secret so pass QRs stay stable.
  const secret = process.env.BOOKING_SIGNING_SECRET?.trim();
  if (secret && !PLACEHOLDER.test(secret)) return [];
  if (process.env.NODE_ENV !== "production") return [];
  return ["BOOKING_SIGNING_SECRET"];
}

export const env = {
  get siteUrl() {
    return resolveSiteUrl();
  },
  get supabaseUrl() {
    return required("NEXT_PUBLIC_SUPABASE_URL");
  },
  get supabaseServiceRoleKey() {
    return required("SUPABASE_SERVICE_ROLE_KEY");
  },
  get razorpayKeyId() {
    return required("NEXT_PUBLIC_RAZORPAY_KEY_ID");
  },
  get razorpayKeySecret() {
    return required("RAZORPAY_KEY_SECRET");
  },
  get razorpayWebhookSecret() {
    return required("RAZORPAY_WEBHOOK_SECRET");
  },
  get resendApiKey() {
    return required("RESEND_API_KEY");
  },
  get emailFrom() {
    return required("EMAIL_FROM");
  },
  get emailReplyTo() {
    return process.env.EMAIL_REPLY_TO ?? "studentsurge@gmail.com";
  },
  get signingSecret() {
    const v = process.env.BOOKING_SIGNING_SECRET?.trim();
    if (v && !PLACEHOLDER.test(v)) return v;
    if (process.env.NODE_ENV !== "production") {
      return "local-dev-signing-secret-not-for-production";
    }
    return required("BOOKING_SIGNING_SECRET");
  },
  get adminPassword() {
    const v = process.env.ADMIN_PASSWORD?.trim();
    if (v && !PLACEHOLDER.test(v)) return v;
    if (process.env.NODE_ENV !== "production") return "garbaverse";
    return required("ADMIN_PASSWORD");
  },
  get cronSecret() {
    return process.env.CRON_SECRET ?? "";
  },
  get isLiveMode() {
    return (process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "").startsWith("rzp_live_");
  },
};
