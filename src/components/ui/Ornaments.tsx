import { useId } from "react";
import { cn } from "@/lib/utils";

/*
 * Decorative SVG artwork in the Ivory Invitation palette.
 * Two rules keep these safe to render anywhere:
 *  • Gradient IDs come from useId(). SVG ids are document-global, and a
 *    url(#id) that resolves to a copy inside a display:none parent paints
 *    nothing in Chrome — so shared ids silently break hidden/visible pairs.
 *  • Trig-derived coordinates are rounded. Node and the browser can differ in
 *    the last float digit, which React reports as a hydration mismatch.
 */

const OXBLOOD = "#521520";
const CLARET = "#6e1c2c";
const ROSE = "#a8324c";
const PARCHMENT = "#e6d2ae";
const INK = "#2a2218";

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

/** Crossed dandiya sticks glyph — one burgundy stick, one rose. */
export function Dandiya({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <g strokeLinecap="round" strokeWidth="5">
        <line x1="14" y1="50" x2="50" y2="14" stroke={CLARET} />
        <line x1="14" y1="14" x2="50" y2="50" stroke={ROSE} />
      </g>
      <circle cx="32" cy="32" r="4" fill={INK} />
    </svg>
  );
}

/** Divider with a centre motif. */
export function Divider({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)} aria-hidden="true">
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-brand-600/40" />
      <span className="text-brand-600">✦</span>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-brand-600/40" />
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
  const top = variant === "oxblood" ? "#4a101b" : CLARET;
  const bottom = variant === "oxblood" ? "#2f0a11" : OXBLOOD;
  return (
    <svg viewBox="0 0 48 88" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset="1" stopColor={bottom} />
        </linearGradient>
      </defs>
      <line x1="24" y1="0" x2="24" y2="14" stroke={ROSE} strokeWidth="1.4" />
      <rect x="16" y="14" width="16" height="5" rx="1" fill={PARCHMENT} stroke={ROSE} strokeOpacity="0.5" strokeWidth="0.8" />
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
      <path d="M17 31 V52 M24 29 V56 M31 31 V52" stroke={INK} strokeOpacity="0.25" strokeWidth="1" />
      <rect x="20" y="60" width="8" height="4" rx="1" fill={PARCHMENT} stroke={ROSE} strokeOpacity="0.5" strokeWidth="0.8" />
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

/** Line-art corner flourish — invitation-poster ornament. */
export function CornerFlourish({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 160" fill="none" aria-hidden="true" className={className}>
      <path
        d="M12 148 C12 80 80 12 148 12"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path
        d="M28 148 C28 96 64 28 148 28"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.55"
      />
      <circle cx="28" cy="132" r="3" fill="currentColor" />
      <circle cx="44" cy="108" r="2" fill="currentColor" />
      <circle cx="72" cy="72" r="2.5" fill="currentColor" />
      <circle cx="108" cy="44" r="2" fill="currentColor" />
      <path d="M20 120 C28 112 40 118 36 128 C32 122 24 124 20 120Z" fill="currentColor" opacity="0.7" />
      <path d="M120 20 C128 28 118 40 128 36 C122 32 124 24 120 20Z" fill="currentColor" opacity="0.7" />
    </svg>
  );
}
