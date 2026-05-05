"use client";

import type { MusicMatch } from "@/types/analysis";

type Props = {
  music: MusicMatch | null;
};

export function MusicCard({ music }: Props) {
  if (!music) {
    return (
      <div className="border border-white/12 bg-black/25 p-6 font-mono text-[12px] leading-relaxed tracking-wide text-white/75">
        <p className="text-[10px] uppercase tracking-[0.3em] text-white/45">audio fingerprint</p>
        <p className="mt-3 text-[13px] text-white/92">
          No confident match for the opening 10-second sample — louder bed, clearer mix, or ACR credits may improve hits.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-white/12 bg-black/30 p-6">
      <div className="flex items-baseline justify-between gap-6">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/52">Music</p>
          <h4 className="mt-2 font-serif text-2xl text-paper">{music.title ?? "Untitled cut"}</h4>
          <p className="mt-1 font-mono text-[12px] text-white/74">{music.artist ?? "Unknown artist"}</p>
          {music.album ? <p className="mt-1 font-mono text-[11px] text-white/55">{music.album}</p> : null}
        </div>
        <div className="text-right font-mono text-[11px] uppercase tracking-[0.2em] text-white/70">
          {music.bpm ? `~${music.bpm} BPM` : "BPM n/a"}
          {music.confidence != null ? (
            <p className="mt-2 normal-case tracking-normal text-white/55">{Math.round(music.confidence)}% match</p>
          ) : null}
        </div>
      </div>
      {music.spotify_id ? (
        <p className="mt-3 font-mono text-[10px] tracking-[0.12em] text-white/45">
          Spotify track id <span className="text-white/65">{music.spotify_id}</span>
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {music.genres.length === 0 ? (
          <span className="border border-dashed border-white/33 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white/55">genres unknown</span>
        ) : (
          music.genres.map((g, idx) => (
            <span key={`${g}-${idx}`} className="border border-white/18 bg-white/[0.06] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em]">
              {g}
            </span>
          ))
        )}
      </div>
    </div>
  );
}
