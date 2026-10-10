import Image from "next/image";
import { cn } from "@/lib/utils";
import { EVENT } from "@/lib/event";

const SIZE = {
  sm: { box: "h-12 w-12", img: 48 },
  md: { box: "h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem]", img: 72 },
  lg: { box: "h-20 w-20 sm:h-24 sm:w-24", img: 96 },
} as const;

export function PartnerLogo({
  size = "md",
  className,
}: {
  size?: keyof typeof SIZE;
  className?: string;
}) {
  if (!EVENT.partnerLogo) return null;
  const s = SIZE[size];
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 overflow-hidden rounded-2xl bg-ink-950 shadow-soft ring-1 ring-saffron/35",
        s.box,
        className
      )}
    >
      <Image
        src={EVENT.partnerLogo}
        alt={`${EVENT.partner} logo`}
        width={s.img}
        height={s.img}
        className="h-full w-full object-cover"
      />
    </span>
  );
}
