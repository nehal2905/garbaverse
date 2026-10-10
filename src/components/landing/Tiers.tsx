import Link from "next/link";
import { ShieldCheck, Zap, Ticket } from "lucide-react";
import { TierCard, TierCardSkeleton } from "@/components/tiers/TierCard";
import { Divider } from "@/components/ui/Ornaments";
import { BrandPair } from "@/components/ui/PartnerLogo";
import type { TicketType } from "@/lib/types";

export function Tiers({ tiers }: { tiers: TicketType[] | null }) {
  return (
    <section id="passes" className="scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Passes</p>
          <h2 className="mt-3 font-display text-3xl font-bold text-ink-900 sm:text-5xl">
            Pick your <span className="accent-text">pass</span>
          </h2>
          <p className="mt-4 text-ink-600">
            Prices are for one night — you pick the date at checkout. Inclusive of all taxes.
            Numbers below are live.
          </p>
          <Divider className="mx-auto mt-6 max-w-xs" />
          <BrandPair size="md" className="mt-8" />
        </div>

        <div className="mt-14 grid gap-6 pt-3 sm:grid-cols-2 lg:grid-cols-3">
          {tiers
            ? tiers.map((t) => (
                <Link
                  key={t.id}
                  href={t.available > 0 ? `/book?tier=${t.id}` : "#passes"}
                  aria-disabled={t.available <= 0}
                  className="group block rounded-3xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-400/50"
                >
                  <TierCard tier={t} className="h-full group-hover:-translate-y-1" />
                </Link>
              ))
            : Array.from({ length: 3 }).map((_, i) => <TierCardSkeleton key={i} />)}
        </div>

        <div className="mt-10 flex flex-col items-center gap-4">
          <Link href="/book" className="btn-primary px-10">
            <Ticket className="h-4 w-4" aria-hidden="true" /> Book now
          </Link>
          <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-ink-500">
            <li className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-brand-400" aria-hidden="true" /> Pay by UPI · we
              confirm by hand
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-brand-400" aria-hidden="true" /> QR pass after we confirm
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
