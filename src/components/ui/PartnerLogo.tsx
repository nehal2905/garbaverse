import Image from "next/image";
import { cn } from "@/lib/utils";
import { EVENT } from "@/lib/event";

const SIZE = {
  xs: { box: "h-8 w-36", img: 160 },
  sm: { box: "h-10 w-48", img: 220 },
  md: { box: "h-12 w-64 sm:h-14 sm:w-72", img: 320 },
  lg: { box: "h-16 w-72 sm:h-[4.5rem] sm:w-80", img: 360 },
} as const;

type Brand = "organiser" | "partner";

const BRAND: Record<Brand, { src: string; name: string; label: string }> = {
  organiser: { src: EVENT.organiserLogo, name: EVENT.organiser, label: "Organised by" },
  partner: { src: EVENT.partnerLogo, name: EVENT.partner, label: "Photography partner" },
};

export function BrandLogo({
  brand,
  size = "md",
  className,
}: {
  brand: Brand;
  size?: keyof typeof SIZE;
  className?: string;
}) {
  const item = BRAND[brand];
  if (!item.src) return null;
  const s = SIZE[size];
  return (
    <span className={cn("relative inline-flex shrink-0 items-center justify-center", s.box, className)}>
      <Image
        src={item.src}
        alt={`${item.name} logo`}
        width={s.img}
        height={Math.round(s.img / 3.6)}
        unoptimized
        className="h-full w-full object-contain object-left"
      />
    </span>
  );
}

/** Student Surge + DR Photo Studios, used on the hero, passes, footer, and pass. */
export function BrandPair({
  size = "md",
  align = "center",
  className,
}: {
  size?: keyof typeof SIZE;
  align?: "center" | "start";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-end gap-x-8 gap-y-4",
        align === "center" ? "justify-center" : "justify-center lg:justify-start",
        className
      )}
    >
      {(["organiser", "partner"] as const).map((brand) => (
        <figure key={brand} className="m-0">
          <figcaption className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-ink-400">
            {BRAND[brand].label}
          </figcaption>
          <BrandLogo brand={brand} size={size} />
        </figure>
      ))}
    </div>
  );
}

/** @deprecated Use BrandLogo brand="partner" */
export function PartnerLogo({ size = "md", className }: { size?: keyof typeof SIZE; className?: string }) {
  return <BrandLogo brand="partner" size={size} className={className} />;
}
