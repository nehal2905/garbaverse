import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { EVENT } from "@/lib/event";
import { publicPayment, upiPayUrl } from "@/lib/payment";
import { qrPngBuffer } from "@/lib/qr";

export const dynamic = "force-dynamic";

const FILES: Array<[string, string]> = [
  ["pay-qr.png", "image/png"],
  ["pay-qr.jpg", "image/jpeg"],
  ["pay-qr.jpeg", "image/jpeg"],
  ["pay-qr.webp", "image/webp"],
];

function staticQr() {
  for (const [name, type] of FILES) {
    const path = join(process.cwd(), "public", "art", name);
    if (existsSync(path)) return { body: readFileSync(path), type };
  }
  return null;
}

/** Organiser UPI QR. Prefers public/art/pay-qr.* ; else generates from UPI ID. */
export async function GET(req: Request) {
  const own = staticQr();
  if (own) {
    return new Response(own.body, {
      headers: { "Content-Type": own.type, "Cache-Control": "public, max-age=300" },
    });
  }

  const sp = new URL(req.url).searchParams;
  const amountPaise = Number(sp.get("am") ?? 0);
  const note = (sp.get("tn") ?? EVENT.name).slice(0, 50);
  const url = amountPaise > 0 ? upiPayUrl(amountPaise, note) : "";
  if (!url) {
    const { upiId } = publicPayment();
    if (!upiId) return new Response("Payment QR is not configured.", { status: 404 });
  }

  const payload = url || `upi://pay?pa=${publicPayment().upiId}&pn=${encodeURIComponent(EVENT.organiser)}&cu=INR`;
  const png = await qrPngBuffer(payload, 512);
  return new Response(new Uint8Array(png), {
    headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
  });
}
