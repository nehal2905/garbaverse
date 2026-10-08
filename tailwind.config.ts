import type { Config } from "tailwindcss";

/**
 * GarbaVerse design tokens — "Noir Vineyard" palette.
 * Canonical colours: midnight #0b0f1c · oxblood #3c0b18 · claret #7b1024 · parchment #f2e8e1.
 * Matte by design: no metallic gradients, no glows, no neon.
 *
 *   ink     midnight blue-blacks (page + surfaces). 950 is the canonical #0b0f1c.
 *   brand   wine. 500 = claret #7b1024, the FILL colour (parchment text on it is
 *           9:1). 800 = oxblood #3c0b18 for depth. Claret itself is only 1.8:1
 *           on midnight, so TEXT accents use 300/400 — the same wine, lifted
 *           to a dusty rose (8.4:1 / 5.5:1).
 *   cream   parchment #f2e8e1, all body text.
 *   danger  form errors — muted terracotta, distinct from the wine accent.
 *   warn    pending / "selling fast" — muted ochre.
 *   ok      available / checked-in — sage.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0b0f1c",
          900: "#11162a",
          800: "#181e33",
          700: "#222940",
          600: "#2d354e",
        },
        brand: {
          100: "#f3e3e6",
          200: "#e2c0c7",
          300: "#d49aa5",
          400: "#bd7380",
          500: "#7b1024",
          600: "#5e0c1c",
          700: "#4a0b1b",
          800: "#3c0b18",
          900: "#24060e",
        },
        cream: "#f2e8e1",
        danger: "#d98c5f",
        warn: "#c9a45c",
        ok: "#8fae98",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        // Matte wine band (no highlight stop) for card and pass edges.
        "wine-band": "linear-gradient(90deg,#3c0b18 0%,#7b1024 50%,#3c0b18 100%)",
      },
      boxShadow: {
        soft: "0 10px 30px -12px rgba(0,0,0,0.7)",
        card: "0 20px 60px -20px rgba(0,0,0,0.8)",
        inset: "inset 0 1px 0 0 rgba(242,232,225,0.05)",
      },
      keyframes: {
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(24px)" },
          to: { opacity: "1", transform: "none" },
        },
      },
      animation: {
        float: "float 7s ease-in-out infinite",
        // CSS (not JS) so above-the-fold content appears before hydration.
        "fade-up": "fade-up 0.7s cubic-bezier(0.22,1,0.36,1) both",
      },
    },
  },
  plugins: [],
};

export default config;
