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
  return [
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "NEXT_PUBLIC_RAZORPAY_KEY_ID",
    "RAZORPAY_KEY_SECRET",
    "BOOKING_SIGNING_SECRET",
  ].filter((k) => {
    const v = process.env[k]?.trim();
    return !v || PLACEHOLDER.test(v);
  });
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
    return required("BOOKING_SIGNING_SECRET");
  },
  get adminPassword() {
    return required("ADMIN_PASSWORD");
  },
  get cronSecret() {
    return process.env.CRON_SECRET ?? "";
  },
  get isLiveMode() {
    return (process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "").startsWith("rzp_live_");
  },
};
