import "server-only";
import { Resend } from "resend";
import { render } from "@react-email/render";
import React from "react";
import PassEmail from "@/emails/PassEmail";
import { env } from "./env";
import { EVENT, EVENT_TIME_LABEL, GATES_OPEN_LABEL, bookingNights, brandLogoUrl, formatEventNights, formatEventTime } from "./event";
import { formatINR } from "./utils";
import { passLinks } from "./links";
import { googleCalendarUrl } from "./ics";
import { renderPassPdf } from "./pdf";
import { signBookingId } from "./signing";
import type { Booking, TicketType } from "./types";

let resend: Resend | null = null;
function client() {
  if (!resend) resend = new Resend(env.resendApiKey);
  return resend;
}

/**
 * Sends the pass email with PDF attached. Idempotency is enforced upstream
 * (only called when confirm_booking transitioned, or on explicit resend).
 */
export async function sendPassEmail(booking: Booking, tier: TicketType) {
  const links = passLinks(booking);
  const qrPayload = signBookingId(booking.id);
  const qrImageUrl = `${env.siteUrl}/api/pass/${booking.id}/qr.png?t=${links.token}`;
  const nights = bookingNights(booking);
  const googleCalUrl = googleCalendarUrl({
    bookingId: booking.id,
    passUrl: links.view,
    eventDates: nights,
  });

  const props = {
    attendeeName: booking.name,
    bookingId: booking.id,
    tierName: tier.name,
    quantity: booking.quantity,
    attendees: booking.attendees,
    amountLabel: formatINR(booking.amount_paise),
    eventName: EVENT.name,
    eventSubtitle: EVENT.subtitle,
    organiser: EVENT.organiser,
    dateLabel: formatEventNights(nights),
    timeLabel: EVENT_TIME_LABEL,
    venueName: EVENT.venue.name,
    venueAddress: EVENT.venue.address,
    mapsUrl: EVENT.venue.mapsUrl,
    qrImageUrl,
    passUrl: links.view,
    pdfUrl: links.pdf,
    icsUrl: links.ics,
    googleCalUrl,
    supportEmail: EVENT.contact.email,
    gatesLabel: GATES_OPEN_LABEL,
    startLabel: formatEventTime(EVENT.startsAt),
    ageNote: EVENT.ageNote,
    organiserLogoUrl: brandLogoUrl(env.siteUrl, "organiser"),
    partnerLogoUrl: brandLogoUrl(env.siteUrl, "partner"),
  };

  const element = React.createElement(PassEmail, props);
  const [html, text, pdf] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
    renderPassPdf({ booking, tier, qrPayload }),
  ]);

  const { error } = await client().emails.send({
    from: env.emailFrom,
    to: booking.email,
    replyTo: env.emailReplyTo,
    subject: `🎟️ You're in! Your ${EVENT.name} pass is here (${booking.id})`,
    html,
    text: plainTextFallback(text, props),
    attachments: [
      {
        filename: `GarbaVerse-Pass-${booking.id}.pdf`,
        content: pdf.toString("base64"),
        contentType: "application/pdf",
      },
    ],
    headers: {
      "X-Entity-Ref-ID": booking.id, // stops Gmail threading unrelated passes
    },
    tags: [
      { name: "type", value: "pass" },
      { name: "tier", value: tier.id },
    ],
  });

  if (error) throw new Error(`Resend error: ${error.message}`);
}

/** Ensures the plain-text part always carries the essentials, even if the renderer trims. */
function plainTextFallback(
  rendered: string,
  p: { bookingId: string; attendeeName: string; tierName: string; passUrl: string; pdfUrl: string; dateLabel: string }
) {
  const essentials = [
    `${EVENT.name} — ${EVENT.subtitle}`,
    ``,
    `You're in, ${p.attendeeName}!`,
    `Booking ID: ${p.bookingId}`,
    `Pass: ${p.tierName}`,
    `When: ${p.dateLabel}, ${EVENT_TIME_LABEL} IST`,
    `Where: ${EVENT.venue.name}, ${EVENT.venue.address}`,
    `Map: ${EVENT.venue.mapsUrl}`,
    ``,
    `View your pass & QR: ${p.passUrl}`,
    `Download PDF: ${p.pdfUrl}`,
    ``,
    `Show the QR at the gate. One scan per booked night. Questions: ${EVENT.contact.email}`,
  ].join("\n");
  return rendered && rendered.trim().length > 50 ? rendered : essentials;
}
