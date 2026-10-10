import type { Config } from "tailwindcss";

/**
 * GarbaVerse tokens — sampled from the collage invitation:
 * aged newspaper paper, bangle maroon, mustard sari, floral magenta.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: "#dcc8a0",
          50: "#efe0b8",
          100: "#dcc8a0",
          200: "#cbb48a",
          300: "#b49a6e",
        },
        ink: {
          950: "#1c1610",
          900: "#2a2218",
          800: "#3d3428",
          700: "#5a4e3e",
          600: "#726656",
          500: "#8c7e6c",
          400: "#a89884",
          300: "#c4b49c",
        },
        brand: {
          100: "#f3e2e6",
          200: "#e4c0c8",
          300: "#c45a70",
          400: "#a8324c",
          500: "#8f2438",
          600: "#6e1c2c",
          700: "#521520",
          800: "#3a0e16",
          900: "#24080e",
        },
        saffron: "#c9962a",
        danger: "#b4532a",
        warn: "#a67c2d",
        ok: "#3d7a52",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "wine-band": "linear-gradient(90deg,#6e1c2c 0%,#c9962a 50%,#6e1c2c 100%)",
      },
      boxShadow: {
        soft: "0 10px 28px -16px rgba(143, 36, 56, 0.4)",
        card: "0 22px 50px -20px rgba(42, 34, 24, 0.32)",
        inset: "inset 0 1px 0 0 rgba(255,246,220,0.65)",
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
        "fade-up": "fade-up 0.7s cubic-bezier(0.22,1,0.36,1) both",
      },
    },
  },
  plugins: [],
};

export default config;
