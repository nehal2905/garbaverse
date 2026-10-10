import "server-only";
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
  renderToBuffer,
} from "@react-pdf/renderer";
import { EVENT, EVENT_DATE_LABEL, EVENT_TIME_LABEL, GATES_OPEN_LABEL } from "./event";
// Built-in PDF fonts (Helvetica/Times/Courier) are WinAnsi-only: no ₹ glyph.
import { formatINRPlain } from "./utils";
import { qrDataUrl } from "./qr";
import type { Booking, TicketType } from "./types";

// react-pdf hyphenates by default ("Secun-derabad", and worse, email
// addresses). Wrap on whole words only.
Font.registerHyphenationCallback((word) => [word]);

// Brand: Ivory Invitation (mirrors tailwind.config.ts tokens).
const SURFACE = "#f4e6c6";
const PAGE = "#e6d2ae";
const ACCENT = "#8f2438";
const ACCENT_LIGHT = "#6e1c2c";
const LINE = "#521520";
const CREAM = "#2a2218";
const MUTED = "#726656";

const s = StyleSheet.create({
  page: { backgroundColor: PAGE, padding: 24, fontFamily: "Helvetica" },
  ticket: {
    flex: 1,
    backgroundColor: SURFACE,
    borderRadius: 18,
    overflow: "hidden",
    border: `1.5pt solid ${LINE}`,
  },
  header: {
    padding: 28,
    paddingBottom: 22,
    backgroundColor: PAGE,
    borderBottom: `1pt solid ${LINE}`,
  },
  kicker: {
    color: ACCENT_LIGHT,
    fontSize: 9,
    letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  title: {
    fontFamily: "Times-Bold",
    fontSize: 38,
    color: CREAM,
    letterSpacing: 1.5,
  },
  subtitle: { color: CREAM, fontSize: 13, marginTop: 4, fontFamily: "Times-Italic" },
  stripe: { height: 5, backgroundColor: ACCENT },
  body: { padding: 28, flexDirection: "row", gap: 24 },
  col: { flex: 1 },
  label: {
    color: MUTED,
    fontSize: 8,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  value: { color: CREAM, fontSize: 13, fontFamily: "Helvetica-Bold", marginBottom: 14 },
  valueSm: { color: CREAM, fontSize: 11, marginBottom: 14, lineHeight: 1.4 },
  qrWrap: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    width: 170,
    height: 170,
    alignSelf: "flex-start",
  },
  qr: { width: 150, height: 150 },
  perf: {
    marginHorizontal: 0,
    borderTop: `1.5pt dashed ${LINE}`,
    position: "relative",
  },
  notch: {
    position: "absolute",
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: PAGE,
    top: -13,
  },
  stub: {
    padding: 28,
    paddingTop: 22,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  bookingId: {
    fontFamily: "Courier-Bold",
    fontSize: 22,
    color: ACCENT_LIGHT,
    letterSpacing: 2,
  },
  pill: {
    backgroundColor: ACCENT,
    color: CREAM,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  footer: {
    marginTop: "auto",
    padding: 20,
    paddingHorizontal: 28,
    backgroundColor: ACCENT_LIGHT,
    borderTop: `1pt solid ${LINE}`,
  },
  footerText: { color: SURFACE, fontSize: 8.5, lineHeight: 1.5 },
  amount: { color: ACCENT_LIGHT, fontSize: 16, fontFamily: "Helvetica-Bold" },
});

export async function renderPassPdf(params: {
  booking: Booking;
  tier: TicketType;
  qrPayload: string;
}) {
  const { booking, tier, qrPayload } = params;
  const qr = await qrDataUrl(qrPayload, 600);

  const doc = (
    <Document
      title={`${EVENT.name} Pass — ${booking.id}`}
      author={EVENT.organiser}
      subject={`${EVENT.name} ${EVENT.subtitle}`}
    >
      <Page size={[460, 760]} style={s.page}>
        <View style={s.ticket}>
          <View style={s.header}>
            <Text style={s.kicker}>{EVENT.organiser} presents</Text>
            <Text style={s.title}>{EVENT.name}</Text>
            <Text style={s.subtitle}>{EVENT.subtitle}</Text>
          </View>
          <View style={s.stripe} />

          <View style={s.body}>
            <View style={s.col}>
              <Text style={s.label}>Attendee</Text>
              <Text style={s.value}>{booking.name}</Text>

              <Text style={s.label}>Pass</Text>
              <Text style={s.value}>
                {tier.name} × {booking.quantity}
                {booking.attendees > 1 ? `\nAdmits ${booking.attendees}` : ""}
              </Text>

              <Text style={s.label}>Date & time</Text>
              <Text style={s.valueSm}>
                {EVENT_DATE_LABEL}
                {"\n"}
                {EVENT_TIME_LABEL} IST
              </Text>

              <Text style={s.label}>Venue</Text>
              <Text style={s.valueSm}>
                {EVENT.venue.name}
                {"\n"}
                {EVENT.venue.address}
              </Text>
            </View>

            <View>
              <View style={s.qrWrap}>
                {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image has no alt prop */}
                <Image src={qr} style={s.qr} />
              </View>
              <Text style={[s.label, { marginTop: 10, textAlign: "center" }]}>Scan at gate</Text>
            </View>
          </View>

          <View style={s.perf}>
            <View style={[s.notch, { left: -13 }]} />
            <View style={[s.notch, { right: -13 }]} />
          </View>

          <View style={s.stub}>
            <View>
              <Text style={s.label}>Booking ID</Text>
              <Text style={s.bookingId}>{booking.id}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={s.label}>Amount paid</Text>
              <Text style={s.amount}>{formatINRPlain(booking.amount_paise)}</Text>
              <View style={{ marginTop: 8 }}>
                <Text style={s.pill}>Confirmed</Text>
              </View>
            </View>
          </View>

          <View style={s.footer}>
            <Text style={s.footerText}>
              Present this QR (on screen or printed) at the gate. One scan per pass — the QR is
              invalidated after check-in. Gates open {GATES_OPEN_LABEL}. Carry a valid ID. Non-transferable,
              non-refundable. Questions: {EVENT.contact.email}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );

  return renderToBuffer(doc);
}
