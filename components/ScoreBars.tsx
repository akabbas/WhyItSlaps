"use client";

import type { CSSProperties } from "react";
import type { ClaudeAnalysisScores, ScoreKey } from "@/types/analysis";

const LABELS: Record<ScoreKey, string> = {
  color_harmony: "COLOR HARMONY",
  edit_pacing: "EDIT PACING",
  motion_feel: "MOTION FEEL",
  subject_framing: "SUBJECT FRAMING",
  overall_vibe: "OVERALL VIBE",
};

const ORDER: ScoreKey[] = ["color_harmony", "edit_pacing", "motion_feel", "subject_framing", "overall_vibe"];

type Props = {
  scores: ClaudeAnalysisScores;
};

export function ScoreBars({ scores }: Props) {
  return (
    <div className="space-y-4">
      {ORDER.map((key) => {
        const value = scores[key];
        const label = LABELS[key];

        return (
          <div key={key} className="space-y-1">
            <div className="flex items-center justify-between gap-3 font-mono text-[11px] uppercase tracking-[0.16em] text-white/66">
              <span>{label}</span>
              <span className="text-white/92">{value}</span>
            </div>
            <div className="h-2 w-full border border-white/11 bg-white/5">
              <div
                className="h-full animate-bar-fill bg-paper opacity-95"
                style={{ "--bar-target": `${value}%` } as CSSProperties}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
