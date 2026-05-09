import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DM_Serif_Display, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-dm-serif",
  display: "swap",
});

const ibmMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-ibm-plex",
  display: "swap",
});

export const metadata: Metadata = {
  title: "WhyItSlaps — microfilm aesthetic analyzer",
  description:
    "Frame-sample short videos from YouTube, Instagram, TikTok, or X. Extract palette, BPM hints, and a structured visual critique — short-form taste, monospace rigor.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${dmSerif.variable} ${ibmMono.variable} bg-[#0A0A0A] font-mono text-white antialiased`}
        style={{ backgroundColor: "#0A0A0A", color: "#ffffff" }}
      >
        <GrainDefs />
        <div className="grain-screen" aria-hidden />
        {/* isolate keeps grain blend from swallowing page content in some browsers */}
        <div className="relative isolate z-10 min-h-screen">{children}</div>
      </body>
    </html>
  );
}

/** Inline SVG turbulence filter wired from `.grain-screen { filter:url(#vcGrain)}` in globals.css */
function GrainDefs() {
  return (
    <svg className="absolute h-0 w-0" aria-hidden xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="vcGrain" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="4" stitchTiles="stitch" result="noise" />
          <feColorMatrix in="noise" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.28 0" result="mono" />
        </filter>
      </defs>
    </svg>
  );
}
