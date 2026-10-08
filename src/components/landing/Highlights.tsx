"use client";

import { motion } from "framer-motion";
import { Drum, Flame, Sparkles, Utensils, Camera, Trophy } from "lucide-react";
import { Divider } from "@/components/ui/Ornaments";

const items = [
  {
    icon: Drum,
    title: "Live dhol & DJ",
    text: "A live dhol troupe trading beats with a Bollywood-garba DJ set. Non-stop from 6 to 11.",
  },
  {
    icon: Flame,
    title: "Grand aarti at dusk",
    text: "We open the circle the traditional way — a lamp-lit aarti as the sun goes down.",
  },
  {
    icon: Sparkles,
    title: "Dandiya arena",
    text: "Dedicated dandiya rounds with sticks provided. Beginners get a 10-minute crash course.",
  },
  {
    icon: Trophy,
    title: "Best dressed & best dancer",
    text: "Prizes every hour. Chaniya cholis, kediyus, and mirror-work encouraged.",
  },
  {
    icon: Utensils,
    title: "Gujarati food court",
    text: "Dhokla, fafda-jalebi, pav bhaji and more from Hyderabad's favourite vendors.",
  },
  {
    icon: Camera,
    title: "Photo booth & reels wall",
    text: "A lit mandala backdrop and a 360° booth. Free prints for Couple & Squad passes.",
  },
];

export function Highlights() {
  return (
    <section id="highlights" className="scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">What to expect</p>
          <h2 className="mt-3 font-display text-3xl font-bold text-cream sm:text-5xl">
            Five hours. One circle. <span className="accent-text">Zero</span> standing still.
          </h2>
          <Divider className="mx-auto mt-6 max-w-xs" />
        </div>

        <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it, i) => (
            <motion.li
              key={it.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: (i % 3) * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="glass group relative overflow-hidden rounded-3xl p-6 transition-colors hover:border-brand-500/40"
            >
              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand-500/10 blur-2xl transition-opacity group-hover:opacity-100 sm:opacity-0" />
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500/25 to-brand-900/40 text-brand-300 ring-1 ring-brand-500/30">
                <it.icon className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="mt-5 font-display text-lg font-semibold text-cream">{it.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-cream/65">{it.text}</p>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
