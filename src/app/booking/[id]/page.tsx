import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { BookingStatus } from "@/components/pass/BookingStatus";
import { getBookingWithTier, toPublicBooking } from "@/lib/bookings";
import { verifyPassAccessToken } from "@/lib/signing";
import { passLinks } from "@/lib/links";
import { googleCalendarUrl } from "@/lib/ics";
import { BOOKING_ID_PATTERN } from "@/lib/utils";

export const metadata: Metadata = { title: "Your pass", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function BookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { id } = await params;
  const { t } = await searchParams;
  if (!BOOKING_ID_PATTERN.test(id)) notFound();

  const res = await getBookingWithTier(id);
  if (!res) notFound();

  const authorised = verifyPassAccessToken(res.booking.id, res.booking.email, t ?? "");

  return (
    <>
      <Nav cta={false} />
      <main id="main" className="min-h-dvh">
        {authorised ? (
          <BookingStatus
            initial={toPublicBooking(res.booking, res.tier)}
            token={t!}
            googleCalUrl={googleCalendarUrl({
              bookingId: id,
              passUrl: passLinks(res.booking).view,
              eventDate: res.booking.event_date,
            })}
          />
        ) : (
          <div className="mx-auto max-w-md px-4 pt-40 text-center">
            <h1 className="font-display text-3xl font-bold text-ink-900">This link isn&apos;t valid</h1>
            <p className="mt-3 text-ink-600">
              To protect your pass, we need to verify it&apos;s you. Look it up with the email you booked with.
            </p>
            <Link href={`/find?id=${id}`} className="btn-primary mt-6">
              Find my booking
            </Link>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
