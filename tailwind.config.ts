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
        "bar-fill": "barFill 1.4s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "stagger": "staggerIn 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards",
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
      },
    },
  },
  plugins: [],
} satisfies Config;
