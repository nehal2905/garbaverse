import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Clock, MapPin } from "lucide-react";
import { EVENT, EVENT_DATE_LABEL, EVENT_TIME_LABEL, formatEventDate } from "@/lib/event";
import { CornerFlourish, Divider, Mandala } from "@/components/ui/Ornaments";
import { PartnerLogo } from "@/components/ui/PartnerLogo";
import { Countdown } from "./Countdown";

const step = (i: number) => ({ animationDelay: `${i * 0.1}s` });

export function Hero({ fromPrice }: { fromPrice: string }) {
  return (
    <section className="relative isolate overflow-hidden pb-16 pt-20 sm:pb-24 sm:pt-24">
      <Mandala className="pointer-events-none absolute left-1/2 top-[-10%] -z-10 w-[140vw] max-w-[980px] -translate-x-1/2 opacity-[0.12] sm:top-[-20%]" />
      <CornerFlourish className="pointer-events-none absolute left-0 top-16 hidden h-40 w-40 text-brand-600/40 lg:block" />
      <CornerFlourish className="pointer-events-none absolute right-0 top-16 hidden h-40 w-40 rotate-90 text-brand-600/40 lg:block" />

      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:pt-8">
        <div className="text-center lg:text-left">
          <div
            className="flex flex-col items-center gap-3 motion-safe:animate-fade-up lg:flex-row lg:items-center"
            style={step(0)}
          >
            <PartnerLogo size="md" />
            <p className="eyebrow text-center lg:text-left">
              {EVENT.partner} × {EVENT.organiser}
            </p>
          </div>

          <h1
            className="mt-4 font-display text-[2.65rem] font-black leading-[0.9] tracking-wide text-brand-600 motion-safe:animate-fade-up sm:text-7xl md:text-8xl lg:text-[6.6rem]"
            style={step(1)}
          >
            Garba<span className="font-normal">Verse</span>
          </h1>

          <p
            className="mt-4 font-display text-xl italic text-brand-600 motion-safe:animate-fade-up sm:text-3xl"
            style={step(2)}
          >
            {EVENT.tagline}
          </p>

          <p
            className="mt-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-500 motion-safe:animate-fade-up sm:text-sm sm:tracking-[0.38em]"
            style={step(3)}
          >
            Dance <span className="mx-2 text-saffron">✦</span> Tradition{" "}
            <span className="mx-2 text-saffron">✦</span> Togetherness
          </p>

          <div
            className="mt-7 flex flex-col gap-2 text-sm motion-safe:animate-fade-up sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-3 lg:justify-start"
            style={step(4)}
          >
            <Fact icon={<CalendarDays className="h-4 w-4" />} text={EVENT_DATE_LABEL} />
            <Fact icon={<Clock className="h-4 w-4" />} text={EVENT_TIME_LABEL} />
            <Fact icon={<MapPin className="h-4 w-4" />} text={`${EVENT.venue.name}, ${EVENT.venue.shortAddress}`} />
          </div>

          <div
            className="mt-8 flex flex-col items-center gap-3 motion-safe:animate-fade-up sm:flex-row lg:justify-start"
            style={step(5)}
          >
            <Link href="/book" className="btn-primary w-full px-8 text-base sm:w-auto">
              Get passes · from {fromPrice}
            </Link>
            <a href="#passes" className="btn-ghost w-full sm:w-auto">
              See passes
            </a>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md motion-safe:animate-fade-up lg:max-w-none" style={step(4)}>
          <div className="relative overflow-hidden rounded-[28px] border border-brand-700/15 bg-cream-50 shadow-card">
            <div className="h-1.5 bg-wine-band" aria-hidden="true" />
            <div className="relative aspect-[3/4] sm:aspect-[4/5] lg:aspect-[4/5]">
              <Image
                src="/art/hero.jpg"
                alt="Dancers in traditional attire spinning at dusk at GarbaVerse"
                fill
                priority
                sizes="(max-width: 1024px) 90vw, 480px"
                className="object-cover object-[center_15%]"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950/55 via-transparent to-transparent" />
            </div>

            <DateBadge />

            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
              <p className="max-w-[12rem] font-display text-lg leading-tight text-cream-50 drop-shadow sm:text-xl">
                Four nights.
                <span className="block text-saffron">The circle opens.</span>
              </p>
              <span className="rounded-full bg-brand-600 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-cream-50 shadow-soft">
                From {fromPrice}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 flex justify-center px-4 motion-safe:animate-fade-up" style={step(6)}>
        <Countdown target={EVENT.startsAt} />
      </div>
      <Divider className="mx-auto mt-14 max-w-xs" />
    </section>
  );
}

function DateBadge() {
  const start = formatEventDate(EVENT.startsAt, { weekday: undefined, day: "numeric", month: undefined, year: undefined });
  const end = formatEventDate(EVENT.endsAt, { weekday: undefined, day: "numeric", month: undefined, year: undefined });
  const month = formatEventDate(EVENT.startsAt, { weekday: undefined, day: undefined, month: "short", year: undefined });
  return (
    <div
      className="absolute right-3 top-4 flex h-[4.75rem] w-[4.75rem] flex-col items-center justify-center rounded-full bg-brand-500 text-cream-50 shadow-soft ring-4 ring-saffron/55 sm:right-4 sm:top-5 sm:h-24 sm:w-24"
      aria-hidden="true"
    >
      <span className="font-display text-xl font-black leading-none sm:text-3xl">
        {start}–{end}
      </span>
      <span className="text-[10px] font-bold uppercase tracking-[0.25em] sm:text-xs">{month}</span>
    </div>
  );
}

function Fact({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="glass inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-ink-800">
      <span className="text-brand-600" aria-hidden="true">
        {icon}
      </span>
      {text}
    </span>
  );
}
