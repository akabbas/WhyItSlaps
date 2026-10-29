"use client";

import React from "react";

type Phase = "analyze" | "music" | "still" | "download" | "download-music" | "scan";

const PHASE_COPY: Record<Phase, { kicker: string; steps: readonly string[] }> = {
  analyze: {
    kicker: "video",
    steps: [
      "fetching the clip",
      "pulling stills from the cut",
      "reading color and motion",
      "writing the critique — still working",
    ],
  },
  music: {
    kicker: "music",
    steps: [
      "fetching the spotify track",
      "reading catalog stats for the full recording",
      "measuring the preview clip",
      "writing the critique — still working",
    ],
  },
  still: {
    kicker: "picture",
    steps: [
      "reading the picture",
      "pulling the palette",
      "looking at light and frame",
      "writing the critique — still working",
    ],
  },
  scan: {
    kicker: "scan",
    steps: [
      "sampling the upload",
      "fingerprinting the audio",
      "matching the catalog — still working",
    ],
  },
  download: {
    kicker: "save clip",
    steps: [
      "fetching the source clip",
      "packaging the file — still working",
    ],
  },
  "download-music": {
    kicker: "save preview",
    steps: [
      "fetching a ~30s preview clip",
      "packaging the mp3 — still working",
    ],
  },
};

type Props = { active: boolean; phase?: Phase };

export function LoadingScreen({ active, phase = "analyze" }: Props) {
  const copy = PHASE_COPY[phase] ?? PHASE_COPY.analyze;
  const [idx, setIdx] = React.useState(0);
  const [barPct, setBarPct] = React.useState(8);

  React.useEffect(() => {
    if (!active) return undefined;
    setIdx(0);
    setBarPct(8);
    const started = performance.now();
    const steps = (PHASE_COPY[phase] ?? PHASE_COPY.analyze).steps;
    const stepTimer = window.setInterval(() => {
      setIdx((n) => Math.min(n + 1, steps.length - 1));
    }, 2400);
    const barTimer = window.setInterval(() => {
      const elapsed = performance.now() - started;
      const next = Math.min(90, Math.round(8 + 82 * (1 - Math.exp(-elapsed / 14000))));
      setBarPct((prev) => Math.max(prev, next));
    }, 200);
    return () => {
      window.clearInterval(stepTimer);
      window.clearInterval(barTimer);
    };
  }, [active, phase]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-[#090909]/94 backdrop-blur-[2px]" aria-busy="true" aria-live="polite">
      <div className="flex max-w-lg flex-col items-center gap-9 px-6 text-center">
        <div className="relative h-36 w-36">
          <span className="absolute inset-[18%] border border-dashed border-paper/72 motion-safe:animate-[spin_13s_linear_infinite]" aria-hidden />
          <span className="absolute inset-[33%] border border-white/22 motion-safe:animate-[spin_19s_linear_infinite_reverse]" aria-hidden />
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/50">{copy.kicker}</p>
        <p
          key={idx}
          className="min-h-[3.5rem] font-mono text-[12px] uppercase tracking-[0.28em] text-white/91 motion-safe:animate-[staggerIn_0.55s_cubic-bezier(0.22,1,0.36,1)_forwards]"
        >
          {copy.steps[idx]}
        </p>
        <div className="w-64 space-y-2">
          <div className="h-[2px] w-full bg-white/10">
            <div
              className="h-full bg-paper transition-[width] duration-700 ease-out"
              style={{ width: `${barPct}%` }}
            />
          </div>
          <p className="text-right font-mono text-[10px] uppercase tracking-[0.16em] text-white/50">
            working
          </p>
        </div>
      </div>
    </div>
  );
}
