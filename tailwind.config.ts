import type { Config } from "tailwindcss";

export default {
  content: ["./pages/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}", "./app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ["var(--font-dm-serif)", "serif"],
        mono: ["var(--font-ibm-plex)", "monospace"],
      },
      colors: {
        paper: "#F5F0E8",
      },
      animation: {
        "fade-spin": "fadeSpin 8s linear infinite",
        "bar-fill": "barFill 0.95s cubic-bezier(0.22, 1, 0.36, 1) both",
        stagger: "staggerIn 0.55s cubic-bezier(0.22, 1, 0.36, 1) both",
        "square-orbit": "squareOrbit 11s linear infinite",
        "eclipse-breathe": "eclipseBreathe 4.8s ease-in-out infinite",
      },
      keyframes: {
        fadeSpin: {
          "0%, 100%": { opacity: "0.4", transform: "rotate(0deg) scale(0.92)" },
          "50%": { opacity: "1", transform: "rotate(180deg) scale(1.05)" },
        },
        barFill: {
          "0%": { width: "0%" },
          "100%": { width: "var(--bar-target, 0%)" },
        },
        staggerIn: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        squareOrbit: {
          to: { offsetDistance: "100%" },
        },
        eclipseBreathe: {
          "0%, 100%": { opacity: "0.14", transform: "scale(0.88)" },
          "50%": { opacity: "0.4", transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
