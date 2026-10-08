# GarbaVerse

Hyderabad’s Garba & Dandiya night — a production booking site for **Student Surge**.

Passes from ₹299. Saturday 10 October 2026, 6:00–11:00 PM IST, Gymkhana Cricket Ground, Secunderabad.

This is a one-event ticketing product: landing → 3-step booking → Razorpay Checkout → signed QR pass (email + PDF) → gate check-in.

## Handoff — status as of 8 Oct 2026

**Live:** https://garbaverse-taupe.vercel.app (Vercel project `garbaverse`, functions pinned to Mumbai `bom1`).

| Area | State |
| --- | --- |
| Supabase | Project `garbaverse` (Mumbai, org "Student Surge"). `supabase/schema.sql` applied and verified: 4 tiers seeded, RLS on, 0 bookings. |
| Vercel env | Set for Production + Preview: Supabase URL + secret key, `BOOKING_SIGNING_SECRET`, `CRON_SECRET`, `ADMIN_PASSWORD`, `EMAIL_FROM`, `EMAIL_REPLY_TO`. |
| Razorpay | **Not set.** Checkout returns "temporarily unavailable" until it is. |
| Resend (pass emails) | **Not set.** |
| Verified live | All pages 200, live tiers from Supabase, cron rejects requests without `CRON_SECRET`, links use the production domain, availability API edge-cached 5 s. |

**Before selling (blockers):**
1. **Razorpay** — add `NEXT_PUBLIC_RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` in Vercel, then **redeploy** (the key ID is inlined at build). Add a webhook → `https://garbaverse-taupe.vercel.app/api/webhooks/razorpay` (events `payment.captured`, `payment.failed`, `order.paid`) and set its secret as `RAZORPAY_WEBHOOK_SECRET`. Live mode needs Razorpay KYC approval, which can take days.
2. **Resend** — add `RESEND_API_KEY` and send from a **verified domain** (`onboarding@resend.dev` only delivers to the Resend account owner). The free plan caps at 100 emails/day.
3. **Vercel plan** — Hobby is non-commercial only; ticket sales need **Pro**. Pro also allows the `*/5` cron (see `vercel.json`) and adding teammates.

**Then:** one end-to-end test in Razorpay test mode — pay → confirmed page → email + PDF → scan at `/admin/scan` → rescan rejected. Before the gates open, export the CSV from `/admin` as a paper fallback, and give gate phones a dedicated hotspot.

**Getting access & secrets:** ask the owner to invite you to the Supabase org and the Vercel project. Secrets are **not** in this repo: copy `.env.example` → `.env.local` and get values from the owner over a password manager, never chat or git. Deploy with `npx vercel deploy --prod` (or connect this repo in Vercel → Settings → Git for auto-deploys).

**Checks:** `npm run typecheck`, `npm run lint`, `npm run build` all pass on this commit.

## Assumptions (locked)

| Item | Value |
| --- | --- |
| Event | GarbaVerse — Garba & Dandiya Night |
| Organiser | Student Surge (`studentsurge@gmail.com`) |
| When | Saturday 10 Oct 2026, 6:00 PM – 11:00 PM IST (gates 5:30) |
| Where | Gymkhana Cricket Ground, Secunderabad, Hyderabad |
| Currency | INR |
| Payments | Razorpay Standard Checkout (hosted modal — we never touch cards) |
| Tiers | General ₹299 (1), Couple ₹549 (2), VIP ₹799 (1), Squad ₹1,299 (5) |
| Capacity | 1,500 / 300 / 200 / 100 **units** (Couple & Squad admit multiple people) |
| Brand | **Noir Vineyard**, matte: midnight `#0b0f1c`, oxblood `#3c0b18`, claret `#7b1024` (fills), parchment `#f2e8e1` (text); dusty rose `#d49aa5` for small accents (claret is too dark to read on midnight). No metallics or glows. Cinzel + Manrope. Tokens in `tailwind.config.ts`; PDF, email and OG image mirror them. |
| Wallet passes | Skipped for v1 (email + PDF + on-screen pass cover the gate) |

Edit facts in `src/lib/event.ts` and prices/capacity in `supabase/schema.sql` (and `src/lib/catalog.ts` for the offline catalog). Checkout **never** trusts client prices.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind + Framer Motion
- Supabase Postgres (inventory, bookings, webhook ledger, RLS)
- Razorpay Standard Checkout + signed webhooks
- Resend + React Email (table-based HTML + plain-text + PDF attachment)
- `qrcode` for signed booking QR · `@react-pdf/renderer` for the pass PDF
- Vercel (including a 5-minute cron that expires unpaid holds)

## Local preview (no keys)

```bash
npm install
cp .env.example .env.local
# You can leave the placeholders. Landing, booking UI, FAQ and find-my-booking
# render from the catalog. Checkout, email and admin need real keys.
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Booking UI: [http://localhost:3000/book](http://localhost:3000/book)  
Pass preview (design only): [http://localhost:3000/preview?v=pass](http://localhost:3000/preview?v=pass)

## Production setup (one sitting)

### 1. Supabase

1. Create a project (region: Mumbai / `ap-south-1`).
2. SQL Editor → paste **the entire** `supabase/schema.sql` → Run.
3. Settings → API:
   - `NEXT_PUBLIC_SUPABASE_URL` = Project URL
   - `SUPABASE_SERVICE_ROLE_KEY` = `service_role` secret (**server only**)
4. Confirm four rows in `ticket_types`. Edit prices/capacity there — not in the UI.

### 2. Razorpay (test mode)

1. [dashboard.razorpay.com](https://dashboard.razorpay.com) → **Test Mode**.
2. Account & Settings → API Keys → generate. Copy:
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID` (`rzp_test_…`)
   - `RAZORPAY_KEY_SECRET`
3. After the site has a public URL (step 5), Webhooks → Add:
   - URL: `https://<your-domain>/api/webhooks/razorpay`
   - Secret: invent a long string → `RAZORPAY_WEBHOOK_SECRET`
   - Events: `payment.captured`, `payment.failed`, `order.paid`

Test cards / UPI: [Razorpay test cards](https://razorpay.com/docs/payments/payments/test-card-upi-details/).

### 3. Resend

1. Create an API key → `RESEND_API_KEY`.
2. Add and verify a domain (SPF + DKIM). Gmail `onboarding@resend.dev` is fine for tests; **not** for production.
3. `EMAIL_FROM="GarbaVerse <passes@yourdomain.com>"`
4. `EMAIL_REPLY_TO=studentsurge@gmail.com`
5. Preview the template locally: `npm run email:dev` → [http://localhost:3030](http://localhost:3030)

### 4. Secrets

```bash
openssl rand -hex 32   # BOOKING_SIGNING_SECRET  (QR + admin cookie)
openssl rand -hex 32   # CRON_SECRET
# ADMIN_PASSWORD = a long passphrase you can type at the gate
```

Put every key from `.env.example` into `.env.local`.

### 5. Vercel

```bash
npx vercel
```

Then Project → Settings → Environment Variables → paste **every** key from `.env.example` (Production + Preview).

Set `NEXT_PUBLIC_SITE_URL` to `https://your-domain.com` (no trailing slash).

`vercel.json` registers `GET /api/cron/expire` **once a day** (00:30 UTC) so it deploys on the Hobby plan. Vercel sends `Authorization: Bearer $CRON_SECRET`. In production the endpoint refuses to run without `CRON_SECRET`.

> **On Vercel Pro**, change the schedule to `*/5 * * * *`. Holds expire lazily on every availability read either way; the faster cron mainly means failed pass emails are retried within minutes instead of daily (admins can also hit **Resend** in `/admin`).

Redeploy after saving env vars. Point the Razorpay webhook at the production URL.

## Going from test → live

1. Razorpay dashboard → **Live Mode** → generate live API keys (`rzp_live_…`).
2. Create a **new** live webhook (test webhooks do not carry over) with a **new** secret.
3. Replace `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` on Vercel. Redeploy.
4. Activate the Razorpay account (KYC, bank settlement).
5. Resend: send only from the verified domain. Send yourself one live pass and open it in Gmail, Outlook, Apple Mail.
6. Buy one real General pass with UPI. Confirm: inventory decrements, email arrives, QR scans at `/admin/scan`, CSV export works.
7. Do **not** reuse test bookings, test order IDs, or the test webhook secret in live.

## Payment contract (do not weaken)

1. Client submits details → server creates a **pending** booking and reserves inventory for 10 minutes. Price = `quantity × ticket_types.price_paise` inside Postgres. Rejected after `EVENT.salesCloseAt`.
2. Server creates a Razorpay order with `booking_id` in notes/receipt → opens Checkout.
3. Webhook verifies `X-Razorpay-Signature`. On `payment.captured` / `order.paid`, `confirm_booking` marks confirmed; the pass email sends **after** the response (`after()`), so Razorpay never times out on PDF rendering. Idempotent: state machine + `email_sent_at` claim + `webhook_events` ledger. The ledger row is written only **after** an event is handled, so a delivery that failed is fully reprocessed on Razorpay's retry.
4. `payment.failed` does **not** release the hold — Checkout lets the buyer retry on the same order. The hold is released on dismiss (unless Razorpay reports an authorized/captured payment in flight) or by expiry.
5. A payment that lands after its hold was released is still honoured (confirmed, `sold` incremented, warning logged). Check capacity in `/admin` if you see `paid after its hold was released` in logs.
6. Success page **polls** `/api/bookings/:id` and never trusts the redirect alone.
7. Browser verify (`/api/payments/verify`) is a second path with HMAC + Razorpay check. Only `captured` confirms — `authorized` waits for the webhook. Whichever lands first wins.
8. The cron retries pass emails that failed to send (`email_sent_at` still null 2+ minutes after confirmation).

## Upgrading an existing database

`supabase/schema.sql` is safe to re-run. **Re-run it after pulling these changes** — it replaces `create_booking` / `expire_bookings` (deadlock fix) and makes `ticket_availability` a `security_invoker` view. No data is touched.

## Gate check-in

1. Open `/admin/login` with `ADMIN_PASSWORD`.
2. `/admin` — search, stats, CSV export, resend pass.
3. `/admin/scan` — camera QR. Valid signed payload → check-in. Duplicate / unpaid / unknown → rejected with a reason.

QR payload is `GV-XXXXXX.<hmac>`. Forged IDs fail before the database.

## Test checklist

Use Razorpay **test** keys. Suggested UPI/card numbers are in their docs.

| Case | How | Expect |
| --- | --- | --- |
| Happy path | Book General × 1, pay with test UPI/card | Pending → confirmed within a few seconds. Pass reveals + confetti. Email with PDF. Inventory `sold` +1, `reserved` −1. |
| Failed payment | Use a Razorpay failure test method | Modal stays for retry; hold is kept. Retry succeeds → confirmed. On dismiss, hold releases. Availability returns. |
| Webhook retry after failure | Make the handler 500 once (e.g. stop Supabase briefly), let Razorpay retry | Retry is processed (not reported as duplicate). Booking confirms. |
| Abandoned checkout | Open pay, close the modal | `POST /api/bookings/:id/cancel` releases the hold immediately. |
| Duplicate webhook | Replay the same `payment.captured` (or resend from dashboard) | HTTP 200 `{ duplicate: true }` or a no-op confirm. **One** email. |
| Sold-out tier | Set `capacity = sold` in SQL, or buy the last unit | Card shows “Sold out”. API returns `409 SOLD_OUT`. |
| Concurrent last-seat | Two browsers on qty=1 of a 1-left tier | Exactly one order succeeds. The other gets sold-out. |
| Expired hold | Wait 10+ minutes (or set `expires_at` in the past, hit `/api/cron/expire`) | Status `cancelled`, reserved returned. |
| Email rendering | `npm run email:dev` + send a test to Gmail, Outlook, iCloud | Table layout, QR image loads (hosted PNG, not a data URI), PDF attached, plain-text part present, Add to Calendar + Maps links work. |
| Find my booking | `/find` with email + ID | Confirmed pass shown. Wrong email → not found. |
| Check-in | Scan the QR twice | First: OK. Second: “already used”. |
| Amount tamper | DevTools: change posted `quantity` or invent a price | Server ignores client price. Postgres computes amount. |

## Project map

```
src/app/page.tsx                 Landing
src/app/book/page.tsx            3-step booking
src/app/booking/[id]/page.tsx    Success (polls status)
src/app/find/page.tsx            Lookup
src/app/admin/                   Password-protected dashboard + scanner
src/app/api/bookings/            Create / status / cancel
src/app/api/webhooks/razorpay/   Signed webhook
src/app/api/payments/verify/     Browser HMAC verify
src/app/api/pass/[id]/           QR PNG, PDF, ICS
src/emails/PassEmail.tsx         Gmail/Outlook/Apple Mail safe
src/lib/event.ts                 Dates, venue, copy
src/lib/bookings.ts              Inventory + state machine
supabase/schema.sql              Tables, RPCs, RLS, seed
```

## Scripts

```bash
npm run dev          # Next.js
npm run build        # Production build
npm run typecheck    # tsc --noEmit
npm run email:dev    # React Email preview on :3030
```
