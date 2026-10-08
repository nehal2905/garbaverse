import { useId } from "react";
import { cn } from "@/lib/utils";

/*
 * Decorative SVG artwork in the Noir Vineyard palette — matte, no glows.
 * Two rules keep these safe to render anywhere:
 *  • Gradient IDs come from useId(). SVG ids are document-global, and a
 *    url(#id) that resolves to a copy inside a display:none parent paints
 *    nothing in Chrome — so shared ids silently break hidden/visible pairs.
 *  • Trig-derived coordinates are rounded. Node and the browser can differ in
 *    the last float digit, which React reports as a hydration mismatch.
 */

const OXBLOOD = "#3c0b18";
const CLARET = "#7b1024";
const ROSE = "#bd7380"; // claret lifted for visibility on midnight
const PARCHMENT = "#f2e8e1";
const MIDNIGHT = "#0b0f1c";

/** Round to 2dp: plenty for a 400-unit viewBox, identical on server and client. */
const r2 = (n: number) => Math.round(n * 100) / 100;

/** Slow-turning mandala ring — pure SVG, used as hero depth + pass artwork. */
export function Mandala({ className, spin = true }: { className?: string; spin?: boolean }) {
  const id = `mandala-${useId().replace(/:/g, "")}`;
  const rays = Array.from({ length: 24 });
  const petals = Array.from({ length: 12 });
  return (
    <svg
      viewBox="0 0 400 400"
      aria-hidden="true"
      className={cn(spin && "motion-safe:animate-[spin_120s_linear_infinite]", className)}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={ROSE} />
          <stop offset="1" stopColor={CLARET} />
        </linearGradient>
      </defs>
      <g fill="none" stroke={`url(#${id})`} strokeWidth="1.2">
        <circle cx="200" cy="200" r="190" strokeDasharray="4 8" />
        <circle cx="200" cy="200" r="160" />
        <circle cx="200" cy="200" r="120" strokeDasharray="2 6" />
        <circle cx="200" cy="200" r="70" />
        {rays.map((_, i) => {
          const a = (i * 15 * Math.PI) / 180;
          return (
            <line
              key={i}
              x1={r2(200 + Math.cos(a) * 125)}
              y1={r2(200 + Math.sin(a) * 125)}
              x2={r2(200 + Math.cos(a) * 158)}
              y2={r2(200 + Math.sin(a) * 158)}
            />
          );
        })}
        {petals.map((_, i) => (
          <ellipse
            key={i}
            cx="200"
            cy="110"
            rx="18"
            ry="44"
            transform={`rotate(${i * 30} 200 200)`}
          />
        ))}
        {petals.map((_, i) => (
          <circle
            key={`d${i}`}
            cx={r2(200 + Math.cos((i * 30 * Math.PI) / 180) * 175)}
            cy={r2(200 + Math.sin((i * 30 * Math.PI) / 180) * 175)}
            r="3"
            fill={`url(#${id})`}
          />
        ))}
      </g>
    </svg>
  );
}

/** Crossed dandiya sticks glyph — one claret stick, one parchment. */
export function Dandiya({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <g strokeLinecap="round" strokeWidth="5">
        <line x1="14" y1="50" x2="50" y2="14" stroke={PARCHMENT} />
        <line x1="14" y1="14" x2="50" y2="50" stroke={ROSE} />
      </g>
      <circle cx="32" cy="32" r="4" fill={CLARET} stroke={MIDNIGHT} strokeWidth="1.5" />
    </svg>
  );
}

/** Divider with a centre motif. */
export function Divider({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)} aria-hidden="true">
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-brand-400/40" />
      <span className="text-brand-400">✦</span>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-brand-400/40" />
    </div>
  );
}

/** Hanging paper lantern — used in the hero corners. Matte claret, no glow. */
export function Lantern({
  className,
  variant = "claret",
}: {
  className?: string;
  variant?: "claret" | "oxblood";
}) {
  const id = `lantern-${useId().replace(/:/g, "")}`;
  const top = variant === "oxblood" ? "#5e0c1c" : CLARET;
  const bottom = variant === "oxblood" ? "#24060e" : OXBLOOD;
  return (
    <svg viewBox="0 0 48 88" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset="1" stopColor={bottom} />
        </linearGradient>
      </defs>
      <line x1="24" y1="0" x2="24" y2="14" stroke="#2d354e" strokeWidth="1.4" />
      <rect x="16" y="14" width="16" height="5" rx="1" fill="#181e33" stroke={ROSE} strokeOpacity="0.4" strokeWidth="0.8" />
      <path
        d="M10 22 C10 20 14 19 24 19 C34 19 38 20 38 22 L36 48 C36 56 30 60 24 60 C18 60 12 56 12 48 Z"
        fill={`url(#${id})`}
      />
      <path
        d="M14 26 C16 24 20 23 24 23 C28 23 32 24 34 26"
        fill="none"
        stroke={PARCHMENT}
        strokeWidth="1.2"
        opacity="0.25"
      />
      <path d="M17 31 V52 M24 29 V56 M31 31 V52" stroke={MIDNIGHT} strokeOpacity="0.35" strokeWidth="1" />
      <rect x="20" y="60" width="8" height="4" rx="1" fill="#181e33" stroke={ROSE} strokeOpacity="0.4" strokeWidth="0.8" />
      <path d="M22 64 L24 76 L26 64" fill={ROSE} opacity="0.7" />
    </svg>
  );
}

/** Bloom garland across the top of the page — matte wine blooms. */
export function Garland({ className }: { className?: string }) {
  const blooms = Array.from({ length: 17 });
  return (
    <div className={cn("pointer-events-none flex h-10 items-start justify-between px-1", className)} aria-hidden="true">
      {blooms.map((_, i) => (
        <span
          key={i}
          className="relative mt-[2px] block h-3.5 w-3.5 rounded-full bg-brand-500 ring-1 ring-brand-800"
          style={{ transform: `translateY(${(i % 3) * 3}px) rotate(${i * 18}deg)` }}
        >
          <span className="absolute inset-[4px] rounded-full bg-brand-300/70" />
        </span>
      ))}
    </div>
  );
}
