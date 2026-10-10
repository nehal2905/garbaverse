"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const STEPS = ["Choose", "Details", "Pay"] as const;

export function Progress({ step }: { step: number }) {
  return (
    <ol className="flex items-center" aria-label="Booking progress">
      {STEPS.map((label, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <li key={label} className={cn("flex items-center", i < STEPS.length - 1 && "flex-1")}>
            <div className="flex flex-col items-center gap-1.5 sm:flex-row sm:gap-3">
              <span
                aria-current={active ? "step" : undefined}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border text-sm font-bold transition-all duration-300",
                  done && "border-brand-500 bg-brand-600 text-cream-50",
                  active && "border-brand-500 bg-brand-500/15 text-brand-600 shadow-soft",
                  !done && !active && "border-brand-700/15 text-ink-400"
                )}
              >
                {done ? <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" /> : i + 1}
              </span>
              <span
                className={cn(
                  "text-xs font-semibold uppercase tracking-wider sm:text-sm",
                  active ? "text-ink-900" : done ? "text-brand-600" : "text-ink-400"
                )}
              >
                <span className="sr-only">Step {i + 1}: </span>
                {label}
                {done && <span className="sr-only"> (completed)</span>}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="relative mx-3 mb-5 h-px flex-1 bg-brand-700/10 sm:mb-0">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-brand-500"
                  initial={false}
                  animate={{ width: done ? "100%" : "0%" }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
