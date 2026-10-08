import { supabaseAdmin } from "@/lib/supabase";
import { getBookingByOrderId } from "@/lib/bookings";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { handlePaymentSuccess } from "@/lib/payments";
import { fail, json } from "@/lib/http";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

interface RazorpayPaymentEntity {
  id: string;
  order_id: string;
  amount: number;
  status: string;
  method?: string;
  notes?: Record<string, string>;
  error_description?: string;
}

interface RazorpayWebhook {
  event: string;
  payload: {
    payment?: { entity: RazorpayPaymentEntity };
    order?: { entity: { id: string; receipt?: string; notes?: Record<string, string> } };
  };
}

/**
 * Razorpay webhook. Configure in Dashboard → Webhooks with events:
 *   payment.captured, payment.failed, order.paid
 *
 * Idempotency, layered:
 *   1. webhook_events ledger keyed by x-razorpay-event-id. An event is recorded
 *      only AFTER it was handled, so a delivery that failed (500 / timeout) is
 *      reprocessed when Razorpay retries instead of being dropped as a dupe.
 *   2. confirm_booking is a DB state transition (first call wins)
 *   3. email send is an atomic claim on email_sent_at
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature");
  if (!verifyWebhookSignature(raw, signature)) {
    console.warn("[webhook] bad signature");
    return fail(400, "Invalid signature.");
  }

  let evt: RazorpayWebhook;
  try {
    evt = JSON.parse(raw);
  } catch {
    return fail(400, "Invalid JSON.");
  }
  if (!evt?.event || !evt.payload) return fail(400, "Malformed event.");

  const eventId =
    req.headers.get("x-razorpay-event-id") ??
    `${evt.event}:${evt.payload.payment?.entity.id ?? evt.payload.order?.entity.id ?? "unknown"}`;

  const db = supabaseAdmin();

  // 1. Fast path for exact redeliveries of an event we already handled.
  const { data: seen, error: seenErr } = await db
    .from("webhook_events")
    .select("id")
    .eq("id", eventId)
    .maybeSingle();
  if (seenErr) console.error("[webhook] ledger read error", seenErr); // downstream is idempotent
  if (seen) return json({ ok: true, duplicate: true });

  let result: Record<string, unknown>;
  try {
    result = await handle(evt);
  } catch (err) {
    console.error("[webhook] handler error", err);
    // 500 → Razorpay retries with back-off. Nothing was recorded, so the retry
    // is processed in full; handlers are idempotent.
    return fail(500, "Handler error.");
  }

  // 2. Record only after success. A concurrent duplicate may have beaten us here.
  const { error: ledgerErr } = await db
    .from("webhook_events")
    .upsert(
      { id: eventId, provider: "razorpay", event: evt.event, payload: evt },
      { onConflict: "id", ignoreDuplicates: true }
    );
  if (ledgerErr) console.error("[webhook] ledger write error", ledgerErr);

  return json({ ok: true, ...result });
}

async function handle(evt: RazorpayWebhook): Promise<Record<string, unknown>> {
  switch (evt.event) {
    case "payment.captured":
    case "order.paid": {
      // order.paid always carries the payment entity; without it we have no
      // payment ID to record, so let payment.captured do the work.
      const payment = evt.payload.payment?.entity;
      if (!payment?.id || !payment.order_id) return { ignored: "no payment entity" };
      if (payment.status && payment.status !== "captured") return { ignored: `payment ${payment.status}` };

      const booking = await getBookingByOrderId(payment.order_id);
      if (!booking) {
        console.warn(`[webhook] no booking for order ${payment.order_id}`);
        return { ignored: "unknown order" };
      }
      if (Number(payment.amount) !== booking.amount_paise) {
        console.error(
          `[webhook] AMOUNT MISMATCH for ${booking.id}: paid ${payment.amount}, expected ${booking.amount_paise} — needs manual review`
        );
        return { ignored: "amount mismatch" };
      }
      await handlePaymentSuccess({
        bookingId: booking.id,
        paymentId: payment.id,
        method: payment.method ?? null,
        source: "webhook",
        priorStatus: booking.status,
      });
      return {};
    }

    case "payment.failed": {
      // Deliberately does NOT release the hold. Razorpay Checkout keeps the
      // modal open so the buyer can retry on the SAME order; releasing here
      // would hand their seats to someone else mid-retry. The hold is released
      // when the buyer dismisses Checkout, or by expiry.
      const payment = evt.payload.payment?.entity;
      console.info(
        `[webhook] payment failed for order ${payment?.order_id ?? "?"}: ${payment?.error_description ?? "unknown"}`
      );
      return { noted: "payment.failed" };
    }

    default:
      return { ignored: evt.event };
  }
}
