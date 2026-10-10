import type { Metadata, Viewport } from "next";
import { Cinzel, Manrope } from "next/font/google";
import "./globals.css";
import { EVENT, EVENT_DATE_LABEL } from "@/lib/event";
import { resolveSiteUrl } from "@/lib/env";

const display = Cinzel({
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  variable: "--font-display",
  display: "swap",
});

const sans = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

const siteUrl = resolveSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${EVENT.name} — ${EVENT.subtitle} · ${EVENT_DATE_LABEL}`,
    template: `%s · ${EVENT.name}`,
  },
  description: `Hyderabad's biggest Garba & Dandiya nights. ${EVENT_DATE_LABEL}, ${EVENT.venue.name}, Secunderabad. Passes from ₹299. Dance · Tradition · Togetherness.`,
  openGraph: {
    type: "website",
    siteName: EVENT.name,
    title: `${EVENT.name} — ${EVENT.subtitle}`,
    description: `${EVENT_DATE_LABEL} · ${EVENT.venue.name}, Secunderabad · Passes from ₹299`,
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#dcc8a0",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="min-h-dvh font-sans">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-cream-50"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
