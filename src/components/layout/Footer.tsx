import Link from "next/link";
import { Instagram, Mail, MapPin } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { EVENT, EVENT_DATE_LABEL } from "@/lib/event";

export function Footer() {
  return (
    <footer className="relative mt-24 border-t border-brand-700/10 bg-cream-200/50">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
        <div>
          <Logo size="lg" />
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-600">
            {EVENT.tagline} {EVENT_DATE_LABEL}. Organised by {EVENT.organiser}
            {EVENT.partner ? ` with ${EVENT.partner}` : ""}.
          </p>
        </div>
        <div>
          <h3 className="eyebrow mb-4">Quick links</h3>
          <ul className="space-y-2.5 text-sm text-ink-700">
            <li><Link href="/book" className="hover:text-brand-700">Book passes</Link></li>
            <li><Link href="/find" className="hover:text-brand-700">Find my booking</Link></li>
            <li><Link href="/#faq" className="hover:text-brand-700">FAQ</Link></li>
            <li><Link href="/terms" className="hover:text-brand-700">Terms &amp; refunds</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="eyebrow mb-4">Contact</h3>
          <ul className="space-y-2.5 text-sm text-ink-700">
            <li className="flex items-start gap-2">
              <Mail className="mt-0.5 h-4 w-4 text-brand-600" aria-hidden="true" />
              <a href={`mailto:${EVENT.contact.email}`} className="hover:text-brand-700">
                {EVENT.contact.email}
              </a>
            </li>
            <li className="flex items-start gap-2">
              <Instagram className="mt-0.5 h-4 w-4 text-brand-600" aria-hidden="true" />
              <a href={EVENT.contact.instagram} target="_blank" rel="noreferrer" className="hover:text-brand-700">
                @studentsurge
              </a>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 text-brand-600" aria-hidden="true" />
              <a href={EVENT.venue.mapsUrl} target="_blank" rel="noreferrer" className="hover:text-brand-700">
                {EVENT.venue.name}, {EVENT.venue.shortAddress}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-brand-700/10 py-5 text-center text-xs text-ink-400">
        © {new Date().getFullYear()} {EVENT.organiser}. Pay by UPI — we confirm each transfer by hand.
      </div>
    </footer>
  );
}
