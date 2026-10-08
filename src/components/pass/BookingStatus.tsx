"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarPlus, Download, Loader2, MailCheck, MapPin, Share2, XCircle } from "lucide-react";
import { DigitalPass, PassSkeleton } from "./DigitalPass";
import { EVENT, GATES_OPEN_LABEL, formatEventTime } from "@/lib/event";
import type { PublicBooking } from "@/lib/types";

interface Props {
  initial: PublicBooking;
  token: string;
  googleCalUrl: string;
}

const POLL_MS = 2500;
const MAX_POLL_MS = 15 * 60 * 1000;
// A cancelled hold can still flip to confirmed if a payment lands late
// (confirm_booking honours it). Keep checking briefly, at a gentler pace.
const CANCELLED_POLL_MS = 10_000;
const CANCELLED_MAX_POLL_MS = 3 * 60 * 1000;

export function BookingStatus({ initial, token, googleCalUrl }: Props) {
  const [booking, setBooking] = useState(initial);
  const [celebrated, setCelebrated] = useState(initial.status === "confirmed");
  const startedAt = useRef(Date.now());
  const [slow, setSlow] = useState(false);
  const [copied, setCopied] = useState(false);

  const poll = useCallback(async () => {
    try {
      const r = await fetch(`/api/bookings/${initial.id}?t=${token}`, { cache: "no-store" });
      if (r.ok) setBooking((await r.json()) as PublicBooking);
    } catch {
      /* transient */
    }
  }, [initial.id, token]);

  // Poll while not confirmed. Never trust the redirect alone.
  useEffect(() => {
    if (booking.status === "confirmed") return;
    const pending = booking.status === "pending";
    const limit = pending ? MAX_POLL_MS : CANCELLED_MAX_POLL_MS;
    const id = setInterval(() => {
      if (Date.now() - startedAt.current > limit) {
        clearInterval(id);
        return;
      }
      if (pending && Date.now() - startedAt.current > 20_000) setSlow(true);
      poll();
    }, pending ? POLL_MS : CANCELLED_POLL_MS);
    return () => clearInterval(id);
  }, [booking.status, poll]);

  // Celebrate exactly once on confirmation.
  useEffect(() => {
    if (booking.status !== "confirmed" || celebrated) return;
    setCelebrated(true);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    import("canvas-confetti").then(({ default: confetti }) => {
      const colors = ["#7b1024", "#3c0b18", "#f2e8e1", "#d49aa5", "#5e0c1c"];
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 }, colors, scalar: 0.9 });
      setTimeout(
        () => confetti({ particleCount: 60, angle: 60, spread: 55, origin: { x: 0 }, colors }),
        250
      );
      setTimeout(
        () => confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1 }, colors }),
        400
      );
    });
  }, [booking.status, celebrated]);

  const share = async () => {
    // Share the public site — NEVER window.location.href: this page's URL
    // carries the pass token, and whoever has it can open the QR and use it.
    const url = window.location.origin;
    const text = `I'm going to ${EVENT.name} — ${EVENT.subtitle}! 🎉`;
    if (navigator.share) {
      await navigator.share({ title: EVENT.name, text, url }).catch(() => undefined);
      return;
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* clipboard blocked — nothing useful to do */
    }
  };

  const pdfUrl = `/api/pass/${booking.id}/pdf?t=${token}`;
  const icsUrl = `/api/pass/${booking.id}/ics?t=${token}`;
  const qrSrc = `/api/pass/${booking.id}/qr.png?t=${token}`;

  return (
    <div className="mx-auto max-w-3xl px-4 pb-20 pt-28 sm:px-6">
      <AnimatePresence mode="wait">
        {/* ─────────── Pending ─────────── */}
        {booking.status === "pending" && (
          <motion.div key="pending" exit={{ opacity: 0, y: -20 }} className="text-center">
            <div role="status" aria-live="polite" className="mx-auto max-w-md">
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-brand-400" aria-hidden="true" />
              <h1 className="mt-5 font-display text-3xl font-bold text-cream">Confirming your payment…</h1>
              <p className="mt-3 text-cream/65">
                Hang tight — we&apos;re waiting for the bank to confirm. This usually takes a few seconds.
              </p>
              {slow && (
                <p className="mt-3 rounded-2xl border border-brand-500/30 bg-brand-500/10 px-4 py-3 text-sm text-brand-300">
                  Taking longer than usual. Don&apos;t pay again — if money left your account, your pass
                  will appear here and in your email automatically. You can safely close this page.
                </p>
              )}
            </div>
            <div className="mt-10">
              <PassSkeleton />
            </div>
            <p className="mt-6 text-xs text-cream/45">Booking ID {booking.id}</p>
          </motion.div>
        )}

        {/* ─────────── Confirmed ─────────── */}
        {booking.status === "confirmed" && (
          <motion.div key="confirmed" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="text-center">
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="eyebrow"
              >
                Booking confirmed
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mt-3 font-display text-4xl font-black text-cream sm:text-5xl"
              >
                You&apos;re in, <span className="accent-text">{booking.name.split(" ")[0]}</span>!
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="mx-auto mt-3 flex max-w-md items-center justify-center gap-2 text-sm text-cream/65"
              >
                <MailCheck className="h-4 w-4 text-brand-400" aria-hidden="true" />
                Pass emailed to <span className="font-medium text-cream">{booking.email}</span>
              </motion.p>
            </div>

            <div className="mt-10">
              <DigitalPass booking={booking} qrSrc={qrSrc} />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mx-auto mt-8 grid max-w-md grid-cols-2 gap-3"
            >
              <a href={pdfUrl} className="btn-primary col-span-2" download>
                <Download className="h-4 w-4" aria-hidden="true" /> Download PDF pass
              </a>
              <a href={icsUrl} className="btn-ghost text-sm" download>
                <CalendarPlus className="h-4 w-4" aria-hidden="true" /> Add to calendar
              </a>
              <a href={googleCalUrl} target="_blank" rel="noreferrer" className="btn-ghost text-sm">
                <CalendarPlus className="h-4 w-4" aria-hidden="true" /> Google Calendar
              </a>
              <a href={EVENT.venue.mapsUrl} target="_blank" rel="noreferrer" className="btn-ghost text-sm">
                <MapPin className="h-4 w-4" aria-hidden="true" /> Directions
              </a>
              <button type="button" onClick={share} className="btn-ghost text-sm" aria-live="polite">
                <Share2 className="h-4 w-4" aria-hidden="true" /> {copied ? "Link copied!" : "Tell friends"}
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="glass mx-auto mt-10 max-w-md rounded-3xl p-6 text-sm text-cream/70"
            >
              <h2 className="font-display text-base font-semibold text-cream">Know before you go</h2>
              <ul className="mt-3 list-disc space-y-1.5 pl-5">
                <li>
                  Gates open {GATES_OPEN_LABEL}. Aarti at {formatEventTime(EVENT.startsAt)} sharp.
                </li>
                <li>One scan per pass — everyone on this booking enters together.</li>
                <li>Screenshots work, but the PDF is safest if signal is weak.</li>
                <li>Carry a photo ID. {EVENT.ageNote}</li>
              </ul>
              <p className="mt-4 text-xs text-cream/45">
                Lost this page? Use{" "}
                <Link href="/find" className="text-brand-300 underline">
                  Find my booking
                </Link>{" "}
                with your email and ID <span className="font-mono">{booking.id}</span>.
              </p>
            </motion.div>
          </motion.div>
        )}

        {/* ─────────── Cancelled / expired ─────────── */}
        {booking.status === "cancelled" && (
          <motion.div key="cancelled" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-md text-center">
            <XCircle className="mx-auto h-12 w-12 text-brand-400" aria-hidden="true" />
            <h1 className="mt-5 font-display text-3xl font-bold text-cream">This booking wasn&apos;t completed</h1>
            <p className="mt-3 text-cream/65">
              Payment didn&apos;t go through or the {EVENT.holdMinutes}-minute hold expired, so the spots
              were released. If money did leave your account, don&apos;t pay again — your pass is still
              issued automatically and will appear here and in your email. If it hasn&apos;t arrived
              within an hour, write to us with the reference below.
            </p>
            <Link href="/book" className="btn-primary mt-8">
              Book again
            </Link>
            <p className="mt-6 text-xs text-cream/45">
              Reference {booking.id} · <a href={`mailto:${EVENT.contact.email}`} className="underline">Need help?</a>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
