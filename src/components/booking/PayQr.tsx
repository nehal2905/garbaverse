"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { formatINR } from "@/lib/utils";
import { publicPayment } from "@/lib/payment";

export function PayQr({
  amountPaise,
  bookingId,
}: {
  amountPaise: number;
  bookingId: string;
}) {
  const { upiId, payeeName } = publicPayment();
  const src = `/api/pay-qr?am=${amountPaise}&tn=${encodeURIComponent(bookingId)}`;
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div className="flex flex-col items-center text-center">
      <div className="rounded-[28px] border border-brand-700/15 bg-white p-4 shadow-card">
        {imgFailed ? (
          <div className="flex h-[220px] w-[220px] items-center justify-center rounded-2xl bg-cream-100 px-4 text-sm text-ink-600">
            Add your UPI QR at <span className="mx-1 font-mono text-brand-600">public/art/pay-qr.png</span>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={`Pay ${formatINR(amountPaise)} to ${payeeName}`}
            width={220}
            height={220}
            className="h-[220px] w-[220px] rounded-2xl object-contain"
            onError={() => setImgFailed(true)}
          />
        )}
      </div>

      <p className="mt-5 font-display text-3xl font-bold text-brand-600">{formatINR(amountPaise)}</p>
      <p className="mt-1 text-sm text-ink-600">Pay exactly this amount to {payeeName}</p>

      <dl className="mt-5 w-full space-y-2 text-left text-sm">
        {upiId && (
          <CopyRow label="UPI ID" value={upiId} />
        )}
        <CopyRow label="Booking ID" value={bookingId} />
        <CopyRow label="Amount" value={formatINR(amountPaise)} />
      </dl>

      <ol className="mt-6 w-full list-decimal space-y-1.5 pl-5 text-left text-sm text-ink-600">
        <li>Scan the QR with GPay, PhonePe or Paytm.</li>
        <li>Pay {formatINR(amountPaise)} — no more, no less.</li>
        <li>
          Put <span className="font-mono font-semibold text-brand-600">{bookingId}</span> in the remarks.
        </li>
        <li>Come back here and tap I&apos;ve paid.</li>
      </ol>
    </div>
  );
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-brand-700/10 bg-cream-50 px-3 py-2">
      <div className="min-w-0">
        <dt className="text-[10px] uppercase tracking-[0.2em] text-ink-400">{label}</dt>
        <dd className="truncate font-semibold text-ink-900">{value}</dd>
      </div>
      <button
        type="button"
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brand-700/10 text-ink-600 hover:text-brand-700"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
          } catch {
            /* ignore */
          }
        }}
        aria-label={`Copy ${label}`}
      >
        {copied ? <Check className="h-4 w-4 text-ok" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}
