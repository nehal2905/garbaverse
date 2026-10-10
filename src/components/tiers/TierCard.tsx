"use client";

import { Check, Users } from "lucide-react";
import { cn, formatINR } from "@/lib/utils";
import type { TicketType } from "@/lib/types";

export function scarcity(t: TicketType): { label: string; tone: "sold" | "hot" | "warm" | "ok" } {
  if (t.available <= 0) return { label: "Sold out", tone: "sold" };
  if (t.available <= 25) return { label: `Only ${t.available} left`, tone: "hot" };
  if (t.available <= Math.max(60, t.capacity * 0.15))
    return { label: `Selling fast · ${t.available} left`, tone: "warm" };
  return { label: `${t.available} available`, tone: "ok" };
}

interface Props {
  tier: TicketType;
  selected?: boolean;
  onSelect?: (tier: TicketType) => void;
  as?: "button" | "div";
  className?: string;
}

export function TierCard({ tier, selected, onSelect, as = "div", className }: Props) {
  const s = scarcity(tier);
  const soldOut = s.tone === "sold";
  // Exact per-head price (₹500 / 2 = ₹250) — never round in the buyer's disfavour.
  const perHead = tier.admits > 1 ? formatINR(Math.round(tier.price_paise / tier.admits)) : null;
  const selectable = as === "button";

  const content = (
    <>
      {tier.badge && (
        <span className="absolute -top-3 left-5 rounded-full bg-brand-500 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-cream-50 shadow-soft">
          {tier.badge}
        </span>
      )}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-xl font-semibold text-ink-900">{tier.name}</h3>
        </div>
        {/* Radio affordance only where the card actually is a radio. */}
        {selectable && (
          <span
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all",
              selected ? "border-brand-500 bg-brand-600 text-cream-50" : "border-brand-700/20 text-transparent"
            )}
            aria-hidden="true"
          >
            <Check className="h-4 w-4" strokeWidth={3} />
          </span>
        )}
      </div>

      <div className="mt-5">
        <span className="font-display text-4xl font-bold leading-none text-brand-600">
          {formatINR(tier.price_paise)}
        </span>
        <p className="mt-1.5 text-sm text-ink-500">
          {perHead ? (
            <>
              for {tier.admits} people <span className="text-ink-400">·</span> {perHead} each
            </>
          ) : (
            "per person"
          )}
        </p>
      </div>

      <div className="mt-6 flex items-center justify-between text-xs">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold",
            s.tone === "sold" && "bg-brand-700/10 text-ink-600",
            s.tone === "hot" && "bg-brand-600/10 text-brand-700",
            s.tone === "warm" && "bg-warn/15 text-warn",
            s.tone === "ok" && "bg-ok/15 text-ok"
          )}
          aria-live="polite"
        >
          {s.tone !== "sold" && (
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                s.tone === "hot" ? "bg-brand-400 motion-safe:animate-pulse" : s.tone === "warm" ? "bg-warn" : "bg-ok"
              )}
            />
          )}
          {s.label}
        </span>
        <span className="inline-flex items-center gap-1 text-ink-400">
          <Users className="h-3.5 w-3.5" aria-hidden="true" />
          admits {tier.admits}
        </span>
      </div>
    </>
  );

  const base = cn(
    "relative flex w-full flex-col rounded-3xl p-6 text-left transition-all duration-200",
    selected
      ? "glass-strong border-brand-500/70 shadow-soft ring-1 ring-brand-400/40"
      : "glass hover:border-brand-500/40",
    soldOut && "opacity-55 saturate-50",
    className
  );

  if (as === "button") {
    return (
      <button
        type="button"
        role="radio"
        aria-checked={selected}
        aria-disabled={soldOut}
        disabled={soldOut}
        onClick={() => onSelect?.(tier)}
        className={cn(base, "active:scale-[0.99] disabled:cursor-not-allowed")}
      >
        {content}
      </button>
    );
  }
  return <div className={base}>{content}</div>;
}

export function TierCardSkeleton() {
  return (
    <div className="glass rounded-3xl p-6" aria-hidden="true">
      <div className="skeleton h-6 w-32" />
      <div className="skeleton mt-6 h-10 w-28" />
      <div className="skeleton mt-6 h-6 w-28 rounded-full" />
    </div>
  );
}
