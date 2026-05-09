"use client";

import React from "react";

const MESSAGES_ANALYZE = [
  "downloading video",
  "extracting frames",
  "identifying music",
  "analyzing color grade",
  "reading the edit",
  "writing the breakdown",
] as const;

const MESSAGES_MUSIC = [
  "pulling track from spotify",
  "reading the audio features",
  "decoding why it slaps",
  "writing the breakdown",
] as const;

const MESSAGES_DOWNLOAD = [
  "fetching clip from original source",
  "muxing stream to mp4 on disk",
  "packaging file for browser save…",
] as const;

type Phase = "analyze" | "music" | "download";

type Props = { active: boolean; phase?: Phase };

export function LoadingScreen({ active, phase = "analyze" }: Props) {
  const [idx, setIdx] = React.useState(0);
  const messages = phase === "download" ? MESSAGES_DOWNLOAD : phase === "music" ? MESSAGES_MUSIC : MESSAGES_ANALYZE;

  React.useEffect(() => {
    if (!active) return undefined;
    setIdx(0);
    const msgs = phase === "download" ? MESSAGES_DOWNLOAD : phase === "music" ? MESSAGES_MUSIC : MESSAGES_ANALYZE;
    const id = window.setInterval(() => setIdx((n) => (n + 1) % msgs.length), 2000);
    return () => window.clearInterval(id);
  }, [active, phase]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-[#090909]/94 backdrop-blur-[2px]" aria-busy="true" aria-live="polite">
      <div className="flex max-w-lg flex-col items-center gap-9 px-6 text-center">
        <div className="relative h-36 w-36">
          <span className="absolute inset-[18%] rounded-full border border-dashed border-paper/72 motion-safe:animate-[spin_13s_linear_infinite]" aria-hidden />
          <span className="absolute inset-[33%] rounded-[30%] border border-white/22 motion-safe:animate-[spin_19s_linear_infinite_reverse]" aria-hidden />
        </div>
        <p
          key={idx}
          className="min-h-[3.5rem] font-mono text-[12px] uppercase tracking-[0.28em] text-white/91 motion-safe:animate-[staggerIn_0.55s_cubic-bezier(0.22,1,0.36,1)_forwards]"
        >
          {messages[idx]}
        </p>
      </div>
    </div>
  );
}
