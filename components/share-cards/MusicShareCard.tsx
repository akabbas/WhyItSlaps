"use client";

import type { MusicAnalyzeSuccess } from "@/types/music-analysis";
import type { ShareCardFormat } from "@/lib/share-image";
import { SHARE_CARD_DIMENSIONS } from "@/lib/share-image";
import {
  formatShareTags,
  musicShareMeters,
  MUSIC_SHARE_METER_KICKER,
} from "@/lib/share-card-copy";
import { ShareMeterStrip } from "./ShareMeterStrip";

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
  const story = format === "story";
  const tags = formatShareTags(c.aesthetic_tags, false);
  const meters = musicShareMeters(features, c.scores);
  const artSize = story ? 120 : 88;

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
          padding: story ? "72px 64px 64px" : "56px 56px 48px",
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
              color: "rgba(255,255,255,0.55)",
            }}
          >
            Music breakdown
          </p>
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            minHeight: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: story ? 36 : 24 }}>
            {track.album_art_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={track.album_art_url}
                alt=""
                crossOrigin="anonymous"
                style={{
                  width: artSize,
                  height: artSize,
                  objectFit: "cover",
                  border: "1px solid rgba(255,255,255,0.18)",
                }}
              />
            ) : (
              <div
                style={{
                  width: artSize,
                  height: artSize,
                  border: "1px solid rgba(255,255,255,0.18)",
                  background: "rgba(255,255,255,0.04)",
                }}
              />
            )}
            <div style={{ minWidth: 0, flex: 1 }}>
              <p
                style={{
                  margin: 0,
                  fontFamily: "var(--font-dm-serif), serif",
                  fontSize: story ? 34 : 28,
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
              margin: "0 auto",
              maxWidth: 820,
              fontFamily: "var(--font-dm-serif), serif",
              fontSize: story ? 36 : 28,
              lineHeight: 1.32,
              textAlign: "center",
              color: "rgba(245,240,232,0.94)",
            }}
          >
            &ldquo;{truncate(c.vibe_summary, story ? 110 : 80)}&rdquo;
          </p>

          {tags.length > 0 ? (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                justifyContent: "center",
                marginTop: story ? 28 : 20,
              }}
            >
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
          ) : null}
        </div>

        <div>
          <ShareMeterStrip cells={meters} kicker={MUSIC_SHARE_METER_KICKER} format={format} />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: "1px solid rgba(255,255,255,0.12)",
              paddingTop: 18,
              marginTop: meters.length > 0 ? 22 : 0,
            }}
          >
            <p style={{ margin: 0, fontSize: 14, letterSpacing: "0.18em", color: "rgba(255,255,255,0.55)" }}>
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
