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

/** Score track. Width is the real value; the fill eases in only when motion is allowed. */
export function MeterFill({ value, delayMs = 0 }: { value: number; delayMs?: number }) {
  const clamped = Math.min(100, Math.max(0, Math.round(value)));
  return (
    <div className="h-2 w-full border border-white/11 bg-white/5">
      <div
        className="h-full bg-paper opacity-95 motion-safe:animate-bar-fill"
        style={
          {
            width: `${clamped}%`,
            "--bar-target": `${clamped}%`,
            animationDelay: `${delayMs}ms`,
          } as CSSProperties
        }
      />
    </div>
  );
}

/** Qualifier so overall vibe reads as this piece, not a rank. `normal-case` keeps it off the axis-name uppercase. */
export function ThisPieceQualifier() {
  return <span className="normal-case tracking-[0.08em] text-white/45"> · this piece</span>;
}

export function ScoreBars({ scores }: Props) {
  return (
    <div className="space-y-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/50">this clip&apos;s meters</p>
      {ORDER.map((key, index) => {
        const value = scores[key];
        const label = LABELS[key];

        return (
          <div key={key} className="space-y-1">
            <div className="flex items-center justify-between gap-3 font-mono text-[11px] uppercase tracking-[0.16em] text-white/66">
              <span>
                {label}
                {key === "overall_vibe" ? <ThisPieceQualifier /> : null}
              </span>
              <span className="text-white/92">{value}</span>
            </div>
            <MeterFill value={value} delayMs={index * 70} />
          </div>
        );
      })}
    </div>
  );
}
