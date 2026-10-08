import { Car, Clock, MapPin, TrainFront } from "lucide-react";
import { EVENT, formatEventTime } from "@/lib/event";

export function Venue() {
  return (
    <section id="venue" className="scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="eyebrow">Venue</p>
          <h2 className="mt-3 font-display text-3xl font-bold text-cream sm:text-5xl">
            {EVENT.venue.name}
          </h2>
          <p className="mt-4 text-cream/70">{EVENT.venue.address}</p>

          <dl className="mt-8 grid gap-4 sm:grid-cols-2">
            <Info icon={<Clock className="h-5 w-5" />} title="Gates open">
              {formatEventTime(EVENT.gatesOpenAt)} · Aarti at {formatEventTime(EVENT.startsAt)}
            </Info>
            <Info icon={<TrainFront className="h-5 w-5" />} title="By metro / train">
              Parade Ground metro (Blue line) is a 10-min walk. Secunderabad station is 2 km away.
            </Info>
            <Info icon={<Car className="h-5 w-5" />} title="Parking">
              Paid parking inside the grounds. Auto & cab drop-off at Gate 2.
            </Info>
            <Info icon={<MapPin className="h-5 w-5" />} title="Landmark">
              Opposite the Secunderabad Clock Tower, next to Parade Grounds.
            </Info>
          </dl>

          <a
            href={EVENT.venue.mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-outline mt-8"
          >
            <MapPin className="h-4 w-4" aria-hidden="true" /> Open in Google Maps
          </a>
        </div>

        <div className="glass-strong overflow-hidden rounded-3xl p-2">
          <iframe
            title="Map to Gymkhana Cricket Ground, Secunderabad"
            src={EVENT.venue.embedUrl}
            // The keyless embed has no dark style; invert + hue-rotate gives a
            // dark map that keeps road/park colours roughly true.
            className="aspect-[4/3] w-full rounded-2xl [filter:invert(0.9)_hue-rotate(180deg)_saturate(0.6)_contrast(0.95)]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      </div>
    </section>
  );
}

function Info({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="glass flex gap-3 rounded-2xl p-4">
      <span className="mt-0.5 text-brand-400" aria-hidden="true">
        {icon}
      </span>
      <div>
        <dt className="font-semibold text-cream">{title}</dt>
        <dd className="mt-1 text-sm text-cream/65">{children}</dd>
      </div>
    </div>
  );
}
