import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/layout/Nav";
import { BookingFlow } from "@/components/booking/BookingFlow";
import { getTicketTypes } from "@/lib/bookings";
import { EVENT, isSalesOpen } from "@/lib/event";
import { missingCheckoutConfig } from "@/lib/env";
import type { TicketType } from "@/lib/types";

export const metadata: Metadata = {
  title: "Book passes",
  description: "Choose your pass, enter your details, pay securely. Your QR pass arrives instantly.",
};
export const dynamic = "force-dynamic";

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ tier?: string }>;
}) {
  const { tier } = await searchParams;
  const salesOpen = isSalesOpen();
  let tiers: TicketType[] = [];
  let failed = false;
  if (salesOpen) {
    try {
      // Without Supabase this returns the offline catalog (design preview).
      // With Supabase, an empty list means no tier is on sale — never fall back
      // to the catalog, or buyers would pick passes checkout can't sell.
      tiers = await getTicketTypes();
    } catch (err) {
      console.error("[book] tiers unavailable", err);
      failed = true;
    }
  }

  return (
    <>
      <Nav cta={false} />
      <main id="main" className="min-h-dvh">
        {!salesOpen ? (
          <Notice
            title="Online sales have closed"
            body={`Thank you for an incredible ${EVENT.name}! Already booked? Your pass is in your email, or use Find my booking.`}
            href="/find"
            cta="Find my booking"
          />
        ) : failed ? (
          <Notice
            title="Passes are taking a breather"
            body="We couldn't load live availability. Please refresh in a moment."
            href="/book"
            cta="Try again"
          />
        ) : tiers.length === 0 ? (
          <Notice
            title="No passes on sale right now"
            body={`Check back soon, or write to ${EVENT.contact.email}.`}
            href="/"
            cta="Back home"
          />
        ) : (
          <BookingFlow
            initialTiers={tiers}
            initialTierId={tier}
            checkoutReady={missingCheckoutConfig().length === 0}
          />
        )}
      </main>
    </>
  );
}

function Notice({ title, body, href, cta }: { title: string; body: string; href: string; cta: string }) {
  return (
    <div className="mx-auto max-w-lg px-4 pt-40 text-center">
      <h1 className="font-display text-3xl text-cream">{title}</h1>
      <p className="mt-3 text-cream/65">{body}</p>
      <Link href={href} className="btn-primary mt-6">
        {cta}
      </Link>
    </div>
  );
}
