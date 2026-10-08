import "server-only";
import Razorpay from "razorpay";
import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "./env";

let instance: Razorpay | null = null;

export function razorpay(): Razorpay {
  if (instance) return instance;
  instance = new Razorpay({
    key_id: env.razorpayKeyId,
    key_secret: env.razorpayKeySecret,
  });
  return instance;
}

export interface CreatedOrder {
  id: string;
  amount: number;
  currency: string;
}

export async function createOrder(params: {
  amountPaise: number;
  bookingId: string;
  email: string;
  name: string;
  ticketTypeId: string;
  quantity: number;
}): Promise<CreatedOrder> {
  const order = await razorpay().orders.create({
    amount: params.amountPaise,
    currency: "INR",
    receipt: params.bookingId,
    // Metadata — ties the payment back to our booking in the webhook.
    notes: {
      booking_id: params.bookingId,
      ticket_type: params.ticketTypeId,
      quantity: String(params.quantity),
      email: params.email,
      name: params.name,
    },
    payment_capture: true,
  } as Parameters<ReturnType<typeof razorpay>["orders"]["create"]>[0]);
  return {
    id: order.id,
    amount: Number(order.amount),
    currency: order.currency,
  };
}

/** Verifies the signature Razorpay Checkout hands back to the browser. */
export function verifyCheckoutSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}) {
  const expected = createHmac("sha256", env.razorpayKeySecret)
    .update(`${params.orderId}|${params.paymentId}`)
    .digest("hex");
  return safeHexEqual(expected, params.signature);
}

/** Verifies the X-Razorpay-Signature header on a raw webhook body. */
export function verifyWebhookSignature(rawBody: string, signature: string | null) {
  if (!signature) return false;
  const expected = createHmac("sha256", env.razorpayWebhookSecret).update(rawBody).digest("hex");
  return safeHexEqual(expected, signature);
}

function safeHexEqual(a: string, b: string) {
  if (!a || !b || a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
  } catch {
    return false;
  }
}

/** Fetch a payment from Razorpay (used to double-check capture on verify). */
export async function fetchPayment(paymentId: string) {
  return razorpay().payments.fetch(paymentId);
}

/**
 * True if the order has a payment that is authorized or captured — i.e. money
 * is moving even though the buyer closed Checkout (common with UPI collect).
 */
export async function orderHasLivePayment(orderId: string): Promise<boolean> {
  const { items } = await razorpay().orders.fetchPayments(orderId);
  return (items ?? []).some((p) => p.status === "authorized" || p.status === "captured");
}
