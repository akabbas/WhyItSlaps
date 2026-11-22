"use client";

import type { AnalyzeSuccess } from "@/types/analysis";
import type { ShareCardFormat } from "@/lib/share-image";
import { SHARE_CARD_DIMENSIONS } from "@/lib/share-image";
import {
  formatShareTags,
  videoShareMeters,
  VIDEO_SHARE_METER_KICKER,
} from "@/lib/share-card-copy";
import { ShareMeterStrip } from "./ShareMeterStrip";

type Props = {
  data: AnalyzeSuccess;
  format: ShareCardFormat;
};

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

export function VideoShareCard({ data, format }: Props) {
  const { width, height } = SHARE_CARD_DIMENSIONS[format];
  const { claude: c, palette } = data;
  const story = format === "story";
  const topPalette = palette.slice(0, 5);
  const tags = formatShareTags(c.aesthetic_tags, true);
  const meters = videoShareMeters(c.scores);

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
            Video breakdown
          </p>
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            textAlign: "center",
            minHeight: 0,
          }}
        >
          <p
            style={{
              margin: "0 auto",
              maxWidth: 820,
              fontFamily: "var(--font-dm-serif), serif",
              fontSize: story ? 42 : 32,
              lineHeight: 1.28,
              color: "rgba(245,240,232,0.94)",
            }}
          >
            &ldquo;{truncate(c.vibe_summary, story ? 120 : 90)}&rdquo;
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

          {topPalette.length > 0 ? (
            <div style={{ marginTop: story ? 36 : 24 }}>
              <p
                style={{
                  margin: "0 0 12px",
                  fontSize: 13,
                  letterSpacing: "0.24em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.55)",
                }}
              >
                Palette
              </p>
              <div style={{ display: "flex", height: 14, gap: 4 }}>
                {topPalette.map((swatch) => (
                  <div
                    key={`${swatch.role}-${swatch.hex}`}
                    style={{
                      flex: swatch.populationPercent,
                      background: swatch.hex,
                      minWidth: 24,
                    }}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div>
          <ShareMeterStrip cells={meters} kicker={VIDEO_SHARE_METER_KICKER} format={format} />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
              marginTop: 22,
              borderTop: "1px solid rgba(255,255,255,0.12)",
              paddingTop: 18,
            }}
          >
            <div>
              <p style={{ margin: 0, fontSize: 14, letterSpacing: "0.18em", color: "rgba(255,255,255,0.55)" }}>
                Pace · {c.edit_style.pacing_badge}
              </p>
              <p style={{ margin: "6px 0 0", fontSize: 14, letterSpacing: "0.18em", color: "rgba(255,255,255,0.55)" }}>
                {data.video_duration_seconds}s clip
              </p>
            </div>
            <p style={{ margin: 0, fontSize: 16, letterSpacing: "0.2em", color: "rgba(245,240,232,0.72)" }}>
              whyitslaps.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
