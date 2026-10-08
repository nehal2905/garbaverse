import type { Metadata } from "next";
import { Nav } from "@/components/layout/Nav";
import { DigitalPass } from "@/components/pass/DigitalPass";
import { BookingFlow } from "@/components/booking/BookingFlow";
import { CATALOG } from "@/lib/catalog";
import { missingCheckoutConfig } from "@/lib/env";
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
  amount_paise: 54900,
  ticket_type: { id: "couple", name: "Couple Pass", admits: 2 },
  expires_at: new Date().toISOString(),
  confirmed_at: new Date().toISOString(),
  checked_in_at: null,
  qr_payload: "GV-7K3M9Q.preview",
  access_token: "preview",
};

const previewQr =
  "https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=8&data=GV-7K3M9Q";

export default async function Preview({ searchParams }: { searchParams: Promise<{ v?: string }> }) {
  const { v } = await searchParams;
  return (
    <>
      <Nav cta={false} />
      <main id="main">
        {v === "pass" ? (
          <div className="mx-auto max-w-3xl px-4 pb-20 pt-28 sm:px-6">
            <div className="text-center">
              <p className="eyebrow">Design preview</p>
              <h1 className="mt-3 font-display text-4xl font-black text-cream sm:text-5xl">
                You&apos;re in, <span className="accent-text">Ananya</span>!
              </h1>
              <p className="mt-3 text-sm text-cream/65">Sample pass — not a real booking.</p>
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
            initialTierId="vip"
            checkoutReady={missingCheckoutConfig().length === 0}
          />
        )}
      </main>
    </>
  );
}
