"use client";

import type { MusicAnalyzeSuccess } from "@/types/music-analysis";
import type { ShareCardFormat } from "@/lib/share-image";
import { SHARE_CARD_DIMENSIONS } from "@/lib/share-image";

type Props = {
  data: MusicAnalyzeSuccess;
  format: ShareCardFormat;
};

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

export function MusicShareCard({ data, format }: Props) {
  const { width, height } = SHARE_CARD_DIMENSIONS[format];
  const { track, features, claude: c } = data;
  const tags = c.aesthetic_tags.slice(0, 3);
  const statCells: { label: string; value: string | number }[] = [];
  if (features) {
    statCells.push({ label: "BPM", value: features.tempo_bpm });
    statCells.push({ label: "KEY", value: features.key });
  }
  if (c.scores) {
    statCells.push({ label: "HOOK", value: c.scores.hook_strength });
  }

  return (
    <div
      style={{
        width,
        height,
        background: "#0A0A0A",
        color: "#F5F0E8",
        fontFamily: "var(--font-ibm-plex), monospace",
        position: "relative",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          position: "relative",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: format === "story" ? "72px 64px 80px" : "56px 56px 64px",
          border: "2px solid rgba(245,240,232,0.18)",
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontFamily: "var(--font-dm-serif), serif",
              fontSize: 34,
              letterSpacing: "0.38em",
              color: "#F5F0E8",
            }}
          >
            WHYITSLAPS
          </p>
          <p
            style={{
              margin: "12px 0 0",
              fontSize: 18,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.50)",
            }}
          >
            Music breakdown
          </p>
        </div>

        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 32 }}>
            {track.album_art_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={track.album_art_url}
                alt=""
                crossOrigin="anonymous"
                style={{ width: 120, height: 120, objectFit: "cover", border: "1px solid rgba(255,255,255,0.18)" }}
              />
            ) : (
              <div style={{ width: 120, height: 120, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.04)" }} />
            )}
            <div style={{ minWidth: 0, flex: 1 }}>
              <p
                style={{
                  margin: 0,
                  fontFamily: "var(--font-dm-serif), serif",
                  fontSize: 34,
                  lineHeight: 1.15,
                  color: "#F5F0E8",
                }}
              >
                {truncate(track.title, 42)}
              </p>
              <p style={{ margin: "10px 0 0", fontSize: 18, color: "rgba(255,255,255,0.68)" }}>{track.artist}</p>
            </div>
          </div>

          <p
            style={{
              margin: "0 auto 28px",
              maxWidth: 820,
              fontFamily: "var(--font-dm-serif), serif",
              fontSize: format === "story" ? 30 : 24,
              lineHeight: 1.35,
              textAlign: "center",
              color: "rgba(245,240,232,0.92)",
            }}
          >
            &ldquo;{truncate(c.vibe_summary, format === "story" ? 110 : 80)}&rdquo;
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", marginBottom: 28 }}>
            {tags.map((tag) => (
              <span
                key={tag}
                style={{
                  border: "1px solid rgba(245,240,232,0.55)",
                  padding: "8px 14px",
                  fontSize: 16,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "#F5F0E8",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div>
          {statCells.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${statCells.length}, 1fr)`,
                gap: 16,
                marginBottom: 28,
              }}
            >
              {statCells.map((cell) => (
                <div
                  key={cell.label}
                  style={{
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "rgba(0,0,0,0.35)",
                    padding: "16px 14px",
                    textAlign: "center",
                  }}
                >
                  <p style={{ margin: 0, fontSize: 12, letterSpacing: "0.14em", color: "rgba(255,255,255,0.50)" }}>
                    {cell.label}
                  </p>
                  <p style={{ margin: "8px 0 0", fontFamily: "var(--font-dm-serif), serif", fontSize: 42, lineHeight: 1 }}>
                    {cell.value}
                  </p>
                </div>
              ))}
            </div>
          ) : null}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: "1px solid rgba(255,255,255,0.12)",
              paddingTop: 20,
            }}
          >
            <p style={{ margin: 0, fontSize: 14, letterSpacing: "0.18em", color: "rgba(255,255,255,0.50)" }}>
              Analyzed on WhyItSlaps
            </p>
            <p style={{ margin: 0, fontSize: 16, letterSpacing: "0.2em", color: "rgba(245,240,232,0.72)" }}>
              whyitslaps.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
