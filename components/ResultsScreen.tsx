"use client";

import React from "react";
import type { AnalyzeSuccess } from "@/types/analysis";
import { ScoreBars } from "./ScoreBars";
import { ColorPalette } from "./ColorPalette";
import { MusicCard } from "./MusicCard";
import { WhyItWorks } from "./WhyItWorks";
import { ViewModeToggle } from "./ViewModeToggle";
import { formatShareSummary } from "@/lib/share";
import { videoBriefHeadline, videoSectionSummaries } from "@/lib/brief";
import { EditMyFootagePanel } from "./EditMyFootagePanel";

type Props = {
  data: AnalyzeSuccess;
  downloadError?: string | null;
  videoSourceUrl?: string | null;
  downloadBusy?: boolean;
  onDownloadVideo?: () => void;
  onReset: () => void;
};

function BriefSectionCard({ label, text }: { label: string; text: string }) {
  return (
    <div className="border border-white/12 bg-black/30 p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/45">{label}</p>
      <p className="mt-2 font-mono text-[12px] leading-relaxed text-white/82">{text}</p>
    </div>
  );
}

export function ResultsScreen({ data, downloadError, videoSourceUrl, downloadBusy, onDownloadVideo, onReset }: Props) {
  const { claude: c } = data;
  const [copyLabel, setCopyLabel] = React.useState<string | null>(null);
  const [viewMode, setViewMode] = React.useState<"brief" | "full">("brief");
  const isBrief = viewMode === "brief";
  const headline = videoBriefHeadline(c);
  const sections = videoSectionSummaries(c);

  const handleShare = () => {
    const text = formatShareSummary(data);
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      setCopyLabel("clipboard blocked");
      window.setTimeout(() => setCopyLabel(null), 2600);
      return;
    }

    void navigator.clipboard.writeText(text).then(
      () => {
        setCopyLabel("copied.");
        window.setTimeout(() => setCopyLabel(null), 2200);
      },
      () => {
        setCopyLabel("clipboard failed");
        window.setTimeout(() => setCopyLabel(null), 2600);
      },
    );
  };

  return (
    <div className="relative mx-auto min-h-screen w-full max-w-6xl px-4 pb-24 pt-8 md:px-8">
      <nav className="flex flex-wrap items-start justify-between gap-4 border-b border-white/12 pb-5">
        <span className="font-serif text-lg tracking-[0.38em] text-paper md:tracking-[0.45em]">WHYITSLAPS</span>
        <div className="flex flex-wrap items-center justify-end gap-x-6 gap-y-3">
          {videoSourceUrl?.trim() && typeof onDownloadVideo === "function" ? (
            <button
              type="button"
              className="bg-transparent font-mono text-[11px] uppercase tracking-[0.24em] text-white/88 underline-offset-4 hover:text-paper disabled:opacity-35"
              onClick={() => onDownloadVideo()}
              disabled={!!downloadBusy}
            >
              download source mp4
            </button>
          ) : null}
          <button
            type="button"
            className="bg-transparent font-mono text-[11px] uppercase tracking-[0.24em] text-white/88 hover:text-paper"
            onClick={onReset}
          >
            ← new video
          </button>
        </div>
      </nav>

      {(downloadError ?? "").trim() ? (
        <p className="mt-5 font-mono text-[12px] leading-relaxed tracking-wide text-white/88">{downloadError}</p>
      ) : null}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/40">video breakdown</p>
        <ViewModeToggle mode={viewMode} onChange={setViewMode} />
      </div>

      <header className="mt-8 space-y-6">
        <blockquote className="max-w-3xl font-serif text-[clamp(22px,2.65vw,28px)] leading-snug tracking-wide text-white">
          {isBrief ? headline : c.vibe_summary}
        </blockquote>

        {!isBrief && headline !== c.vibe_summary ? (
          <p className="max-w-2xl font-mono text-[11px] leading-relaxed tracking-wide text-white/45">
            TL;DR — {headline}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {c.aesthetic_tags.slice(0, isBrief ? 6 : undefined).map((tag) => (
            <span key={tag} className="border border-white bg-transparent px-2 py-[5px] font-mono text-[10px] uppercase tracking-[0.18em] text-white">
              #{tag.replace(/^#/, "")}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <span className="border border-white/42 bg-black/55 px-3 py-[6px] font-mono text-[11px] tracking-[0.17em] text-white/93">
            {c.target_audience}
          </span>
        </div>
      </header>

      <section className="mt-14 grid gap-10 md:grid-cols-[1.08fr_minmax(0,0.9fr)] md:gap-14">
        <div className="space-y-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/50">motion read</p>
          <ScoreBars scores={c.scores} />
        </div>

        <div className="space-y-4">
          <MusicCard music={data.music} />
          <div className="grid grid-cols-2 gap-4 font-mono text-[11px] text-white/60">
            <p>
             keyframes <span className="text-white/90">{data.keyframe_count}</span>
            </p>
            <p>
              duration <span className="text-white/90">{data.video_duration_seconds}s</span>
            </p>
          </div>
        </div>
      </section>

      {isBrief ? (
        <section className="mt-14 grid gap-4 md:grid-cols-3">
          <BriefSectionCard label="cinematography" text={sections.cinematography} />
          <BriefSectionCard label="color grade" text={sections.color_grade} />
          <BriefSectionCard label="edit style" text={sections.edit_style} />
        </section>
      ) : (
        <>
          <section className="mt-16 space-y-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/50">color population</p>
            <ColorPalette palette={data.palette} />
          </section>

          <section className="mt-16 grid gap-6 md:grid-cols-2">
            <div className="space-y-3 border border-white/12 bg-black/30 p-5">
              <h3 className="font-mono text-[11px] uppercase tracking-[0.32em] text-paper">cinematography</h3>
              <div className="space-y-3 font-mono text-[12px] leading-relaxed text-white/80">
                <p>{c.cinematography.framing_composition}</p>
                <p>{c.cinematography.lens_and_motion}</p>
                <p>{c.cinematography.depth_focus_light}</p>
              </div>
            </div>

            <div className="space-y-3 border border-white/12 bg-black/28 p-5">
              <h3 className="font-mono text-[11px] uppercase tracking-[0.32em] text-paper">color_grade</h3>
              <div className="space-y-3 font-mono text-[12px] leading-relaxed text-white/80">
                <p>{c.color_grade.palette_mood}</p>
                <p>{c.color_grade.contrast_curve}</p>
                <p>{c.color_grade.skin_environment}</p>
              </div>
            </div>
          </section>

          <section className="mt-16 border border-white/12 bg-black/25 p-6">
            <h3 className="font-mono text-[11px] uppercase tracking-[0.26em] text-paper">edit style deck</h3>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="border border-white/17 bg-black/55 p-4 text-center md:text-left">
                <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/54">pace</p>
                <span className="mt-4 inline-flex border border-paper px-2 py-[6px] font-mono text-[11px] uppercase tracking-[0.18em] text-paper">
                  {c.edit_style.pacing_badge}
                </span>
              </div>
              <div className="border border-white/17 bg-black/55 p-4">
                <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/54">cuts</p>
                <p className="mt-4 font-mono text-[11px] leading-relaxed tracking-wide text-white/85">{c.edit_style.cut_pattern}</p>
              </div>
              <div className="border border-white/17 bg-black/55 p-4">
                <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/54">transitions</p>
                <p className="mt-4 font-mono text-[11px] leading-relaxed tracking-wide text-white/85">{c.edit_style.transitions}</p>
              </div>
            </div>
          </section>
        </>
      )}

      <div className="mt-14">
        <WhyItWorks items={c.why_it_works} compact={isBrief} />
      </div>

      {isBrief ? (
        <section className="mt-14 space-y-4 border border-white/10 bg-black/20 p-6">
          <h3 className="font-mono text-[11px] uppercase tracking-[0.32em] text-paper">edit cheat sheet</h3>
          <ol className="space-y-3">
            {c.how_to_edit_like_this.map((step, index) => (
              <li
                key={`${step.summary}-${index}`}
                className="border-l-2 border-paper pl-4 font-mono text-[12px] leading-relaxed text-white/80"
              >
                {step.summary}
              </li>
            ))}
          </ol>
        </section>
      ) : (
        <section className="mt-14 space-y-5 border border-white/10 bg-black/20 p-6">
          <h3 className="font-mono text-[11px] uppercase tracking-[0.32em] text-paper">HOW TO EDIT LIKE THIS</h3>
          <ol className="space-y-4">
            {c.how_to_edit_like_this.map((step, index) => (
              <li
                key={`${step.summary}-${index}`}
                className="border-l-2 border-paper pl-4 font-mono text-[12px] leading-relaxed text-white/80"
              >
                <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.24em] text-white/54">{String(index + 1).padStart(2, "0")}</span>
                {step.summary}
              </li>
            ))}
          </ol>
        </section>
      )}

      {!isBrief ? <EditMyFootagePanel analysis={data} /> : null}

      <div className="mt-14 flex flex-col items-end gap-3">
        <button
          type="button"
          className="border border-white/40 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.28em] text-white hover:border-paper hover:text-paper"
          onClick={handleShare}
        >
          SHARE
        </button>
        <p className="min-h-[1rem] font-mono text-[11px] tracking-wide text-white/86">{copyLabel}</p>
      </div>
    </div>
  );
}
