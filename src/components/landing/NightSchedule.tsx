"use client";

import { motion } from "framer-motion";
import { Divider } from "@/components/ui/Ornaments";

const beats = [
  { time: "5:30 PM", title: "Gates open", text: "Wristbands, photo booth, first chai." },
  { time: "6:00 PM", title: "Aarti", text: "We light the circle the traditional way." },
  { time: "7:00 PM", title: "Dandiya rounds", text: "Sticks out. Crash course for first-timers." },
  { time: "9:00 PM", title: "Dhol vs DJ", text: "The ground goes loud. This is the peak." },
  { time: "11:00 PM", title: "Last song", text: "One more sanedo, then the night bows." },
];

export function NightSchedule() {
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="text-center">
          <p className="eyebrow">The night, beat by beat</p>
          <h2 className="mt-3 font-display text-3xl font-bold text-cream sm:text-5xl">
            Five hours. <span className="accent-text">No encore needed.</span>
          </h2>
          <Divider className="mx-auto mt-6 max-w-xs" />
        </div>

        <ol className="mt-12 grid gap-3 sm:grid-cols-5">
          {beats.map((b, i) => (
            <motion.li
              key={b.time}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="glass relative rounded-3xl p-4 text-center sm:p-5"
            >
              <span className="font-display text-sm font-semibold text-brand-300">{b.time}</span>
              <h3 className="mt-2 font-display text-lg font-semibold text-cream">{b.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-cream/65">{b.text}</p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
