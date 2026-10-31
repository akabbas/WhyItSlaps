"use client";

import React from "react";
import { loadingBarFloor, loadingStatus, nextLoadingBar, type LoadingPhase } from "@/lib/loading-stage";

type Props = { active: boolean; phase?: LoadingPhase; stage?: string | null };

export function LoadingScreen({ active, phase = "analyze", stage = null }: Props) {
  const status = loadingStatus(phase, stage);
  const [barPct, setBarPct] = React.useState(8);
  const stageRef = React.useRef(stage);
  stageRef.current = stage;

  React.useEffect(() => {
    if (!active) return undefined;
    setBarPct(8);
    const started = performance.now();
    const barTimer = window.setInterval(() => {
      const elapsed = performance.now() - started;
      setBarPct((prev) => nextLoadingBar(prev, elapsed, stageRef.current));
    }, 200);
    return () => window.clearInterval(barTimer);
  }, [active, phase]);

  React.useEffect(() => {
    if (!active) return;
    setBarPct((prev) => Math.max(prev, loadingBarFloor(stage)));
  }, [active, stage]);

  if (!active) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[#0A0A0A]"
      aria-busy="true"
      aria-live="polite"
      aria-label={status}
    >
      <div className="flex max-w-lg flex-col items-center gap-10 px-6 text-center">
        <div className="relative h-44 w-44" aria-hidden>
          <span className="absolute inset-0 border border-dashed border-paper/70 motion-safe:animate-[spin_21s_linear_infinite]" />
          <span className="absolute inset-[14%] border border-white/28 motion-safe:animate-[spin_34s_linear_infinite_reverse]" />
          <span className="absolute inset-[28%] border border-dashed border-white/18 motion-safe:animate-[spin_13s_linear_infinite]" />
          <span className="absolute inset-[42%] bg-paper/25 motion-safe:animate-eclipse-breathe" />
          <span
            className="absolute left-0 top-0 h-[5px] w-[5px] bg-paper motion-safe:animate-square-orbit"
            style={{ offsetPath: "path('M 22 22 H 154 V 154 H 22 Z')", offsetRotate: "0deg" }}
          />
        </div>
        <p
          key={status}
          className="min-h-[3.5rem] max-w-[18rem] font-mono text-[12px] uppercase leading-relaxed tracking-[0.28em] text-paper motion-safe:animate-[staggerIn_0.55s_cubic-bezier(0.22,1,0.36,1)_forwards]"
        >
          {status}
        </p>
        <div className="w-64 space-y-2">
          <div className="h-[2px] w-full bg-white/10">
            <div
              className="h-full bg-paper transition-[width] duration-700 ease-out"
              style={{ width: `${barPct}%` }}
            />
          </div>
          <p className="text-right font-mono text-[10px] uppercase tracking-[0.16em] text-white/50">working</p>
        </div>
      </div>
    </div>
  );
}
