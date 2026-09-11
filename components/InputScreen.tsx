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
  onUploadFile?: (file: File) => void;
  /** Music mode: fingerprint upload via ACRCloud (Shazam-style). */
  onUploadMusicScan?: (file: File) => void;
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
  onUploadFile,
  onUploadMusicScan,
}: Props) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const musicScanInputRef = React.useRef<HTMLInputElement>(null);
  const plat = inferPlatform(value.trim(), mode);
  const looksLikeUrl = /^https?:\/\/.+/i.test(value.trim());
  const isMusic = mode === "music";
  const isInstagramUrl = plat === "IG";

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col items-center justify-center px-4 py-10">
      <div className="w-full overflow-hidden border border-white/35 bg-black/30 text-center shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset]">
        <div className="space-y-3 px-6 pb-6 pt-8 md:px-8">
          <h1 className="font-serif text-[clamp(1.65rem,5.5vw,3rem)] uppercase tracking-[0.38em] text-paper md:tracking-[0.48em]">
            WHYITSLAPS
          </h1>
          <p className="mx-auto max-w-md font-mono text-[11px] uppercase leading-relaxed tracking-[0.28em] text-white/62">
            {isMusic
              ? "paste a spotify link · or scan audio before you know the track"
              : "paste a tiktok · find out why it slaps"}
          </p>
        </div>

        {onModeChange ? (
          <div className="grid grid-cols-2 border-t border-white/20">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onModeChange("video")}
              className={`h-11 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] transition-colors disabled:opacity-40 ${
                !isMusic
                  ? "bg-paper text-black"
                  : "bg-transparent text-white/45 hover:bg-white/[0.04] hover:text-white/70"
              }`}
            >
              Video
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onModeChange("music")}
              className={`h-11 border-l border-white/20 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] transition-colors disabled:opacity-40 ${
                isMusic
                  ? "bg-paper text-black"
                  : "bg-transparent text-white/45 hover:bg-white/[0.04] hover:text-white/70"
              }`}
            >
              Music
            </button>
          </div>
        ) : null}

        <form
          className="border-t border-white/20 text-left"
          onSubmit={(e) => {
            e.preventDefault();
            onAnalyze();
          }}
        >
          <div className="flex w-full flex-col sm:flex-row sm:items-stretch">
            <div className="relative flex h-14 flex-1 items-center border-b border-white/20 sm:border-b-0 sm:border-r sm:border-white/20">
              <input
                className="h-full w-full min-w-0 border-none bg-transparent py-0 pl-4 pr-12 font-mono text-[13px] leading-none text-white caret-paper outline-none placeholder:text-white/28"
                value={value}
                disabled={disabled}
                spellCheck={false}
                placeholder={isMusic ? "https://open.spotify.com/track/…" : "https://youtube.com/watch?v=paste-here…"}
                onChange={(event) => onChange(event.target.value)}
              />
              <span
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-mono text-[10px] leading-none tracking-[0.25em] text-white/54"
                aria-hidden
              >
                {plat ?? "—"}
              </span>
            </div>

            <div className="flex h-14 w-full shrink-0 border-t border-white/20 sm:w-auto sm:border-t-0">
              <button
                disabled={disabled || !looksLikeUrl}
                type="submit"
                className={`flex h-full min-h-0 flex-1 items-center justify-center px-4 font-mono text-[11px] font-semibold uppercase leading-none tracking-[0.22em] transition sm:min-w-[9.5rem] sm:flex-none sm:border-r sm:border-white/20 ${
                  disabled || !looksLikeUrl
                    ? "cursor-not-allowed bg-white/10 text-white/45"
                    : "bg-paper text-black hover:bg-white"
                }`}
              >
                Analyze
              </button>
              <button
                disabled={disabled || !looksLikeUrl}
                type="button"
                className={`flex h-full min-h-0 flex-1 items-center justify-center px-4 font-mono text-[11px] font-semibold uppercase leading-none tracking-[0.22em] transition sm:min-w-[9.5rem] sm:flex-none ${
                  disabled || !looksLikeUrl
                    ? "cursor-not-allowed bg-black/50 text-white/40"
                    : "bg-[#141414] text-paper hover:bg-white/[0.08] hover:text-white"
                }`}
                onClick={() => {
                  if (!looksLikeUrl || disabled) return;
                  onDownload();
                }}
              >
                Download
              </button>
            </div>
          </div>

          <div className="space-y-5 border-t border-white/12 px-6 py-5 md:px-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">
              {isMusic
                ? "open.spotify.com/track/… · scan uses first ~15s of audio · download saves ~30s preview mp3"
                : "tiktok · youtube · x · upload for instagram · max 60s"}
            </p>

            {isMusic && typeof onUploadMusicScan === "function" ? (
              <div>
                <input
                  ref={musicScanInputRef}
                  type="file"
                  accept="audio/*,video/*,.mp3,.m4a,.wav,.mp4,.mov,.webm"
                  className="hidden"
                  disabled={disabled}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (file) onUploadMusicScan(file);
                  }}
                />
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => musicScanInputRef.current?.click()}
                  className="border border-white/25 bg-transparent px-4 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-paper transition hover:border-white/45 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Scan upload
                </button>
                <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/30">
                  mp3 · m4a · short mp4 · max 25 mb · same engine as video soundtrack id
                </p>
              </div>
            ) : null}

            {!isMusic && typeof onUploadFile === "function" ? (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*,.mp4,.mov,.webm,.m4v"
                  className="hidden"
                  disabled={disabled}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (file) onUploadFile(file);
                  }}
                />
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => fileInputRef.current?.click()}
                  className="border border-white/25 bg-transparent px-4 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-paper transition hover:border-white/45 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Upload clip
                </button>
                <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/30">
                  Instagram: save the reel, then upload the file
                </p>
              </div>
            ) : null}

            {isInstagramUrl ? (
              <p className="font-mono text-[11px] leading-relaxed tracking-wide text-white/55">
                Instagram links often fail here — save the reel and use Upload clip instead.
              </p>
            ) : null}

            {(error ?? "").trim() ? (
              <div className="border-l-2 border-paper/60 pl-4">
                <p className="font-mono text-[12px] leading-relaxed tracking-wide text-white/90">{error}</p>
              </div>
            ) : null}

            {retryAnalysisHint && typeof onRetryAnalysis === "function" ? (
              <button
                type="button"
                className="bg-transparent px-2 py-1 font-mono text-[11px] uppercase tracking-[0.25em] text-white underline underline-offset-4 hover:text-paper disabled:opacity-40"
                onClick={() => onRetryAnalysis()}
                disabled={disabled}
              >
                Retry analysis
              </button>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  );
}
