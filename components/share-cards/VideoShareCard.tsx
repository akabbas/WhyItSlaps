"use client";

import type { AnalyzeSuccess } from "@/types/analysis";
import type { ShareCardFormat } from "@/lib/share-image";
import { SHARE_CARD_DIMENSIONS } from "@/lib/share-image";

const SCORE_LABELS = {
  color_harmony: "COLOR",
  edit_pacing: "PACING",
  motion_feel: "MOTION",
} as const;

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
  const topPalette = palette.slice(0, 5);
  const tags = c.aesthetic_tags.slice(0, 3);

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
              color: "rgba(255,255,255,0.72)",
            }}
          >
            Video breakdown
          </p>
        </div>

        <div>
          <p
            style={{
              margin: "0 auto 28px",
              maxWidth: 820,
              fontFamily: "var(--font-dm-serif), serif",
              fontSize: format === "story" ? 34 : 28,
              lineHeight: 1.35,
              textAlign: "center",
              color: "rgba(245,240,232,0.92)",
            }}
          >
            &ldquo;{truncate(c.vibe_summary, format === "story" ? 120 : 90)}&rdquo;
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: topPalette.length > 0 ? 28 : 0 }}>
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
                #{tag.replace(/^#/, "")}
              </span>
            ))}
          </div>

          {topPalette.length > 0 ? (
            <div style={{ marginBottom: 28 }}>
              <p
                style={{
                  margin: "0 0 12px",
                  fontSize: 14,
                  letterSpacing: "0.24em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.72)",
                }}
              >
                Palette
              </p>
              <div style={{ display: "flex", height: 18, gap: 4 }}>
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
          <div style={{ display: "flex", gap: 36, marginBottom: 22 }}>
            {(["color_harmony", "edit_pacing", "motion_feel"] as const).map((key) => (
              <div key={key}>
                <p style={{ margin: 0, fontSize: 13, letterSpacing: "0.18em", color: "rgba(255,255,255,0.72)" }}>
                  {SCORE_LABELS[key]}
                </p>
                <p style={{ margin: "6px 0 0", fontFamily: "var(--font-dm-serif), serif", fontSize: 28, lineHeight: 1 }}>
                  {c.scores[key]}
                </p>
              </div>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
              borderTop: "1px solid rgba(255,255,255,0.12)",
              paddingTop: 20,
            }}
          >
            <div>
              <p style={{ margin: 0, fontSize: 14, letterSpacing: "0.18em", color: "rgba(255,255,255,0.72)" }}>
                Pace · {c.edit_style.pacing_badge}
              </p>
              <p style={{ margin: "6px 0 0", fontSize: 14, letterSpacing: "0.18em", color: "rgba(255,255,255,0.72)" }}>
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
