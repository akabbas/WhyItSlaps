"use client";

import React from "react";
import type { MusicAnalyzeSuccess, EnergyArcSegment, MusicScoreKey } from "@/types/music-analysis";
import { ShareCardPanel } from "./ShareCardPanel";
import { MusicShareCard } from "./share-cards/MusicShareCard";

type Props = {
  data: MusicAnalyzeSuccess;
  onReset: () => void;
};

const SCORE_LABELS: Record<MusicScoreKey, string> = {
  hook_strength: "HOOK STRENGTH",
  production_density: "PRODUCTION DENSITY",
  emotional_range: "EMOTIONAL RANGE",
  originality: "ORIGINALITY",
  mix_clarity: "MIX CLARITY",
  overall_vibe: "OVERALL VIBE",
};

const SCORE_ORDER: MusicScoreKey[] = [
  "hook_strength",
  "production_density",
  "emotional_range",
  "originality",
  "mix_clarity",
  "overall_vibe",
];

const ARC_HEIGHTS: Record<EnergyArcSegment["energy_level"], string[]> = {
  low: ["20%", "25%", "22%", "28%", "24%"],
  mid: ["42%", "50%", "46%", "54%", "48%"],
  high: ["68%", "75%", "72%", "78%", "70%"],
  peak: ["88%", "96%", "100%", "94%", "90%"],
};

function formatDuration(ms: number): string {
  const totalSec = Math.round(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function FeatureBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-3 font-mono text-[11px] uppercase tracking-[0.16em] text-white/66">
        <span>{label}</span>
        <span className="text-white/92">{Math.round(value * 100)}</span>
      </div>
      <div className="h-2 w-full border border-white/11 bg-white/5">
        <div
          className="h-full bg-paper opacity-95"
          style={{ width: `${Math.round(value * 100)}%` }}
        />
      </div>
    </div>
  );
}

export function MusicResultsScreen({ data, onReset }: Props) {
  const { track, features, claude: c } = data;
  const [copyLabel, setCopyLabel] = React.useState<string | null>(null);
  const [shareCardOpen, setShareCardOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"ableton" | "logic" | "fl">("ableton");

  const handleShare = () => {
    const lines = [
      `WHYITSLAPS — MUSIC`,
      `${track.title} by ${track.artist}`,
      ``,
      c.vibe_summary,
      ``,
      `Tags: ${c.aesthetic_tags.join(", ")}`,
      ``,
      `Scores:`,
      ...SCORE_ORDER.map((k) => `  ${SCORE_LABELS[k]}: ${c.scores[k]}/100`),
      ``,
      `WHY IT SLAPS:`,
      ...c.why_it_works.map((w, i) => `  ${i + 1}. ${w.title} — ${w.detail}`),
    ];
    const text = lines.join("\n");

    if (!navigator.clipboard?.writeText) {
      setCopyLabel("clipboard blocked");
      setTimeout(() => setCopyLabel(null), 2600);
      return;
    }
    void navigator.clipboard.writeText(text).then(
      () => { setCopyLabel("copied."); setTimeout(() => setCopyLabel(null), 2200); },
      () => { setCopyLabel("failed"); setTimeout(() => setCopyLabel(null), 2600); },
    );
  };

  return (
    <div className="relative mx-auto min-h-screen w-full max-w-6xl px-4 pb-24 pt-8 md:px-8">

      {/* Nav */}
      <nav className="flex flex-wrap items-start justify-between gap-4 border-b border-white/12 pb-5">
        <span className="font-serif text-lg tracking-[0.38em] text-paper md:tracking-[0.45em]">
          WHYITSLAPS
        </span>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <button
            type="button"
            onClick={() => setShareCardOpen(true)}
            className="bg-transparent font-mono text-[11px] uppercase tracking-[0.24em] text-white/88 underline-offset-4 hover:text-paper"
          >
            share card
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="bg-transparent font-mono text-[11px] uppercase tracking-[0.24em] text-white/88 underline-offset-4 hover:text-paper"
          >
            {copyLabel ?? "copy text"}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="bg-transparent font-mono text-[11px] uppercase tracking-[0.24em] text-white/88 underline-offset-4 hover:text-paper"
          >
            ← new track
          </button>
        </div>
      </nav>

      <div className="mt-8 space-y-10">

        {/* Track Hero */}
        <section className="grid grid-cols-[80px_1fr] gap-5 border border-white/12 bg-black/30 p-5 md:grid-cols-[96px_1fr_auto] md:items-center">
          {track.album_art_url ? (
            <img
              src={track.album_art_url}
              alt={track.album}
              className="h-20 w-20 object-cover md:h-24 md:w-24"
            />
          ) : (
            <div className="h-20 w-20 border border-white/12 bg-white/5 md:h-24 md:w-24" />
          )}

          <div className="min-w-0">
            <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-white/40">
              MUSIC MODE
            </p>
            <h1 className="mt-1 font-serif text-2xl leading-tight text-paper md:text-3xl">
              {track.title}
            </h1>
            <p className="mt-1 font-mono text-[12px] text-white/70">
              {track.artist}
              {track.album ? ` · ${track.album}` : ""}
              {track.release_year ? ` · ${track.release_year}` : ""}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="border border-white/12 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-white/60">
                {formatDuration(track.duration_ms)}
              </span>
              {features && (
                <>
                  <span className="border border-white/12 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-white/60">
                    {features.key}
                  </span>
                  <span className="border border-white/12 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-white/60">
                    {features.tempo_bpm} BPM
                  </span>
                </>
              )}
              {track.explicit && (
                <span className="border border-white/12 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-white/40">
                  EXPLICIT
                </span>
              )}
            </div>
          </div>

          {features && (
            <div className="col-span-2 flex items-end justify-between border-t border-white/8 pt-4 md:col-span-1 md:flex-col md:items-end md:border-0 md:pt-0">
              <div className="text-right">
                <div className="font-serif text-4xl leading-none text-paper">{features.tempo_bpm}</div>
                <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-white/40">BPM</div>
              </div>
              <div className="border border-white/12 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-white/60">
                {features.key}
              </div>
            </div>
          )}
        </section>

        {/* Vibe Summary */}
        <div className="border-l-2 border-paper pl-5">
          <p className="font-serif text-xl italic leading-relaxed text-paper md:text-2xl">
            &ldquo;{c.vibe_summary}&rdquo;
          </p>
        </div>

        {/* Aesthetic Tags */}
        <div className="flex flex-wrap gap-2">
          {c.aesthetic_tags.map((tag, i) => (
            <span
              key={`${tag}-${i}`}
              className={`border px-3 py-1 font-mono text-[9px] uppercase tracking-[0.16em] ${
                i < 3 ? "border-paper text-paper" : "border-white/18 text-white/60"
              }`}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Sonic Scores */}
        <section>
          <p className="mb-4 border-b border-white/12 pb-3 font-mono text-[9px] uppercase tracking-[0.24em] text-white/40">
            Sonic Scores
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {SCORE_ORDER.map((key) => (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between gap-3 font-mono text-[11px] uppercase tracking-[0.16em] text-white/66">
                  <span>{SCORE_LABELS[key]}</span>
                  <span className="text-white/92">{c.scores[key]}</span>
                </div>
                <div className="h-2 w-full border border-white/11 bg-white/5">
                  <div
                    className="h-full bg-paper opacity-95"
                    style={{ width: `${c.scores[key]}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Spotify Audio Features mini-bars */}
        {features && (
          <section className="border border-white/12 bg-black/20 p-5">
            <p className="mb-4 font-mono text-[9px] uppercase tracking-[0.24em] text-white/40">
              Audio Features
            </p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <FeatureBar label="Energy" value={features.energy} />
              <FeatureBar label="Danceability" value={features.danceability} />
              <FeatureBar label="Valence" value={features.valence} />
              <FeatureBar label="Acousticness" value={features.acousticness} />
            </div>
          </section>
        )}

        {/* Energy Arc */}
        {c.energy_arc.length > 0 && (
          <section className="border border-white/12 bg-black/20 p-5">
            <p className="mb-4 font-mono text-[9px] uppercase tracking-[0.24em] text-white/40">
              Energy Arc
            </p>
            <div className="flex items-end gap-1" style={{ height: "56px" }}>
              {c.energy_arc.map((seg, si) =>
                ARC_HEIGHTS[seg.energy_level].map((h, bi) => (
                  <div
                    key={`${si}-${bi}`}
                    className="flex-1 bg-paper"
                    style={{
                      height: h,
                      opacity:
                        seg.energy_level === "peak"
                          ? 0.85
                          : seg.energy_level === "high"
                            ? 0.6
                            : seg.energy_level === "mid"
                              ? 0.35
                              : 0.18,
                    }}
                  />
                )),
              )}
            </div>
            <div
              className="mt-2 grid"
              style={{ gridTemplateColumns: `repeat(${c.energy_arc.length}, 1fr)` }}
            >
              {c.energy_arc.map((seg, i) => (
                <div key={i} className="px-1">
                  <div className="font-mono text-[8px] font-semibold uppercase tracking-[0.1em] text-paper/80">
                    {seg.label}
                  </div>
                  <div className="mt-1 font-mono text-[8px] leading-snug text-white/40">
                    {seg.note}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Sonic Textures */}
        {c.sonic_textures.length > 0 && (
          <section>
            <p className="mb-4 border-b border-white/12 pb-3 font-mono text-[9px] uppercase tracking-[0.24em] text-white/40">
              Sonic Texture
            </p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {c.sonic_textures.map((t, i) => (
                <div key={i} className="border border-white/12 bg-black/20 p-4">
                  <p className="font-mono text-[11px] font-semibold tracking-[0.06em] text-paper">
                    {t.name}
                  </p>
                  <p className="mt-2 font-mono text-[10px] leading-relaxed tracking-[0.04em] text-white/50">
                    {t.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Arrangement + Mix */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="border border-white/12 bg-black/20 p-5">
            <p className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-paper">
              Arrangement
            </p>
            <div className="space-y-4">
              <div>
                <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-white/35">
                  Structure
                </p>
                <p className="mt-1 font-mono text-[11px] leading-relaxed text-white/70">
                  {c.arrangement.structure}
                </p>
              </div>
              <div>
                <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-white/35">
                  Density Strategy
                </p>
                <p className="mt-1 font-mono text-[11px] leading-relaxed text-white/70">
                  {c.arrangement.density_strategy}
                </p>
              </div>
              <div>
                <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-white/35">
                  Signature Moment
                </p>
                <p className="mt-1 font-mono text-[11px] leading-relaxed text-white/70">
                  {c.arrangement.signature_moment}
                </p>
              </div>
            </div>
          </div>

          <div className="border border-white/12 bg-black/20 p-5">
            <p className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-paper">
              Mix Profile
            </p>
            <div className="space-y-4">
              {(
                [
                  ["Low End", c.mix_profile.low_end],
                  ["Midrange", c.mix_profile.midrange],
                  ["High End", c.mix_profile.high_end],
                  ["Width", c.mix_profile.width],
                ] as const
              ).map(([label, val]) => (
                <div key={label}>
                  <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-white/35">
                    {label}
                  </p>
                  <p className="mt-1 font-mono text-[11px] leading-relaxed text-white/70">{val}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why It Slaps */}
        <section className="space-y-4 border-t border-white/10 pt-8">
          <h3 className="font-mono text-[12px] uppercase tracking-[0.32em] text-paper">
            WHY IT SLAPS
          </h3>
          <div className="grid gap-4">
            {c.why_it_works.map((piece, idx) => (
              <article
                key={`${piece.title}-${idx}`}
                className="border border-white/10 bg-white/[0.02] p-5"
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/54">
                  {String(idx + 1).padStart(2, "0")}
                </p>
                <h4 className="mt-2 font-serif text-xl tracking-wide text-white">{piece.title}</h4>
                <p className="mt-3 font-mono text-[12px] leading-relaxed tracking-wide text-white/75">
                  {piece.detail}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* How To Produce Like This */}
        {c.how_to_produce.length > 0 && (
          <section className="space-y-4 border-t border-white/10 pt-8">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <h3 className="font-mono text-[12px] uppercase tracking-[0.32em] text-paper">
                HOW TO PRODUCE LIKE THIS
              </h3>
              <div className="flex">
                {(["ableton", "logic", "fl"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`border px-4 py-1.5 font-mono text-[9px] uppercase tracking-[0.16em] transition-colors ${
                      activeTab === tab
                        ? "border-white/40 bg-white/[0.08] text-paper"
                        : "border-white/12 bg-transparent text-white/40 hover:text-white/70"
                    }`}
                  >
                    {tab === "ableton" ? "ABLETON" : tab === "logic" ? "LOGIC PRO" : "FL STUDIO"}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              {c.how_to_produce.map((step, idx) => (
                <div key={idx} className="border border-white/12 bg-black/30 p-5">
                  <div className="flex items-baseline gap-4">
                    <span className="font-serif text-3xl leading-none text-white/12">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-paper">
                      {step.title}
                    </span>
                  </div>
                  <p className="mt-3 pl-10 font-mono text-[11px] leading-relaxed tracking-[0.03em] text-white/65">
                    {step.body}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Spotify CTA */}
        <div className="flex items-center gap-4 border border-[rgba(29,185,84,0.25)] bg-[rgba(29,185,84,0.05)] px-5 py-4">
          <div className="h-2 w-2 rounded-full bg-[#1DB954]" />
          <div className="flex-1 min-w-0">
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/40">
              Open in Spotify
            </p>
            <p className="mt-0.5 truncate font-mono text-[12px] font-semibold text-paper">
              {track.title} — {track.artist}
            </p>
          </div>
          <a
            href={track.spotify_url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 border border-[#1DB954] px-4 py-2 font-mono text-[9px] uppercase tracking-[0.16em] text-[#1DB954] hover:bg-[rgba(29,185,84,0.1)] transition-colors"
          >
            Open Track →
          </a>
        </div>

        {/* Target Listener */}
        <div className="border-l-2 border-white/12 pl-4">
          <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.2em] text-white/35">
            Target Listener
          </p>
          <p className="font-mono text-[12px] leading-relaxed text-white/70">{c.target_listener}</p>
        </div>

      </div>

      <ShareCardPanel
        open={shareCardOpen}
        onClose={() => setShareCardOpen(false)}
        filenameBase={`${track.artist}-${track.title}`}
        shareTitle={`WhyItSlaps — ${track.title}`}
        shareText={c.vibe_summary}
      >
        {(format) => <MusicShareCard data={data} format={format} />}
      </ShareCardPanel>
    </div>
  );
}
