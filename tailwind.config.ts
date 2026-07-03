import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        void: "#05060f",
        panel: "#0b0d1d",
        neon: {
          cyan: "#22d3ee",
          violet: "#a78bfa",
          fuchsia: "#e879f9",
          lime: "#a3e635",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "system-ui", "sans-serif"],
        body: ["'Inter'", "system-ui", "sans-serif"],
      },
      animation: {
        "pulse-glow": "pulseGlow 2.5s ease-in-out infinite",
        "float-slow": "floatSlow 7s ease-in-out infinite",
        shimmer: "shimmer 2.4s linear infinite",
        "grid-move": "gridMove 18s linear infinite",
        "spin-slow": "spin 9s linear infinite",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 18px 0 rgba(34,211,238,.35)" },
          "50%": { boxShadow: "0 0 42px 6px rgba(167,139,250,.45)" },
        },
        floatSlow: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-14px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        gridMove: {
          "0%": { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "0 48px" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
