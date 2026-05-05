"use client";

import React from "react";

export type PlatformGlyph = "YT" | "IG" | "TT" | "X";

function inferPlatform(raw: string): PlatformGlyph | null {
  try {
    const host = new URL(raw).hostname.replace(/^www\./, "");
    if (host.includes("youtube.com") || host === "youtu.be") return "YT";
    if (host.includes("instagram.com")) return "IG";
    if (host.includes("tiktok.com")) return "TT";
    if (host.includes("twitter.com") || host === "x.com") return "X";
    return null;
  } catch {
    return null;
  }
}

type Props = {
  value: string;
  disabled?: boolean;
  error?: string | null;
  retryClaudeHint?: boolean;
  onChange: (value: string) => void;
  onAnalyze: () => void;
  onDownload: () => void;
  onRetryClaude?: () => void;
};

export function InputScreen({
  value,
  disabled,
  error,
  retryClaudeHint,
  onChange,
  onAnalyze,
  onDownload,
  onRetryClaude,
}: Props) {
  const plat = inferPlatform(value.trim());
  const looksLikeUrl = /^https?:\/\/.+/i.test(value.trim());

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col items-center justify-center gap-10 px-4 py-10 text-center md:gap-14">
      <div className="space-y-3">
        <h1 className="font-serif text-4xl uppercase tracking-[0.65em] text-paper md:text-[3rem] md:tracking-[0.75em]">VIBECHECK</h1>
        <p className="mx-auto max-w-md font-mono text-[11px] uppercase leading-relaxed tracking-[0.28em] text-white/62">
          short-form critique · serif taste · monospace rigor paste a reel / short / tiktok / x clip under a minute grab your palette + edit read
        </p>
      </div>

      <form
        className="relative w-full"
        onSubmit={(e) => {
          e.preventDefault();
          onAnalyze();
        }}
      >
        <div className="relative flex w-full flex-col border border-white/35 md:flex-row md:items-stretch">
          <input
            className="h-14 min-h-14 flex-1 border-none bg-transparent px-4 py-3 font-mono text-[13px] text-white caret-paper outline-none placeholder:text-white/28 md:border-b-0 md:border-r md:border-white/35"
            value={value}
            disabled={disabled}
            spellCheck={false}
            placeholder="https://youtube.com/watch?v=paste-here…"
            onChange={(event) => onChange(event.target.value)}
          />

          <div className="flex h-14 shrink-0 items-center gap-3 border-white/35 px-4 font-mono text-[10px] tracking-[0.25em] text-white/54 md:border-b-0 md:border-r md:border-white/35 md:justify-center md:gap-3">
            {plat ? plat : "—"}
          </div>

          <div className="flex min-h-[3.75rem] flex-1 md:max-w-none">
            <button
              disabled={disabled || !looksLikeUrl}
              type="submit"
              className="h-14 min-h-14 flex-1 border-t border-white/35 bg-white px-3 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-black transition hover:bg-paper disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/50 md:min-w-[9.5rem] md:border-t-0 md:border-r md:border-black"
            >
              ANALYZE
            </button>
            <button
              disabled={disabled || !looksLikeUrl}
              type="button"
              className="h-14 min-h-14 flex-1 border-t border-white/35 bg-black px-3 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-paper transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:bg-black/55 disabled:text-white/45 md:border-t-0 md:border-r-0 md:min-w-[9.5rem]"
              onClick={() => {
                if (!looksLikeUrl || disabled) return;
                onDownload();
              }}
            >
              DOWNLOAD
            </button>
          </div>
        </div>

        <p className="mt-3 text-left font-mono text-[10px] uppercase tracking-[0.2em] text-white/52">
          supports youtube · instagram · tiktok · x · max 60s · 720p cap · download saves the server grab (Instagram may need Safari/Chrome
          cookies)
        </p>

        {(error ?? "").trim() ? (
          <p className="mt-4 text-left font-mono text-[12px] leading-relaxed tracking-wide text-white/88">{error}</p>
        ) : null}

        {retryClaudeHint && typeof onRetryClaude === "function" ? (
          <button
            type="button"
            className="mt-4 bg-transparent px-2 py-1 font-mono text-[11px] uppercase tracking-[0.25em] text-white underline underline-offset-4 hover:text-paper disabled:opacity-40"
            onClick={() => onRetryClaude()}
            disabled={disabled}
          >
            retry Claude call
          </button>
        ) : null}
      </form>
    </div>
  );
}
