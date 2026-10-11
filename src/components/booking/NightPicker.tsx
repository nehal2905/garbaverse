"use client";

import { EVENT_NIGHTS, formatEventNight, type EventNight } from "@/lib/event";
import { cn } from "@/lib/utils";

interface Props {
  value: EventNight[];
  onChange: (nights: EventNight[]) => void;
}

export function NightPicker({ value, onChange }: Props) {
  const selected = new Set(value);

  const toggle = (night: EventNight) => {
    if (selected.has(night)) onChange(value.filter((n) => n !== night));
    else onChange([...value, night].sort() as EventNight[]);
  };

  return (
    <fieldset>
      <legend className="label">Which nights?</legend>
      <p className="mt-1 text-xs text-ink-500">
        Prices are per night. Tap every night you want — same pass, added together at checkout.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {EVENT_NIGHTS.map((night) => {
          const on = selected.has(night);
          return (
            <button
              key={night}
              type="button"
              role="checkbox"
              aria-checked={on}
              onClick={() => toggle(night)}
              className={cn(
                "rounded-2xl px-3 py-3 text-left transition-all duration-200",
                on
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
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <button
          type="button"
          className="font-semibold text-brand-600 underline-offset-2 hover:underline"
          onClick={() => onChange([...EVENT_NIGHTS])}
        >
          All four nights
        </button>
        {value.length > 0 && (
          <button
            type="button"
            className="text-ink-500 underline-offset-2 hover:underline"
            onClick={() => onChange([])}
          >
            Clear
          </button>
        )}
        {value.length > 0 && (
          <span className="text-ink-400">
            {value.length} {value.length === 1 ? "night" : "nights"} selected
          </span>
        )}
      </div>
    </fieldset>
  );
}
