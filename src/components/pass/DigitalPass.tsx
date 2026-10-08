"use client";

import { motion } from "framer-motion";
import { CalendarDays, Clock, MapPin } from "lucide-react";
import { EVENT, EVENT_DATE_LABEL, EVENT_TIME_LABEL } from "@/lib/event";
import { formatINR } from "@/lib/utils";
import { Mandala } from "@/components/ui/Ornaments";
import type { PublicBooking } from "@/lib/types";

interface Props {
  booking: PublicBooking;
  qrSrc: string;
  reveal?: boolean;
}

/**
 * The hero: a physical-ticket-styled digital pass with a perforated stub,
 * a matte wine band, and a big scannable QR.
 */
export function DigitalPass({ booking, qrSrc, reveal = true }: Props) {
  const checkedIn = Boolean(booking.checked_in_at);
  return (
    <motion.article
      aria-label={`Pass for ${booking.name}, booking ${booking.id}`}
      initial={reveal ? { opacity: 0, rotateX: 25, y: 60, scale: 0.92 } : false}
      animate={{ opacity: 1, rotateX: 0, y: 0, scale: 1 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      style={{ transformPerspective: 1200 }}
      className="relative mx-auto w-full max-w-md"
    >
      <div className="relative overflow-hidden rounded-[28px] border border-brand-500/40 bg-gradient-to-b from-ink-800 via-ink-900 to-ink-950 shadow-card">
        {/* artwork */}
        <Mandala spin={false} className="pointer-events-none absolute -right-24 -top-24 w-72 opacity-20" />
        <div className="h-1.5 bg-wine-band" aria-hidden="true" />

        {/* Header */}
        <div className="relative px-6 pt-6">
          <p className="eyebrow">{EVENT.organiser} presents</p>
          <h2 className="mt-1 font-display text-4xl font-black tracking-wide">
            <span className="text-cream">
              Garba<span className="text-brand-300">Verse</span>
            </span>
          </h2>
          <p className="font-display text-sm text-cream/80">{EVENT.subtitle}</p>
        </div>

        {/* Body */}
        <div className="relative grid grid-cols-[1fr_auto] gap-4 px-6 pb-6 pt-5">
          <dl className="space-y-3.5 text-sm">
            <Field label="Attendee">
              <span className="text-base font-bold">{booking.name}</span>
            </Field>
            <Field label="Pass">
              {booking.ticket_type.name} × {booking.quantity}
              {booking.attendees > 1 && (
                <span className="ml-1 text-cream/55">· admits {booking.attendees}</span>
              )}
            </Field>
            <Field label="When">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-brand-400" aria-hidden="true" /> {EVENT_DATE_LABEL}
              </span>
              <span className="mt-0.5 flex items-center gap-1.5 text-cream/70">
                <Clock className="h-3.5 w-3.5 text-brand-400" aria-hidden="true" /> {EVENT_TIME_LABEL}
              </span>
            </Field>
            <Field label="Where">
              <span className="inline-flex items-start gap-1.5">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-400" aria-hidden="true" />
                <span>
                  {EVENT.venue.name}
                  <span className="block text-cream/60">{EVENT.venue.shortAddress}</span>
                </span>
              </span>
            </Field>
          </dl>

          <div className="flex flex-col items-center">
            <div className="relative rounded-2xl bg-white p-2.5 shadow-[0_0_0_4px_rgba(123,16,36,0.55)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrSrc}
                alt={`QR code for booking ${booking.id}`}
                width={136}
                height={136}
                className="h-[136px] w-[136px] rounded-lg"
                draggable={false}
              />
              {checkedIn && (
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-ink-950/80">
                  <span className="rotate-[-12deg] rounded-md border-2 border-brand-400 px-2 py-1 font-display text-sm font-bold uppercase tracking-widest text-brand-300">
                    Used
                  </span>
                </div>
              )}
            </div>
            <p className="mt-2 text-[10px] uppercase tracking-[0.25em] text-cream/55">Scan at gate</p>
          </div>
        </div>

        {/* Perforation with notches */}
        <div className="relative" aria-hidden="true">
          <span className="absolute -left-4 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full bg-ink-950 ring-1 ring-brand-500/40" />
          <span className="absolute -right-4 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full bg-ink-950 ring-1 ring-brand-500/40" />
          <div className="perforation mx-8 h-px" />
        </div>

        {/* Stub */}
        <div className="relative flex items-end justify-between px-6 pb-6 pt-5">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-cream/55">Booking ID</p>
            <p className="mt-1 font-mono text-2xl font-bold tracking-[0.2em] text-brand-300">{booking.id}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-[0.25em] text-cream/55">Paid</p>
            <p className="mt-1 font-display text-xl font-bold text-brand-300">{formatINR(booking.amount_paise)}</p>
            <span className="mt-1.5 inline-block rounded-full bg-brand-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-cream">
              {checkedIn ? "Checked in" : "Confirmed"}
            </span>
          </div>
        </div>
        <div className="h-1.5 bg-wine-band" aria-hidden="true" />
      </div>
    </motion.article>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-[0.25em] text-cream/50">{label}</dt>
      <dd className="mt-0.5 text-cream">{children}</dd>
    </div>
  );
}

export function PassSkeleton() {
  return (
    <div className="mx-auto w-full max-w-md overflow-hidden rounded-[28px] border border-white/10 bg-ink-900/60" aria-hidden="true">
      <div className="h-1.5 bg-white/10" />
      <div className="px-6 pt-6">
        <div className="skeleton h-3 w-32" />
        <div className="skeleton mt-3 h-9 w-48" />
        <div className="skeleton mt-2 h-4 w-40" />
      </div>
      <div className="grid grid-cols-[1fr_auto] gap-4 px-6 pb-6 pt-5">
        <div className="space-y-4">
          <div className="skeleton h-5 w-36" />
          <div className="skeleton h-5 w-28" />
          <div className="skeleton h-5 w-44" />
          <div className="skeleton h-5 w-40" />
        </div>
        <div className="skeleton h-[156px] w-[156px] rounded-2xl" />
      </div>
      <div className="mx-8 h-px bg-white/10" />
      <div className="flex justify-between px-6 pb-6 pt-5">
        <div className="skeleton h-8 w-36" />
        <div className="skeleton h-8 w-20" />
      </div>
    </div>
  );
}
