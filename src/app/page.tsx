import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/landing/Hero";
import { Marquee } from "@/components/landing/Marquee";
import { Tiers } from "@/components/landing/Tiers";
import { Testimonials } from "@/components/landing/Testimonials";
import { Venue } from "@/components/landing/Venue";
import { FAQ } from "@/components/landing/FAQ";
import { faqs } from "@/lib/faqs";
import { getTicketTypes } from "@/lib/bookings";
import { CATALOG, isSupabaseConfigured } from "@/lib/catalog";
import { env } from "@/lib/env";
import { EVENT } from "@/lib/event";
import { formatINR } from "@/lib/utils";
import type { TicketType } from "@/lib/types";

/** JSON for a <script> tag: escape "<" so DB text can never close the tag. */
function jsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export const revalidate = 30; // availability refreshes every 30s; /book is always live

export default async function LandingPage() {
  let tiers: TicketType[] | null = CATALOG;
  try {
    tiers = await getTicketTypes();
  } catch (err) {
    console.error("[landing] tiers unavailable", err);
    tiers = isSupabaseConfigured() ? null : CATALOG;
  }
  const minPrice = tiers?.length ? Math.min(...tiers.map((t) => t.price_paise)) : 29900;

  const eventLd = {
    "@context": "https://schema.org",
    "@type": "DanceEvent",
    name: `${EVENT.name} — ${EVENT.subtitle}`,
    startDate: EVENT.startsAt,
    endDate: EVENT.endsAt,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: EVENT.venue.name,
      address: EVENT.venue.address,
    },
    organizer: { "@type": "Organization", name: EVENT.organiser, email: EVENT.contact.email },
    offers: (tiers ?? []).map((t) => ({
      "@type": "Offer",
      name: t.name,
      price: t.price_paise / 100,
      priceCurrency: "INR",
      availability:
        t.available > 0 ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
      url: `${env.siteUrl}/book?tier=${t.id}`,
    })),
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <Nav />
      <main id="main">
        <Hero fromPrice={formatINR(minPrice)} />
        <Marquee />
        <Tiers tiers={tiers} />
        <Testimonials />
        <Venue />
        <FAQ />
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(eventLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(faqLd) }} />
    </>
  );
}
