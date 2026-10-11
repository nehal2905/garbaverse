import type { Metadata } from "next";
import { headers } from "next/headers";
import { render } from "@react-email/render";
import React from "react";
import { Nav } from "@/components/layout/Nav";
import { DigitalPass } from "@/components/pass/DigitalPass";
import { BookingFlow } from "@/components/booking/BookingFlow";
import PassEmail from "@/emails/PassEmail";
import { CATALOG } from "@/lib/catalog";
import { EVENT, brandLogoUrl } from "@/lib/event";
import { missingCheckoutConfig } from "@/lib/env";
import { googleCalendarUrl } from "@/lib/ics";
import type { PublicBooking } from "@/lib/types";

export const metadata: Metadata = {
  title: "Design preview",
  robots: { index: false, follow: false },
};

const booking: PublicBooking = {
  id: "GV-7K3M9Q",
  status: "confirmed",
  name: "Ananya Reddy",
  email: "ananya@example.com",
  quantity: 1,
  attendees: 2,
  amount_paise: 100000,
  event_date: "2026-10-17",
  event_dates: ["2026-10-17", "2026-10-18"],
  ticket_type: { id: "couple", name: "Couple Pass", admits: 2 },
  expires_at: new Date().toISOString(),
  confirmed_at: new Date().toISOString(),
  checked_in_at: null,
  qr_payload: "GV-7K3M9Q.preview",
  access_token: "preview",
  payment_method: "upi",
};

const previewQr =
  "https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=8&data=GV-7K3M9Q";

async function previewOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "127.0.0.1:3001";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export default async function Preview({ searchParams }: { searchParams: Promise<{ v?: string }> }) {
  const { v } = await searchParams;
  const origin = await previewOrigin();
  const passUrl = `${origin}/preview?v=pass`;

  const emailHtml = await render(
    React.createElement(PassEmail, {
      ...PassEmail.PreviewProps,
      mapsUrl: EVENT.venue.mapsUrl,
      passUrl,
      pdfUrl: passUrl,
      icsUrl: passUrl,
      googleCalUrl: googleCalendarUrl({ bookingId: booking.id, passUrl, eventDates: booking.event_dates }),
      supportEmail: EVENT.contact.email,
      organiserLogoUrl: brandLogoUrl(origin, "organiser"),
      partnerLogoUrl: brandLogoUrl(origin, "partner"),
    })
  );

  return (
    <>
      <Nav cta={false} />
      <main id="main">
        {v === "email" ? (
          <div className="mx-auto max-w-xl px-4 pb-20 pt-28 sm:px-6">
            <div className="text-center">
              <p className="eyebrow">Inbox preview</p>
              <h1 className="mt-3 font-display text-3xl font-black text-ink-900 sm:text-5xl">
                How the pass email looks
              </h1>
              <p className="mt-3 text-sm text-ink-600">
                Sample only — sent after you confirm a UPI payment. The real email also attaches a PDF.
              </p>
            </div>
            <div className="mt-6 overflow-hidden rounded-2xl border border-brand-700/15 bg-white text-left shadow-card">
              <dl className="space-y-2 border-b border-brand-700/10 px-5 py-4 text-sm">
                <div className="flex gap-3">
                  <dt className="w-24 shrink-0 text-ink-400">From</dt>
                  <dd className="text-ink-800">
                    {EVENT.name} &lt;{EVENT.contact.email}&gt;
                  </dd>
                </div>
                <div className="flex gap-3">
                  <dt className="w-24 shrink-0 text-ink-400">Subject</dt>
                  <dd className="text-ink-800">
                    🎟️ You&apos;re in! Your {EVENT.name} pass is here ({booking.id})
                  </dd>
                </div>
                <div className="flex gap-3">
                  <dt className="w-24 shrink-0 text-ink-400">Attachment</dt>
                  <dd className="text-ink-800">GarbaVerse-Pass-{booking.id}.pdf</dd>
                </div>
              </dl>
              <iframe
                title="GarbaVerse pass email"
                srcDoc={emailHtml}
                className="block h-[1100px] w-full border-0 bg-[#e6d2ae]"
              />
            </div>
          </div>
        ) : v === "pass" ? (
          <div className="mx-auto max-w-3xl px-4 pb-20 pt-28 sm:px-6">
            <div className="text-center">
              <p className="eyebrow">Design preview</p>
              <h1 className="mt-3 font-display text-4xl font-black text-ink-900 sm:text-5xl">
                You&apos;re in, <span className="accent-text">Ananya</span>!
              </h1>
              <p className="mt-3 text-sm text-ink-600">Sample pass — not a real booking.</p>
            </div>
            <div className="mt-10">
              <DigitalPass booking={booking} qrSrc={previewQr} />
            </div>
          </div>
        ) : (
          <BookingFlow
            initialTiers={CATALOG.map((t, i) =>
              i === 1 ? { ...t, available: 12, sold: t.capacity - 12 } : t
            )}
            initialTierId="couple"
            checkoutReady={missingCheckoutConfig().length === 0}
          />
        )}
      </main>
    </>
  );
}
