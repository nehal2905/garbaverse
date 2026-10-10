"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Users } from "lucide-react";
import { formatEventNight, type EventNight } from "@/lib/event";
import { formatINR, pluralise } from "@/lib/utils";
import type { TicketType } from "@/lib/types";

interface Props {
  tier: TicketType | null;
  quantity: number;
  night?: EventNight | null;
  compact?: boolean;
}

export function computeTotal(tier: TicketType | null, quantity: number) {
  if (!tier) return 0;
  return tier.price_paise * quantity;
}

/** Live summary — recomputed on every change. Server recomputes authoritatively. */
export function PriceSummary({ tier, quantity, night, compact }: Props) {
  const total = computeTotal(tier, quantity);
  const people = tier ? tier.admits * quantity : 0;

  if (compact) {
    return (
      <div className="flex items-baseline gap-2">
        <AnimatedAmount value={total} className="font-display text-2xl font-bold text-brand-600" />
        <span className="text-xs text-ink-500">
          {tier ? `${tier.name} × ${quantity}${night ? ` · ${formatEventNight(night, { weekday: "short", year: undefined })}` : ""}` : "Pick a night"}
        </span>
      </div>
    );
  }

  return (
    <div className="glass-strong rounded-3xl p-6">
      <h2 className="font-display text-lg font-semibold text-ink-900">Order summary</h2>
      <AnimatePresence mode="wait">
        {tier ? (
          <motion.div
            key={tier.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="mt-4 space-y-3 text-sm"
          >
            <div className="flex justify-between">
              <span className="text-ink-600">
                {tier.name} <span className="text-ink-400">× {quantity}</span>
              </span>
              <span className="tabular-nums text-ink-900">{formatINR(tier.price_paise * quantity)}</span>
            </div>
            <div className="flex justify-between text-ink-500">
              <span>Night</span>
              <span>{night ? formatEventNight(night, { year: undefined }) : "Choose a night"}</span>
            </div>
            <div className="flex justify-between text-ink-500">
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" aria-hidden="true" /> Admits
              </span>
              <span>{pluralise(people, "person", "people")}</span>
            </div>
            <div className="flex justify-between text-ink-500">
              <span>Taxes &amp; fees</span>
              <span>Included</span>
            </div>
            <div className="perforation my-2 h-px" aria-hidden="true" />
            <div className="flex items-end justify-between">
              <span className="font-semibold text-ink-900">Total</span>
              <AnimatedAmount value={total} className="font-display text-3xl font-bold text-brand-600" />
            </div>
          </motion.div>
        ) : (
          <motion.p
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-4 text-sm text-ink-500"
          >
            Select a night and a pass to see your total.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function AnimatedAmount({ value, className }: { value: number; className?: string }) {
  return (
    <span className={className} aria-live="polite" aria-atomic="true">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
          transition={{ duration: 0.25 }}
          className="inline-block tabular-nums"
        >
          {formatINR(value)}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
