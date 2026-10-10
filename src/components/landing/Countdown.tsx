"use client";

import { useEffect, useState } from "react";

function diff(target: number) {
  const ms = Math.max(0, target - Date.now());
  return {
    d: Math.floor(ms / 86_400_000),
    h: Math.floor((ms / 3_600_000) % 24),
    m: Math.floor((ms / 60_000) % 60),
    s: Math.floor((ms / 1000) % 60),
    over: ms === 0,
  };
}

export function Countdown({ target }: { target: string }) {
  const t = new Date(target).getTime();
  const [v, setV] = useState<ReturnType<typeof diff> | null>(null);

  useEffect(() => {
    setV(diff(t));
    const id = setInterval(() => setV(diff(t)), 1000);
    return () => clearInterval(id);
  }, [t]);

  if (!v) {
    return <div className="skeleton mx-auto h-20 w-72" aria-hidden="true" />;
  }
  if (v.over) {
    return <p className="font-display text-2xl text-brand-600">The circle is open. See you on the floor!</p>;
  }

  return (
    <div role="timer" aria-live="off" aria-label="Countdown to event" className="inline-flex gap-3 sm:gap-5">
      {[
        ["Days", v.d],
        ["Hours", v.h],
        ["Mins", v.m],
        ["Secs", v.s],
      ].map(([label, n]) => (
        <div key={label as string} className="glass min-w-[4.25rem] rounded-2xl px-3 py-3 sm:min-w-[5.5rem] sm:py-4">
          <div className="font-display text-2xl font-bold tabular-nums text-brand-600 sm:text-4xl">
            {String(n).padStart(2, "0")}
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.25em] text-ink-500 sm:text-xs">{label}</div>
        </div>
      ))}
    </div>
  );
}
