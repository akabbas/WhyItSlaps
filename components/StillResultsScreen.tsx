"use client";

import React from "react";

import { ColorPalette } from "./ColorPalette";
import { MeterFill, ThisPieceQualifier } from "./ScoreBars";
import { WhyItWorks } from "./WhyItWorks";
import { ResultsWordmark } from "./ResultsWordmark";
import type { StillAnalyzeSuccess, StillScoreKey } from "@/types/still-analysis";

const SCORE_LABELS: Record<StillScoreKey, string> = {
  composition: "COMPOSITION",
  light: "LIGHT",
  color_harmony: "COLOR",
  subject: "SUBJECT",
  overall_vibe: "OVERALL VIBE",
};

const SCORE_ORDER: StillScoreKey[] = ["composition", "light", "color_harmony", "subject", "overall_vibe"];

const MEDIUM_LABEL: Record<StillAnalyzeSuccess["claude"]["medium"], string> = {
  photo: "PHOTOGRAPH",
  painting: "PAINTING",
  print: "PRINT",
  other: "PICTURE",
};

type Props = {
  data: StillAnalyzeSuccess;
  previewUrl?: string | null;
  onReset: () => void;
};

export function StillResultsScreen({ data, previewUrl, onReset }: Props) {
  const c = data.claude;
  const howToLabel = c.medium === "photo" ? "HOW TO SHOOT LIKE THIS" : "HOW TO MAKE ONE LIKE THIS";

  return (
    <div className="relative mx-auto min-h-screen w-full max-w-6xl px-4 pb-24 pt-8 md:px-8">
      <nav className="flex flex-wrap items-start justify-between gap-4 border-b border-white/12 pb-5">
        <ResultsWordmark onHome={onReset} />
        <button
          type="button"
          className="bg-transparent font-mono text-[11px] uppercase tracking-[0.24em] text-white/88 hover:text-paper"
          onClick={onReset}
        >
          ← new image
        </button>
      </nav>

      <header className="mt-10 grid gap-8 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:items-start">
        {previewUrl ? (
          // The picture is the thing under discussion. The critique text is the name.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt={`${MEDIUM_LABEL[c.medium].toLowerCase()} preview`}
            className="max-h-[28rem] w-full border border-white/15 object-contain"
          />
        ) : (
          <div className="min-h-40 border border-white/15" />
        )}
        <div className="space-y-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/50">{MEDIUM_LABEL[c.medium]}</p>
          <blockquote className="font-serif text-[clamp(22px,2.65vw,28px)] leading-snug tracking-wide text-white">{c.vibe_summary}</blockquote>
          <div className="flex flex-wrap gap-2">
            {c.aesthetic_tags.map((tag) => (
              <span key={tag} className="border border-white bg-transparent px-2 py-[5px] font-mono text-[10px] uppercase tracking-[0.18em] text-white">
                #{tag.replace(/^#/, "")}
              </span>
            ))}
          </div>
          <p className="border border-white/42 bg-black/55 px-3 py-[6px] font-mono text-[11px] tracking-[0.17em] text-white/93">{c.target_viewer}</p>
        </div>
      </header>

      <section className="mt-14 space-y-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/50">this image&apos;s meters</p>
        <div className="space-y-4">
          {SCORE_ORDER.map((key, index) => (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between gap-3 font-mono text-[11px] uppercase tracking-[0.16em] text-white/66">
                <span>
                  {SCORE_LABELS[key]}
                  {key === "overall_vibe" ? <ThisPieceQualifier /> : null}
                </span>
                <span className="text-white/92">{c.scores[key]}</span>
              </div>
              <MeterFill value={c.scores[key]} delayMs={index * 70} />
            </div>
          ))}
        </div>
      </section>

      {data.palette.length > 0 ? (
        <section className="mt-16 space-y-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/50">color population</p>
          <ColorPalette palette={data.palette} />
        </section>
      ) : null}

      <section className="mt-16 grid gap-6 min-[480px]:grid-cols-3">
        {(
          [
            ["framing", c.framing],
            ["light", c.light],
            ["color", c.color],
          ] as const
        ).map(([label, text]) => (
          <div key={label} className="space-y-3 border border-white/12 bg-black/30 p-5">
            <h3 className="font-mono text-[11px] uppercase tracking-[0.32em] text-paper">{label}</h3>
            <p className="font-mono text-[12px] leading-relaxed text-white/80">{text}</p>
          </div>
        ))}
      </section>

      <div className="mt-14">
        <WhyItWorks items={c.why_it_works} />
      </div>

      <section className="mt-14 space-y-5 border border-white/10 bg-black/20 p-6">
        <h3 className="font-mono text-[11px] uppercase tracking-[0.32em] text-paper">{howToLabel}</h3>
        <ol className="space-y-4">
          {c.how_to_make.map((step, index) => (
            <li key={`${step.summary}-${index}`} className="border-l-2 border-paper pl-4 font-mono text-[12px] leading-relaxed text-white/80">
              <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.24em] text-white/54">{String(index + 1).padStart(2, "0")}</span>
              {step.summary}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
