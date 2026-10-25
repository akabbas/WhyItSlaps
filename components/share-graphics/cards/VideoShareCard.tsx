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
      data-share-card
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
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 18% 12%, rgba(245,240,232,0.08), transparent 42%), radial-gradient(circle at 82% 88%, rgba(245,240,232,0.05), transparent 38%)",
        }}
      />

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
              color: "rgba(255,255,255,0.45)",
            }}
          >
            Video breakdown
          </p>
        </div>

        <div style={{ textAlign: "center" }}>
          <p
            style={{
              margin: 0,
              fontSize: 20,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.5)",
            }}
          >
            Overall vibe
          </p>
          <p
            style={{
              margin: "8px 0 0",
              fontFamily: "var(--font-dm-serif), serif",
              fontSize: format === "story" ? 180 : 140,
              lineHeight: 1,
              color: "#F5F0E8",
            }}
          >
            {c.scores.overall_vibe}
          </p>
          <p
            style={{
              margin: "28px auto 0",
              maxWidth: 820,
              fontFamily: "var(--font-dm-serif), serif",
              fontSize: format === "story" ? 34 : 28,
              lineHeight: 1.35,
              color: "rgba(245,240,232,0.92)",
            }}
          >
            &ldquo;{truncate(c.vibe_summary, format === "story" ? 120 : 90)}&rdquo;
          </p>
        </div>

        <div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 28 }}>
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
                  color: "rgba(255,255,255,0.42)",
                }}
              >
                Palette
              </p>
              <div style={{ display: "flex", height: 28, gap: 4 }}>
                {topPalette.map((swatch) => (
                  <div
                    key={`${swatch.role}-${swatch.hex}`}
                    title={`${swatch.hex} · ${swatch.populationPercent}%`}
                    style={{
                      flex: swatch.populationPercent,
                      background: swatch.hex,
                      minWidth: 32,
                      border: "1px solid rgba(255,255,255,0.12)",
                    }}
                  />
                ))}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                {topPalette.map((swatch) => (
                  <span
                    key={`label-${swatch.hex}`}
                    style={{
                      fontSize: 11,
                      letterSpacing: "0.12em",
                      color: "rgba(255,255,255,0.45)",
                    }}
                  >
                    {swatch.hex}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 16,
              marginBottom: 28,
            }}
          >
            {(["color_harmony", "edit_pacing", "motion_feel"] as const).map((key) => (
              <div
                key={key}
                style={{
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(0,0,0,0.35)",
                  padding: "16px 14px",
                }}
              >
                <p style={{ margin: 0, fontSize: 12, letterSpacing: "0.14em", color: "rgba(255,255,255,0.48)" }}>
                  {SCORE_LABELS[key]}
                </p>
                <p
                  style={{
                    margin: "8px 0 0",
                    fontFamily: "var(--font-dm-serif), serif",
                    fontSize: 42,
                    lineHeight: 1,
                    color: "#F5F0E8",
                  }}
                >
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
              <p style={{ margin: 0, fontSize: 14, letterSpacing: "0.18em", color: "rgba(255,255,255,0.45)" }}>
                Pace · {c.edit_style.pacing_badge}
              </p>
              <p style={{ margin: "6px 0 0", fontSize: 14, letterSpacing: "0.18em", color: "rgba(255,255,255,0.45)" }}>
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
