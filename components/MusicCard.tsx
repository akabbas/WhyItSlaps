"use client";

import React from "react";
import type { MusicMatch } from "@/types/analysis";

type Props = {
  music: MusicMatch | null;
};

export function MusicCard({ music }: Props) {
  const [albumArt, setAlbumArt] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!music?.spotify_id) return;
    const url = `https://open.spotify.com/oembed?url=https://open.spotify.com/track/${music.spotify_id}`;
    fetch(url)
      .then((r) => r.json())
      .then((d: { thumbnail_url?: string }) => {
        if (d.thumbnail_url) setAlbumArt(d.thumbnail_url);
      })
      .catch(() => {});
  }, [music?.spotify_id]);

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
      <div className="flex items-start gap-5">
        {albumArt ? (
          <img
            src={albumArt}
            alt={music.album ?? music.title ?? "album art"}
            className="h-20 w-20 shrink-0 object-cover"
          />
        ) : null}
        <div className="flex flex-1 items-baseline justify-between gap-6">
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
      </div>
      {music.spotify_id ? (
        <a
          href={`https://open.spotify.com/track/${music.spotify_id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block font-mono text-[10px] uppercase tracking-[0.2em] text-white/45 underline underline-offset-4 hover:text-white/75"
        >
          open on spotify ↗
        </a>
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
