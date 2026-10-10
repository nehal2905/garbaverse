import Link from "next/link";
import { cn } from "@/lib/utils";
import { Dandiya } from "./Ornaments";

export function Logo({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const text = size === "lg" ? "text-3xl" : size === "sm" ? "text-lg" : "text-xl";
  return (
    <Link
      href="/"
      className={cn("inline-flex items-center gap-2 font-display font-bold tracking-wider", text, className)}
      aria-label="GarbaVerse home"
    >
      <Dandiya className="h-7 w-7" />
      <span className="text-brand-600">
        Garba<span className="font-normal">Verse</span>
      </span>
    </Link>
  );
}
