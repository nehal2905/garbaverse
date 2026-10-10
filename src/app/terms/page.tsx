import type { Metadata } from "next";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { EVENT, EVENT_DATE_LABEL } from "@/lib/event";

export const metadata: Metadata = { title: "Terms & refunds" };

export default function TermsPage() {
  return (
    <>
      <Nav />
      <main id="main" className="mx-auto max-w-2xl px-4 pb-20 pt-32 sm:px-6">
        <p className="eyebrow">Legal</p>
        <h1 className="mt-3 font-display text-4xl font-bold text-ink-900">Terms, entry rules &amp; refunds</h1>
        <div className="mt-8 space-y-6 text-[15px] leading-relaxed text-ink-700">
          <Section title="1. The event">
            {EVENT.name} ({EVENT.subtitle}) takes place from {EVENT_DATE_LABEL} at {EVENT.venue.name},{" "}
            {EVENT.venue.address}, organised by {EVENT.organiser}.
          </Section>
          <Section title="2. Passes">
            A pass is a licence to enter the venue for the stated dates. Each booking carries one QR code
            that admits the number of people stated on the pass; everyone on a booking must enter together.
            The QR is invalidated after a single successful scan. Passes are non-transferable and must not
            be resold.
          </Section>
          <Section title="3. Payments">
            All prices are in Indian Rupees and include applicable taxes. You pay the organiser directly
            by UPI (scan the QR shown at checkout). A booking is confirmed only after we verify the
            transfer. Unpaid holds are released after {EVENT.holdMinutes} minutes. If you have already
            paid, we keep the hold while we check.
          </Section>
          <Section title="4. Refunds & cancellations">
            Passes are non-refundable except where the organiser cancels the event, in which case the full
            amount is refunded to the original payment method within 7 working days. A payment we
            receive is always honoured with a pass, even if it arrives after your hold expired. If money
            is debited but no pass reaches you within an hour, write to {EVENT.contact.email} with your
            booking ID — we will issue the pass or refund it in full. Authorisations that never complete
            are reversed by your bank, typically within 5–7 working days.
          </Section>
          <Section title="5. Entry rules">
            Carry a valid photo ID. {EVENT.ageNote} The organiser reserves the right to refuse entry or
            remove anyone who is intoxicated, carrying prohibited items (alcohol, weapons, outside food,
            drones) or behaving in a way that endangers others. No re-entry after exit.
          </Section>
          <Section title="6. Weather & force majeure">
            The event runs in light rain. In severe weather or circumstances beyond our control, timings
            may change or the event may move to a covered area; pass holders are notified by email and SMS.
          </Section>
          <Section title="7. Photography">
            The event is photographed and filmed. By attending you consent to appearing in such material
            used for promotion of {EVENT.name}.
          </Section>
          <Section title="8. Privacy">
            We collect your name, email and phone solely to issue your pass, contact you about the event
            and support gate check-in. Data is stored securely and never sold. Email{" "}
            {EVENT.contact.email} to request deletion after the event.
          </Section>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-lg font-semibold text-ink-900">{title}</h2>
      <p className="mt-2">{children}</p>
    </section>
  );
}
