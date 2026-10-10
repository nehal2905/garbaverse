"use client";

import { EVENT_NIGHTS, formatEventNight, type EventNight } from "@/lib/event";
import { cn } from "@/lib/utils";

interface Props {
  value: EventNight | null;
  onChange: (night: EventNight) => void;
}

export function NightPicker({ value, onChange }: Props) {
  return (
    <fieldset>
      <legend className="label">Which night?</legend>
      <p className="mt-1 text-xs text-ink-500">Each pass is for one night only. Same price every night.</p>
      <div role="radiogroup" aria-label="Event night" className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {EVENT_NIGHTS.map((night) => {
          const selected = value === night;
          return (
            <button
              key={night}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(night)}
              className={cn(
                "rounded-2xl px-3 py-3 text-left transition-all duration-200",
                selected
                  ? "glass-strong border-brand-500/70 shadow-soft ring-1 ring-brand-400/40"
                  : "glass hover:border-brand-500/40"
              )}
            >
              <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-ink-500">
                {formatEventNight(night, { weekday: "short", day: undefined, month: undefined, year: undefined })}
              </span>
              <span className="mt-1 block font-display text-2xl font-bold leading-none text-ink-900">
                {formatEventNight(night, { weekday: undefined, day: "numeric", month: undefined, year: undefined })}
              </span>
              <span className="mt-1 block text-xs text-ink-500">
                {formatEventNight(night, { weekday: undefined, day: undefined, month: "short", year: undefined })}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
