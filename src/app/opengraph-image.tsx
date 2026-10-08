import { ImageResponse } from "next/og";
import { EVENT, EVENT_DATE_LABEL } from "@/lib/event";

export const runtime = "edge";
export const alt = `${EVENT.name} — ${EVENT.subtitle}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(ellipse at top, #3c0b18 0%, #11162a 55%, #0b0f1c 100%)",
          color: "#f2e8e1",
          fontFamily: "Georgia, serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 40,
            left: 60,
            right: 60,
            height: 4,
            background: "linear-gradient(90deg, transparent, #7b1024, transparent)",
          }}
        />
        <div style={{ fontSize: 22, letterSpacing: 10, color: "#d49aa5", textTransform: "uppercase" }}>
          {`${EVENT.organiser} presents`}
        </div>
        <div
          style={{
            fontSize: 150,
            fontWeight: 700,
            letterSpacing: 6,
            marginTop: 10,
            color: "#f2e8e1",
          }}
        >
          {EVENT.name}
        </div>
        <div style={{ fontSize: 44, fontStyle: "italic", marginTop: -10 }}>{EVENT.subtitle}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 36, marginTop: 40, fontSize: 28, color: "#a7a3ad" }}>
          <span>{EVENT_DATE_LABEL}</span>
          {/* Drawn, not typed: the bundled OG font has no ✦ or ₹ glyphs. */}
          <div style={{ width: 12, height: 12, background: "#bd7380", transform: "rotate(45deg)" }} />
          <span>{EVENT.venue.name}, Secunderabad</span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginTop: 40,
            padding: "14px 36px",
            borderRadius: 999,
            background: "#7b1024",
            color: "#f2e8e1",
            fontSize: 28,
            fontWeight: 700,
          }}
        >
          <span>Passes from</span>
          <Rupee />
          <span>299</span>
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 40,
            left: 60,
            right: 60,
            height: 4,
            background: "linear-gradient(90deg, transparent, #7b1024, transparent)",
          }}
        />
      </div>
    ),
    size
  );
}

/** ₹ as a vector (Lucide "indian-rupee" paths) so it renders without a font. */
function Rupee() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#f2e8e1"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      // The icon box has ~6px side bearing; pull "299" in so it reads as "₹299".
      style={{ marginLeft: 6, marginRight: -5 }}
    >
      <path d="M6 3h12" />
      <path d="M6 8h12" />
      <path d="m6 13 8.5 8" />
      <path d="M6 13h3" />
      <path d="M9 13c6.667 0 6.667-10 0-10" />
    </svg>
  );
}
