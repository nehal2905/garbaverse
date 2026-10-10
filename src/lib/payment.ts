import { EVENT } from "./event";

/** Public UPI details. Safe on the client — no secrets. */
export function publicPayment() {
  const upiId = (process.env.NEXT_PUBLIC_UPI_ID ?? EVENT.payment.upiId).trim();
  const payeeName = (process.env.NEXT_PUBLIC_UPI_NAME ?? EVENT.payment.payeeName).trim();
  return { upiId, payeeName };
}

export function upiPayUrl(amountPaise: number, note: string) {
  const { upiId, payeeName } = publicPayment();
  if (!upiId) return "";
  const am = (amountPaise / 100).toFixed(2);
  const q = new URLSearchParams({
    pa: upiId,
    pn: payeeName,
    am,
    cu: "INR",
    tn: note.slice(0, 50),
  });
  return `upi://pay?${q.toString()}`;
}
