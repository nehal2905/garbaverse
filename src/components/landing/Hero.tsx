import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Clock, MapPin, ArrowDown } from "lucide-react";
import { EVENT, EVENT_DATE_LABEL, EVENT_TIME_LABEL, formatEventDate } from "@/lib/event";
import { Garland, Lantern, Mandala } from "@/components/ui/Ornaments";
import { Countdown } from "./Countdown";

/**
 * Server component. The entrance animation is pure CSS (animate-fade-up), so
 * the headline and CTA — the LCP content — paint before any JS hydrates, and
 * still appear if JS is slow or fails.
 */
const step = (i: number) => ({ animationDelay: `${i * 0.1}s` });

export function Hero({ fromPrice }: { fromPrice: string }) {
  return (
    <section className="relative isolate overflow-hidden pb-16 pt-20 sm:pb-24 sm:pt-24">
      <Image
        src="/art/lanterns.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="pointer-events-none -z-20 object-cover object-top opacity-30 grayscale contrast-125"
      />
      {/* Black stage with a single red spotlight from above. */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_55%_at_50%_0%,rgba(123,16,36,0.38),transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-ink-950/10 via-ink-950/70 to-ink-950" />
      <Mandala className="pointer-events-none absolute left-1/2 top-[-8%] -z-10 w-[140vw] max-w-[980px] -translate-x-1/2 opacity-[0.14] sm:top-[-18%]" />

      <Garland className="absolute inset-x-0 top-16 z-10 opacity-90 sm:top-[4.25rem]" />
      <Lantern className="pointer-events-none absolute left-2 top-16 hidden h-24 w-14 motion-safe:animate-float sm:block lg:left-8 lg:h-32 lg:w-16" />
      <Lantern
        variant="oxblood"
        className="pointer-events-none absolute right-3 top-20 hidden h-20 w-12 motion-safe:animate-float md:block lg:right-10 lg:h-28 lg:w-14 [animation-delay:1.2s]"
      />

      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:pt-8">
        <div className="text-center lg:text-left">
          <p className="eyebrow motion-safe:animate-fade-up" style={step(0)}>
            {EVENT.organiser} presents
          </p>

          <h1
            className="mt-4 font-display text-[2.65rem] font-black leading-[0.9] tracking-wide motion-safe:animate-fade-up sm:text-7xl md:text-8xl lg:text-[6.6rem]"
            style={step(1)}
          >
            <span className="text-cream">
              Garba<span className="font-normal text-brand-300">Verse</span>
            </span>
          </h1>

          <p
            className="mt-3 font-display text-xl italic text-cream/90 motion-safe:animate-fade-up sm:text-3xl"
            style={step(2)}
          >
            {EVENT.subtitle}
          </p>

          <p
            className="mt-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-cream/70 motion-safe:animate-fade-up sm:text-sm sm:tracking-[0.38em]"
            style={step(3)}
          >
            Dance <span className="mx-2 text-brand-500">✦</span> Tradition{" "}
            <span className="mx-2 text-brand-500">✦</span> Togetherness
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
            <a href="#highlights" className="btn-ghost w-full sm:w-auto">
              What to expect <ArrowDown className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md motion-safe:animate-fade-up lg:max-w-none" style={step(4)}>
          <div className="relative overflow-hidden rounded-[28px] border border-brand-500/35 bg-ink-900 shadow-card ring-1 ring-brand-500/20">
            <div className="h-1.5 bg-wine-band" aria-hidden="true" />
            <div className="relative aspect-[3/4] sm:aspect-[4/5] lg:aspect-[4/5]">
              <Image
                src="/art/hero.jpg"
                alt="Dancers in traditional attire spinning under lantern light at GarbaVerse"
                fill
                priority
                sizes="(max-width: 1024px) 90vw, 480px"
                className="object-cover object-[center_20%]"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950/85 via-ink-950/10 to-ink-950/20" />
            </div>

            <DateBadge />

            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
              <p className="max-w-[12rem] font-display text-lg leading-tight text-cream drop-shadow sm:text-xl">
                {formatEventDate(EVENT.startsAt, { weekday: "long", day: undefined, month: undefined, year: undefined })} night.
                <span className="block text-brand-300">The circle opens.</span>
              </p>
              <span className="rounded-full bg-brand-500 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-cream shadow-soft">
                From {fromPrice}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 flex justify-center px-4 motion-safe:animate-fade-up" style={step(6)}>
        <Countdown target={EVENT.startsAt} />
      </div>
    </section>
  );
}

function DateBadge() {
  const day = formatEventDate(EVENT.startsAt, { weekday: undefined, day: "numeric", month: undefined, year: undefined });
  const month = formatEventDate(EVENT.startsAt, { weekday: undefined, day: undefined, month: "short", year: undefined });
  return (
    <div
      className="absolute right-3 top-4 flex h-[4.75rem] w-[4.75rem] flex-col items-center justify-center rounded-full bg-brand-500 text-cream shadow-soft ring-1 ring-cream/15 sm:right-4 sm:top-5 sm:h-24 sm:w-24"
      aria-hidden="true"
    >
      <span className="font-display text-2xl font-black leading-none sm:text-4xl">{day}</span>
      <span className="text-[10px] font-bold uppercase tracking-[0.25em] sm:text-xs">{month}</span>
    </div>
  );
}

function Fact({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="glass inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-cream/90">
      <span className="text-brand-400" aria-hidden="true">
        {icon}
      </span>
      {text}
    </span>
  );
}
