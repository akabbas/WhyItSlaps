import type { AnalyzeSuccess } from "@/types/analysis";

export function formatShareSummary(data: AnalyzeSuccess): string {
  const { claude: c } = data;
  const chips = c.aesthetic_tags.join(", ");

  const lines = [
    "WhyItSlaps breakdown",
    `— ${c.vibe_summary}`,
    "",
    `Tags: ${chips}`,
    `Audience: ${c.target_audience}`,
    "",
    "Scores:",
    `- Color harmony ${c.scores.color_harmony}/100`,
    `- Edit pacing ${c.scores.edit_pacing}/100`,
    `- Motion feel ${c.scores.motion_feel}/100`,
    `- Subject framing ${c.scores.subject_framing}/100`,
    `- Overall vibe ${c.scores.overall_vibe}/100`,
    "",
    `Keyframes sampled: ${data.keyframe_count} · Duration ~${data.video_duration_seconds}s`,
  ];

  if (data.music && (data.music.title || data.music.artist)) {
    const conf = data.music.confidence != null ? ` (${Math.round(data.music.confidence)}% match)` : "";
    lines.push(
      "",
      "Music:",
      `${data.music.title ?? "Unknown title"} · ${data.music.artist ?? "Unknown artist"}${conf}${data.music.bpm ? ` · ~${data.music.bpm} BPM` : ""}`,
    );
    if (data.music.album) lines.push(`Album: ${data.music.album}`);
    if (data.music.spotify_id) lines.push(`Spotify: ${data.music.spotify_id}`);
    if (data.music.genres.length) lines.push(`Genres: ${data.music.genres.join(", ")}`);
  } else {
    lines.push("", "Music: unrecognized in first 10s sample");
  }

  lines.push(
    "",
    "Cinematography:",
    c.cinematography.framing_composition,
    c.cinematography.lens_and_motion,
    "",
    "Color grade:",
    c.color_grade.palette_mood,
    c.color_grade.contrast_curve,
  );

  lines.push("", "Edit pacing:", `${c.edit_style.pacing_badge}`, `Cuts: ${c.edit_style.cut_pattern}`, `Transitions: ${c.edit_style.transitions}`);

  lines.push("", "Why it reads:", ...c.why_it_works.map((w, i) => `${String(i + 1).padStart(2, "0")}. ${w.title}: ${w.detail}`));

  lines.push(
    "",
    "How to recreate:",
    ...c.how_to_edit_like_this.map((h, idx) => `${idx + 1}. ${h.summary}`),
  );

  return lines.join("\n");
}
