import type { Metadata } from "next";
import { adminStats } from "@/lib/admin-data";
import { formatINR } from "@/lib/utils";
import { BookingsTable } from "./BookingsTable";

export const metadata: Metadata = { title: "Admin · Bookings", robots: { index: false } };

export default async function AdminPage() {
  const stats = await adminStats();
  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">Dashboard</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-ink-900">Bookings</h1>
      </div>

      <section aria-label="Key numbers" className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Revenue" value={formatINR(stats.revenuePaise)} />
        <Stat label="Confirmed bookings" value={stats.confirmedBookings.toLocaleString("en-IN")} />
        <Stat label="Attendees" value={stats.attendees.toLocaleString("en-IN")} />
        <Stat label="Checked in" value={`${stats.checkedIn.toLocaleString("en-IN")} / ${stats.confirmedBookings}`} />
        <Stat label="To confirm" value={stats.pending.toLocaleString("en-IN")} />
      </section>

      <section aria-label="Inventory" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.tiers.map((t) => {
          const pct = t.capacity ? Math.round((t.sold / t.capacity) * 100) : 0;
          return (
            <div key={t.id} className="glass rounded-2xl p-4">
              <div className="flex items-baseline justify-between">
                <span className="font-semibold text-ink-900">{t.name}</span>
                <span className="text-xs text-ink-500">{formatINR(t.price_paise)}</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-brand-700/10">
                <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-2 flex justify-between text-xs text-ink-600">
                <span>
                  {t.sold} sold · {t.reserved} held
                </span>
                <span>{t.available} left</span>
              </div>
            </div>
          );
        })}
      </section>

      <BookingsTable />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="text-xs uppercase tracking-wider text-ink-500">{label}</div>
      <div className="mt-1 font-display text-2xl font-bold text-brand-600">{value}</div>
    </div>
  );
}
