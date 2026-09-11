"use client";

import type { ReactNode } from "react";
import { DEMO_MUSIC_ANALYSIS, DEMO_VIDEO_ANALYSIS } from "@/lib/share-graphics-fixtures";
import { VideoShareCard } from "@/components/share-graphics/cards/VideoShareCard";
import { VideoOverlayCard } from "@/components/share-graphics/cards/VideoOverlayCard";
import { MusicShareCard } from "@/components/share-graphics/cards/MusicShareCard";
import { ShareGraphicsSection } from "@/components/share-graphics/ShareGraphicsSection";

const PREVIEW_SCALE = 0.28;

function PreviewFrame({
  label,
  children,
  checkerboard,
}: {
  label: string;
  children: ReactNode;
  checkerboard?: boolean;
}) {
  return (
    <div className="space-y-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/45">{label}</p>
      <div
        className="overflow-hidden border border-white/12"
        style={{
          height: 540,
          background: checkerboard
            ? "repeating-conic-gradient(#1a1a1a 0% 25%, #111 0% 50%) 50% / 20px 20px"
            : "#000",
        }}
      >
        <div style={{ transform: `scale(${PREVIEW_SCALE})`, transformOrigin: "top left", width: 1080, height: 1920 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default function ShareGraphicsDemoPage() {
  return (
    <div className="relative mx-auto min-h-screen w-full max-w-6xl px-4 pb-24 pt-8 md:px-8">
      <nav className="flex flex-wrap items-start justify-between gap-4 border-b border-white/12 pb-5">
        <span className="font-serif text-lg tracking-[0.38em] text-paper md:tracking-[0.45em]">WHYITSLAPS</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/40">Share graphics demo</span>
      </nav>

      <header className="mt-10 space-y-4">
        <h1 className="font-serif text-3xl text-paper">Social graphics preview</h1>
        <p className="max-w-2xl font-mono text-[12px] leading-relaxed tracking-wide text-white/55">
          Pixel-accurate renders from the app components. Use this page for screenshots and design review — not linked from the main tool yet.
        </p>
      </header>

      <section className="mt-14 grid gap-10 lg:grid-cols-2">
        <PreviewFrame label="Video story card · with palette strip">
          <VideoShareCard data={DEMO_VIDEO_ANALYSIS} format="story" />
        </PreviewFrame>

        <PreviewFrame label="Transparent overlay · Strava-style sticker" checkerboard>
          <VideoOverlayCard data={DEMO_VIDEO_ANALYSIS} />
        </PreviewFrame>

        <PreviewFrame label="Music story card">
          <MusicShareCard data={DEMO_MUSIC_ANALYSIS} format="story" />
        </PreviewFrame>

        <div className="space-y-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/45">Overlay in context (concept)</p>
          <div
            className="relative overflow-hidden border border-white/12"
            style={{
              height: 540,
              background:
                "linear-gradient(135deg, #1A2E4A 0%, #E85D3B 45%, #2C1810 100%)",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                transform: `scale(${PREVIEW_SCALE})`,
                transformOrigin: "top left",
                width: 1080,
                height: 1920,
              }}
            >
              <VideoOverlayCard data={DEMO_VIDEO_ANALYSIS} />
            </div>
          </div>
          <p className="font-mono text-[10px] leading-relaxed tracking-wide text-white/40">
            Simulated clip background — in Stories the user&apos;s actual video shows through.
          </p>
        </div>
      </section>

      <section className="mt-20">
        <p className="mb-6 font-mono text-[10px] uppercase tracking-[0.28em] text-white/40">Live section component</p>
        <ShareGraphicsSection
          mode="video"
          data={DEMO_VIDEO_ANALYSIS}
          filenameBase="demo-video"
          shareTitle="WhyItSlaps demo"
          shareText={DEMO_VIDEO_ANALYSIS.claude.vibe_summary}
        />
      </section>
    </div>
  );
}
