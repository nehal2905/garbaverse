import { Star } from "lucide-react";

const quotes = [
  {
    name: "Ananya R.",
    role: "Came with 6 friends · 2025",
    text: "The dhol-vs-DJ bit at 9 PM had the whole ground screaming. Easily the best Navratri night in Hyderabad.",
  },
  {
    name: "Rohan & Meera",
    role: "Couple Pass · 2025",
    text: "Entry took 20 seconds with the QR. Lights, food, the aarti — felt like a proper Ahmedabad garba.",
  },
  {
    name: "Sneha K.",
    role: "First-time garba dancer",
    text: "I didn't know a single step. The 10-minute crash course and friendly crowd fixed that fast.",
  },
];

export function Testimonials() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Last year</p>
          <h2 className="mt-3 font-display text-3xl font-bold text-ink-900 sm:text-5xl">
            3,000 dancers. <span className="accent-text">One</span> circle.
          </h2>
        </div>
        <ul className="mt-12 grid gap-4 md:grid-cols-3">
          {quotes.map((q) => (
            <li key={q.name} className="glass flex flex-col rounded-3xl p-6">
              <div className="flex gap-0.5 text-saffron" aria-label="5 out of 5 stars">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" aria-hidden="true" />
                ))}
              </div>
              <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-ink-800">
                “{q.text}”
              </blockquote>
              <footer className="mt-5 text-sm">
                <div className="font-semibold text-ink-900">{q.name}</div>
                <div className="text-ink-500">{q.role}</div>
              </footer>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
