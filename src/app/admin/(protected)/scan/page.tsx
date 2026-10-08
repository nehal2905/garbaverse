import type { Metadata } from "next";
import { Scanner } from "./Scanner";

export const metadata: Metadata = { title: "Admin · Check-in", robots: { index: false } };

export default function ScanPage() {
  return (
    <div className="mx-auto max-w-lg">
      <p className="eyebrow">Gate</p>
      <h1 className="mt-2 font-display text-3xl font-bold text-cream">Check-in scanner</h1>
      <p className="mt-2 text-sm text-cream/60">
        Point the camera at a pass QR. Each QR is accepted once; duplicates and unpaid passes are rejected
        with a red screen. You can also type a booking ID.
      </p>
      <div className="mt-6">
        <Scanner />
      </div>
    </div>
  );
}
