"use client";

import type { AnalyzeSuccess } from "@/types/analysis";
import { SHARE_CARD_DIMENSIONS } from "@/lib/share-image";

const SCORE_LABELS = {
  color_harmony: "COLOR",
  edit_pacing: "PACING",
  motion_feel: "MOTION",
} as const;

type Props = {
  data: AnalyzeSuccess;
};

/** Strava-style transparent sticker — drop over the user's own clip in Stories. */
export function VideoOverlayCard({ data }: Props) {
  const { width, height } = SHARE_CARD_DIMENSIONS.story;
  const { claude: c, palette } = data;
  const topPalette = palette.slice(0, 5);
  const tags = c.aesthetic_tags.slice(0, 3);

  return (
    <div
      data-share-overlay
      style={{
        width,
        height,
        background: "transparent",
        position: "relative",
        fontFamily: "var(--font-ibm-plex), monospace",
        boxSizing: "border-box",
      }}
    >
      {/* Top brand mark — minimal, like Strava orange logo area */}
      <div style={{ position: "absolute", top: 72, left: 64, right: 64 }}>
        <p
          style={{
            margin: 0,
            fontFamily: "var(--font-dm-serif), serif",
            fontSize: 28,
            letterSpacing: "0.38em",
            color: "#F5F0E8",
            textShadow: "0 2px 24px rgba(0,0,0,0.85), 0 1px 4px rgba(0,0,0,0.9)",
          }}
        >
          WHYITSLAPS
        </p>
      </div>

      {/* Bottom stats panel — glassy, floats over user's video */}
      <div
        style={{
          position: "absolute",
          left: 48,
          right: 48,
          bottom: 80,
          padding: "36px 40px 32px",
          background: "rgba(10,10,10,0.72)",
          border: "1px solid rgba(245,240,232,0.22)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24 }}>
          <div>
            <p
              style={{
                margin: 0,
                fontSize: 14,
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.5)",
              }}
            >
              Overall vibe
            </p>
            <p
              style={{
                margin: "4px 0 0",
                fontFamily: "var(--font-dm-serif), serif",
                fontSize: 96,
                lineHeight: 1,
                color: "#F5F0E8",
              }}
            >
              {c.scores.overall_vibe}
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, flex: 1, maxWidth: 420 }}>
            {(["color_harmony", "edit_pacing", "motion_feel"] as const).map((key) => (
              <div key={key} style={{ textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 10, letterSpacing: "0.12em", color: "rgba(255,255,255,0.45)" }}>
                  {SCORE_LABELS[key]}
                </p>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontFamily: "var(--font-dm-serif), serif",
                    fontSize: 32,
                    lineHeight: 1,
                    color: "#F5F0E8",
                  }}
                >
                  {c.scores[key]}
                </p>
              </div>
            ))}
          </div>
        </div>

        {topPalette.length > 0 ? (
          <div style={{ marginTop: 24 }}>
            <p
              style={{
                margin: "0 0 10px",
                fontSize: 11,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.4)",
              }}
            >
              Palette
            </p>
            <div style={{ display: "flex", height: 14, gap: 3 }}>
              {topPalette.map((swatch) => (
                <div
                  key={`${swatch.role}-${swatch.hex}`}
                  style={{ flex: swatch.populationPercent, background: swatch.hex, minWidth: 20 }}
                />
              ))}
            </div>
          </div>
        ) : null}

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 20 }}>
          {tags.map((tag) => (
            <span
              key={tag}
              style={{
                border: "1px solid rgba(245,240,232,0.4)",
                padding: "6px 10px",
                fontSize: 12,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#F5F0E8",
              }}
            >
              #{tag.replace(/^#/, "")}
            </span>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 20,
            paddingTop: 16,
            borderTop: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <p style={{ margin: 0, fontSize: 12, letterSpacing: "0.16em", color: "rgba(255,255,255,0.42)" }}>
            {c.edit_style.pacing_badge} · {data.video_duration_seconds}s
          </p>
          <p style={{ margin: 0, fontSize: 13, letterSpacing: "0.18em", color: "rgba(245,240,232,0.65)" }}>
            whyitslaps.com
          </p>
        </div>
      </div>
    </div>
  );
}
