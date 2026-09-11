"use client";

import Link from "next/link";
import React from "react";

import type { MusicMatch } from "@/types/analysis";
import type { IdentifyAudioErrorBody, IdentifyAudioSuccess } from "@/types/identify-audio";
import { MusicCard } from "@/components/MusicCard";

export default function DraftDetectPage() {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [match, setMatch] = React.useState<MusicMatch | null>(null);
  const [spotifyUrl, setSpotifyUrl] = React.useState<string | null>(null);

  const runScan = async (file: File) => {
    setBusy(true);
    setError(null);
    setMatch(null);
    setSpotifyUrl(null);
    try {
      const form = new FormData();
      form.append("clip", file, file.name);
      const res = await fetch("/api/identify-audio", { method: "POST", body: form });
      const payload = (await res.json()) as IdentifyAudioSuccess | IdentifyAudioErrorBody;
      if (!res.ok || !payload.ok) {
        const err = payload as IdentifyAudioErrorBody;
        setError(err.hint ? `${err.error} — ${err.hint}` : err.error);
        return;
      }
      setMatch(payload.match);
      setSpotifyUrl(payload.spotify_url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Scan failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10 md:px-8 md:py-14">
      <header className="space-y-3 border-b border-white/12 pb-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/40">prototype · music detect</p>
        <h1 className="font-serif text-[clamp(1.4rem,4vw,2.2rem)] uppercase tracking-[0.2em] text-paper">
          Scan before you know the track
        </h1>
        <p className="font-mono text-[11px] leading-relaxed text-white/55">
          Upload a short audio or video clip — we fingerprint the opening seconds with ACRCloud (same engine as video
          soundtrack ID). No full Spotify link required to start.
        </p>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
          Spec: docs/music-detect-scan.md
        </p>
      </header>

      <section className="mt-10 space-y-6">
        <input
          ref={inputRef}
          type="file"
          accept="audio/*,video/*,.mp3,.m4a,.wav,.mp4,.mov,.webm"
          className="hidden"
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) void runScan(file);
          }}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="flex h-14 w-full items-center justify-center border border-white/35 bg-paper font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-black transition hover:bg-white disabled:opacity-40"
        >
          {busy ? "scanning…" : "upload clip or audio"}
        </button>

        {error ? (
          <p className="border-l-2 border-paper/60 pl-4 font-mono text-[12px] leading-relaxed text-white/85">{error}</p>
        ) : null}

        {match ? (
          <div className="space-y-6 border border-white/12 bg-black/25 p-5">
            <MusicCard music={match} />
            {spotifyUrl ? (
              <Link
                href={`/?mode=music&url=${encodeURIComponent(spotifyUrl)}`}
                className="inline-flex h-12 w-full items-center justify-center border border-[#1DB954] font-mono text-[10px] uppercase tracking-[0.2em] text-[#1DB954] hover:bg-[rgba(29,185,84,0.08)]"
              >
                run full music breakdown →
              </Link>
            ) : (
              <p className="font-mono text-[11px] text-white/50">
                Match found but no Spotify id — paste a track URL on the home page to analyze.
              </p>
            )}
          </div>
        ) : null}
      </section>

      <footer className="mt-14 font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">
        <Link href="/draft" className="hover:text-paper">
          ← draft hub
        </Link>
      </footer>
    </main>
  );
}
