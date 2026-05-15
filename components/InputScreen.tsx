"use client";

import React from "react";

export type AppMode = "video" | "music";
export type PlatformGlyph = "YT" | "IG" | "TT" | "X" | "SP";

function inferPlatform(raw: string, mode: AppMode): PlatformGlyph | null {
  try {
    const host = new URL(raw).hostname.replace(/^www\./, "");
    if (mode === "music") {
      if (host.includes("spotify.com")) return "SP";
      return null;
    }
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
  retryAnalysisHint?: boolean;
  mode?: AppMode;
  onChange: (value: string) => void;
  onAnalyze: () => void;
  onDownload: () => void;
  onModeChange?: (mode: AppMode) => void;
  onRetryAnalysis?: () => void;
};

export function InputScreen({
  value,
  disabled,
  error,
  retryAnalysisHint,
  mode = "video",
  onChange,
  onAnalyze,
  onDownload,
  onModeChange,
  onRetryAnalysis,
}: Props) {
  const plat = inferPlatform(value.trim(), mode);
  const looksLikeUrl = /^https?:\/\/.+/i.test(value.trim());
  const isMusic = mode === "music";

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col items-center justify-center gap-10 px-4 py-10 text-center md:gap-14">
      <div className="space-y-3">
        <h1 className="font-serif text-[clamp(1.65rem,5.5vw,3rem)] uppercase tracking-[0.38em] text-paper md:tracking-[0.48em]">WHYITSLAPS</h1>
        <p className="mx-auto max-w-md font-mono text-[11px] uppercase leading-relaxed tracking-[0.28em] text-white/62">
          {isMusic
            ? "sonic critique · paste a spotify track link · find out why it slaps"
            : "short-form critique · serif taste · monospace rigor paste a reel / short / tiktok / x clip under a minute grab your palette + edit read"}
        </p>
        {onModeChange && (
          <div className="flex justify-center pt-1">
            <div className="flex border border-white/18">
              <button
                type="button"
                disabled={disabled}
                onClick={() => onModeChange("video")}
                className={`px-5 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] transition-colors disabled:opacity-40 ${
                  !isMusic ? "bg-paper text-black" : "bg-transparent text-white/45 hover:text-white/70"
                }`}
              >
                VIDEO
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onModeChange("music")}
                className={`px-5 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] transition-colors disabled:opacity-40 ${
                  isMusic ? "bg-paper text-black" : "bg-transparent text-white/45 hover:text-white/70"
                }`}
              >
                MUSIC
              </button>
            </div>
          </div>
        )}
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
            placeholder={isMusic ? "https://open.spotify.com/track/…" : "https://youtube.com/watch?v=paste-here…"}
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
            {!isMusic && (
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
            )}
          </div>
        </div>

        <p className="mt-3 text-left font-mono text-[10px] uppercase tracking-[0.2em] text-white/52">
          {isMusic
            ? "supports spotify track links · paste open.spotify.com/track/… URLs"
            : "supports youtube · instagram · tiktok · x · max 60s · 720p cap · download saves the server grab (Instagram may need Safari/Chrome cookies)"}
        </p>
        {(error ?? “”).trim() ? (
          <div className=”mt-8 border-l-2 border-paper/60 pl-4”>
            <p className=”font-mono text-[12px] leading-relaxed tracking-wide text-white/90”>{error}</p>
          </div>
        ) : null}

        {retryAnalysisHint && typeof onRetryAnalysis === "function" ? (
          <button
            type="button"
            className="mt-4 bg-transparent px-2 py-1 font-mono text-[11px] uppercase tracking-[0.25em] text-white underline underline-offset-4 hover:text-paper disabled:opacity-40"
            onClick={() => onRetryAnalysis()}
            disabled={disabled}
          >
            Retry analysis
          </button>
        ) : null}
      </form>
    </div>
  );
}
