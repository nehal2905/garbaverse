import Link from "next/link";
import { Instagram, Mail, MapPin } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { EVENT, EVENT_DATE_LABEL } from "@/lib/event";

export function Footer() {
  return (
    <footer className="relative mt-24 border-t border-brand-500/15 bg-ink-950/60">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
        <div>
          <Logo size="lg" />
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-cream/60">
            {EVENT.subtitle}. {EVENT_DATE_LABEL}. Organised by {EVENT.organiser}.
          </p>
        </div>
        <div>
          <h3 className="eyebrow mb-4">Quick links</h3>
          <ul className="space-y-2.5 text-sm text-cream/75">
            <li><Link href="/book" className="hover:text-brand-300">Book passes</Link></li>
            <li><Link href="/find" className="hover:text-brand-300">Find my booking</Link></li>
            <li><Link href="/#faq" className="hover:text-brand-300">FAQ</Link></li>
            <li><Link href="/terms" className="hover:text-brand-300">Terms &amp; refunds</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="eyebrow mb-4">Contact</h3>
          <ul className="space-y-2.5 text-sm text-cream/75">
            <li className="flex items-start gap-2">
              <Mail className="mt-0.5 h-4 w-4 text-brand-400" aria-hidden="true" />
              <a href={`mailto:${EVENT.contact.email}`} className="hover:text-brand-300">
                {EVENT.contact.email}
              </a>
            </li>
            <li className="flex items-start gap-2">
              <Instagram className="mt-0.5 h-4 w-4 text-brand-400" aria-hidden="true" />
              <a href={EVENT.contact.instagram} target="_blank" rel="noreferrer" className="hover:text-brand-300">
                @studentsurge
              </a>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 text-brand-400" aria-hidden="true" />
              <a href={EVENT.venue.mapsUrl} target="_blank" rel="noreferrer" className="hover:text-brand-300">
                {EVENT.venue.name}, {EVENT.venue.shortAddress}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/5 py-5 text-center text-xs text-cream/40">
        © {new Date().getFullYear()} {EVENT.organiser}. Payments secured by Razorpay.
      </div>
    </footer>
  );
}
