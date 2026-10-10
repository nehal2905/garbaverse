"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

const links = [
  { href: "/#passes", label: "Passes" },
  { href: "/#highlights", label: "Highlights" },
  { href: "/#venue", label: "Venue" },
  { href: "/#faq", label: "FAQ" },
  { href: "/find", label: "Find my booking" },
];

export function Nav({ cta = true }: { cta?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled ? "glass-strong border-b border-brand-700/10" : "bg-transparent"
      )}
    >
      <nav
        aria-label="Primary"
        className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6"
      >
        <Logo className="!text-lg sm:!text-xl" />
        <ul className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="text-sm font-medium text-ink-700 transition-colors hover:text-brand-700"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2">
          <Link
            href="/find"
            className="hidden text-sm font-medium text-ink-700 hover:text-brand-700 min-[420px]:inline md:hidden"
          >
            Find booking
          </Link>
          {cta && (
            <Link href="/book" className="btn-primary min-h-10 px-4 text-sm sm:px-5">
              Get passes
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
