import * as React from "react";
import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";

/**
 * Table-based, inline-styled pass email. Renders in Gmail, Outlook (desktop &
 * web) and Apple Mail. No flexbox/grid, no background-image dependence, QR is a
 * hosted PNG (data: URIs are blocked by Gmail).
 */
export interface PassEmailProps {
  attendeeName: string;
  bookingId: string;
  tierName: string;
  quantity: number;
  attendees: number;
  amountLabel: string;
  eventName: string;
  eventSubtitle: string;
  organiser: string;
  dateLabel: string;
  timeLabel: string;
  venueName: string;
  venueAddress: string;
  mapsUrl: string;
  qrImageUrl: string;
  passUrl: string;
  pdfUrl: string;
  icsUrl: string;
  googleCalUrl: string;
  supportEmail: string;
  gatesLabel: string;
  startLabel: string;
  ageNote: string;
  organiserLogoUrl?: string;
  partnerLogoUrl?: string;
}

// Brand: Ivory Invitation (mirrors tailwind.config.ts tokens).
const SURFACE = "#f4e6c6";
const PAGE = "#e6d2ae";
const CARD = "#d4be94";
const ACCENT = "#8f2438";
const ACCENT_TEXT = "#6e1c2c";
const LINE = "#521520";
const CREAM = "#2a2218";
const MUTED = "#726656";

const font = "'Segoe UI', Helvetica, Arial, sans-serif";
const serif = "Georgia, 'Times New Roman', serif";

export default function PassEmail(p: PassEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>
        You&apos;re in, {p.attendeeName}! Booking {p.bookingId} · {p.tierName} · {p.dateLabel}
      </Preview>
      <Body style={{ margin: 0, padding: 0, backgroundColor: PAGE, fontFamily: font }}>
        <Container style={{ maxWidth: 560, margin: "0 auto", padding: "24px 12px" }}>
          {/* Header */}
          <Section style={{ textAlign: "center", padding: "8px 0 20px" }}>
            {(p.organiserLogoUrl || p.partnerLogoUrl) && (
              <Row>
                {p.organiserLogoUrl ? (
                  <Column style={{ padding: "0 8px 12px", textAlign: "center" }}>
                    <Text
                      style={{
                        margin: "0 0 6px",
                        color: MUTED,
                        fontSize: 9,
                        letterSpacing: 2,
                        textTransform: "uppercase",
                      }}
                    >
                      Organised by
                    </Text>
                    <Img
                      src={p.organiserLogoUrl}
                      alt={p.organiser}
                      width={150}
                      height={44}
                      style={{ display: "inline-block", width: 150, height: "auto" }}
                    />
                  </Column>
                ) : null}
                {p.partnerLogoUrl ? (
                  <Column style={{ padding: "0 8px 12px", textAlign: "center" }}>
                    <Text
                      style={{
                        margin: "0 0 6px",
                        color: MUTED,
                        fontSize: 9,
                        letterSpacing: 2,
                        textTransform: "uppercase",
                      }}
                    >
                      Photography partner
                    </Text>
                    <Img
                      src={p.partnerLogoUrl}
                      alt="DR Photo Studios"
                      width={168}
                      height={40}
                      style={{ display: "inline-block", width: 168, height: "auto" }}
                    />
                  </Column>
                ) : null}
              </Row>
            )}
            <Text
              style={{
                margin: 0,
                color: ACCENT_TEXT,
                fontSize: 11,
                letterSpacing: 4,
                textTransform: "uppercase",
              }}
            >
              {p.organiser} presents
            </Text>
            <Heading
              as="h1"
              style={{
                margin: "6px 0 0",
                color: CREAM,
                fontFamily: serif,
                fontSize: 40,
                fontWeight: 700,
                letterSpacing: 2,
                lineHeight: 1.1,
              }}
            >
              {p.eventName}
            </Heading>
            <Text style={{ margin: "4px 0 0", color: CREAM, fontFamily: serif, fontSize: 16, fontStyle: "italic" }}>
              {p.eventSubtitle}
            </Text>
          </Section>

          {/* Greeting */}
          <Section style={{ padding: "0 4px 18px" }}>
            <Heading as="h2" style={{ margin: 0, color: CREAM, fontSize: 24, fontWeight: 700 }}>
              You&apos;re in, {p.attendeeName.split(" ")[0]}! 🎉
            </Heading>
            <Text style={{ margin: "8px 0 0", color: MUTED, fontSize: 15, lineHeight: 1.55 }}>
              Your pass is confirmed. Show the QR below at the gate — on your phone or printed. Your
              PDF pass is attached to this email too.
            </Text>
          </Section>

          {/* Ticket card */}
          <Section
            style={{
              backgroundColor: SURFACE,
              border: `1px solid ${LINE}`,
              borderRadius: 18,
              overflow: "hidden",
            }}
          >
            {/* gold stripe */}
            <Row>
              <Column style={{ height: 6, backgroundColor: ACCENT, fontSize: 1, lineHeight: "6px" }}>
                &nbsp;
              </Column>
            </Row>

            <Section style={{ padding: "22px 24px 8px" }}>
              <Row>
                <Column style={{ verticalAlign: "top" }}>
                  <Label>Attendee</Label>
                  <Value>{p.attendeeName}</Value>
                  <Label>Pass</Label>
                  <Value>
                    {p.tierName} × {p.quantity}
                    {p.attendees > 1 ? ` · admits ${p.attendees}` : ""}
                  </Value>
                  <Label>Date &amp; time</Label>
                  <Value small>
                    {p.dateLabel}
                    <br />
                    {p.timeLabel} IST
                  </Value>
                  <Label>Venue</Label>
                  <Value small>
                    {p.venueName}
                    <br />
                    <Link href={p.mapsUrl} style={{ color: ACCENT_TEXT, textDecoration: "underline" }}>
                      {p.venueAddress}
                    </Link>
                  </Value>
                </Column>
                <Column style={{ width: 172, verticalAlign: "top", textAlign: "right" }}>
                  <table
                    role="presentation"
                    cellPadding={0}
                    cellSpacing={0}
                    align="right"
                    style={{ backgroundColor: "#ffffff", borderRadius: 14 }}
                  >
                    <tbody>
                      <tr>
                        <td style={{ padding: 8 }}>
                          <Img
                            src={p.qrImageUrl}
                            width={150}
                            height={150}
                            alt={`QR code for booking ${p.bookingId}`}
                            style={{ display: "block", width: 150, height: 150 }}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td
                          style={{
                            padding: "0 8px 10px",
                            color: MUTED,
                            fontSize: 10,
                            letterSpacing: 2,
                            textTransform: "uppercase",
                            textAlign: "center",
                          }}
                        >
                          Scan at gate
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </Column>
              </Row>
            </Section>

            {/* perforation */}
            <Section style={{ padding: "6px 0" }}>
              <Hr style={{ borderColor: LINE, borderStyle: "dashed", borderWidth: "1px 0 0", margin: 0 }} />
            </Section>

            {/* stub */}
            <Section style={{ padding: "10px 24px 22px" }}>
              <Row>
                <Column style={{ verticalAlign: "top" }}>
                  <Label>Booking ID</Label>
                  <Text
                    style={{
                      margin: 0,
                      color: ACCENT_TEXT,
                      fontFamily: "'Courier New', Courier, monospace",
                      fontSize: 24,
                      fontWeight: 700,
                      letterSpacing: 3,
                    }}
                  >
                    {p.bookingId}
                  </Text>
                </Column>
                <Column style={{ verticalAlign: "top", textAlign: "right" }}>
                  <Label>Amount paid</Label>
                  <Text style={{ margin: 0, color: ACCENT_TEXT, fontSize: 20, fontWeight: 700 }}>
                    {p.amountLabel}
                  </Text>
                  <Text
                    style={{
                      display: "inline-block",
                      margin: "8px 0 0",
                      backgroundColor: ACCENT,
                      color: CREAM,
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: 2,
                      textTransform: "uppercase",
                      padding: "5px 10px",
                      borderRadius: 999,
                    }}
                  >
                    Confirmed
                  </Text>
                </Column>
              </Row>
            </Section>
          </Section>

          {/* Actions */}
          <Section style={{ textAlign: "center", padding: "22px 0 6px" }}>
            <Button
              href={p.passUrl}
              style={{
                backgroundColor: ACCENT,
                color: CREAM,
                fontWeight: 700,
                fontSize: 15,
                padding: "14px 28px",
                borderRadius: 999,
                textDecoration: "none",
              }}
            >
              View my pass
            </Button>
          </Section>
          <Section style={{ textAlign: "center", padding: "6px 0 18px" }}>
            <Text style={{ margin: 0, color: MUTED, fontSize: 14, lineHeight: 1.8 }}>
              <Link href={p.pdfUrl} style={{ color: ACCENT_TEXT }}>
                Download PDF
              </Link>
              {"   ·   "}
              <Link href={p.icsUrl} style={{ color: ACCENT_TEXT }}>
                Add to Calendar (.ics)
              </Link>
              {"   ·   "}
              <Link href={p.googleCalUrl} style={{ color: ACCENT_TEXT }}>
                Google Calendar
              </Link>
              {"   ·   "}
              <Link href={p.mapsUrl} style={{ color: ACCENT_TEXT }}>
                Open in Maps
              </Link>
            </Text>
          </Section>

          {/* Know before you go */}
          <Section style={{ backgroundColor: CARD, borderRadius: 14, padding: "18px 22px" }}>
            <Heading as="h3" style={{ margin: "0 0 8px", color: CREAM, fontSize: 16 }}>
              Know before you go
            </Heading>
            <Text style={{ margin: 0, color: MUTED, fontSize: 14, lineHeight: 1.7 }}>
              • Gates open {p.gatesLabel}. Come early for the aarti at {p.startLabel}.
              <br />• One scan per booked night — the QR stays valid for unused nights.
              <br />• Traditional wear encouraged. Dandiya sticks are provided.
              <br />• Carry a valid photo ID. {p.ageNote}
            </Text>
          </Section>

          {/* Footer */}
          <Section style={{ textAlign: "center", padding: "22px 8px 0" }}>
            <Text style={{ margin: 0, color: MUTED, fontSize: 12, lineHeight: 1.7 }}>
              Questions? Reply to this email or write to{" "}
              <Link href={`mailto:${p.supportEmail}`} style={{ color: ACCENT_TEXT }}>
                {p.supportEmail}
              </Link>
              .
              <br />
              {p.eventName} is organised by {p.organiser}. Passes are non-transferable and
              non-refundable.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={{
        margin: "0 0 2px",
        color: MUTED,
        fontSize: 10,
        letterSpacing: 2,
        textTransform: "uppercase",
      }}
    >
      {children}
    </Text>
  );
}

function Value({ children, small }: { children: React.ReactNode; small?: boolean }) {
  return (
    <Text
      style={{
        margin: "0 0 12px",
        color: CREAM,
        fontSize: small ? 13 : 16,
        fontWeight: small ? 400 : 700,
        lineHeight: 1.45,
      }}
    >
      {children}
    </Text>
  );
}

/** Preview props for `npm run email:dev`. */
PassEmail.PreviewProps = {
  attendeeName: "Ananya Reddy",
  bookingId: "GV-7K3M9Q",
  tierName: "Couple Pass",
  quantity: 1,
  attendees: 2,
  amountLabel: "₹500",
  eventName: "GarbaVerse",
  eventSubtitle: "Garba & Dandiya Nights",
  organiser: "Student Surge",
  dateLabel: "Saturday, 17 October 2026",
  timeLabel: "6:00 PM – 11:00 PM",
  venueName: "Gymkhana Cricket Ground",
  venueAddress: "Secunderabad, Hyderabad",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Gymkhana+Cricket+Ground+Secunderabad",
  qrImageUrl: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=GV-7K3M9Q",
  passUrl: "/preview?v=pass",
  pdfUrl: "/preview?v=pass",
  icsUrl: "/preview?v=pass",
  googleCalUrl: "https://calendar.google.com",
  supportEmail: "studentsurge@gmail.com",
  gatesLabel: "5:30 PM",
  startLabel: "6:00 PM",
  ageNote: "All ages welcome. Under-12s enter free with a paying adult.",
} satisfies PassEmailProps;
