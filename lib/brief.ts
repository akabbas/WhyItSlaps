import type { ClaudeAnalysis } from "@/types/analysis";
import type { ClaudeMusicAnalysis } from "@/types/music-analysis";

/** First sentence, or full string if no sentence break. */
export function firstSentence(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  const match = trimmed.match(/^[^.!?]+[.!?]/);
  return match ? match[0].trim() : trimmed;
}

export function videoBriefHeadline(c: ClaudeAnalysis): string {
  return c.brief_summary?.trim() || firstSentence(c.vibe_summary) || c.vibe_summary;
}

export function videoSectionSummaries(c: ClaudeAnalysis): {
  cinematography: string;
  color_grade: string;
  edit_style: string;
} {
  const s = c.section_summaries;
  return {
    cinematography:
      s?.cinematography?.trim() ||
      firstSentence(c.cinematography.framing_composition) ||
      c.cinematography.framing_composition,
    color_grade:
      s?.color_grade?.trim() || firstSentence(c.color_grade.palette_mood) || c.color_grade.palette_mood,
    edit_style:
      s?.edit_style?.trim() ||
      `${c.edit_style.pacing_badge} — ${firstSentence(c.edit_style.cut_pattern)}`,
  };
}

export function musicBriefHeadline(c: ClaudeMusicAnalysis): string {
  return c.brief_summary?.trim() || firstSentence(c.vibe_summary) || c.vibe_summary;
}

export function musicSectionSummaries(c: ClaudeMusicAnalysis): {
  arrangement: string;
  mix: string;
  sonic: string;
} {
  const s = c.section_summaries;
  const sonicFallback =
    c.sonic_textures.length > 0
      ? c.sonic_textures
          .slice(0, 3)
          .map((t) => t.name)
          .join(", ")
      : "";
  return {
    arrangement:
      s?.arrangement?.trim() || firstSentence(c.arrangement.structure) || c.arrangement.structure,
    mix: s?.mix?.trim() || firstSentence(c.mix_profile.low_end) || c.mix_profile.low_end,
    sonic: s?.sonic?.trim() || sonicFallback,
  };
}
