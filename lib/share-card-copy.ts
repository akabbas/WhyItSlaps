import type { ClaudeAnalysisScores } from "@/types/analysis";
import type { MusicAnalysisScores, SpotifyAudioFeatures } from "@/types/music-analysis";

export type ShareMeterCell = { label: string; value: string | number };

export const VIDEO_SHARE_METER_KICKER = "this clip's meters · not a ranking";
export const MUSIC_SHARE_METER_KICKER = "this track's meters · not a ranking";

const VIDEO_SHARE_METERS = [
  { key: "color_harmony", label: "COLOR" },
  { key: "edit_pacing", label: "PACING" },
  { key: "motion_feel", label: "MOTION" },
] as const;

export function formatShareTag(tag: string, withHash: boolean): string {
  const clean = tag.replace(/^#/, "").trim();
  if (!clean) return "";
  return withHash ? `#${clean}` : clean;
}

export function formatShareTags(tags: string[], withHash: boolean, max = 3): string[] {
  const out: string[] = [];
  for (const tag of tags) {
    const formatted = formatShareTag(tag, withHash);
    if (!formatted) continue;
    out.push(formatted);
    if (out.length >= max) break;
  }
  return out;
}

export function videoShareMeters(scores: ClaudeAnalysisScores): ShareMeterCell[] {
  return VIDEO_SHARE_METERS.map(({ key, label }) => ({ label, value: scores[key] }));
}

export function musicShareMeters(
  features: SpotifyAudioFeatures | null,
  scores: MusicAnalysisScores | null,
): ShareMeterCell[] {
  const cells: ShareMeterCell[] = [];
  if (features) {
    cells.push({ label: "BPM", value: features.tempo_bpm });
    cells.push({ label: "KEY", value: features.key });
  }
  if (scores) {
    cells.push({ label: "HOOK", value: scores.hook_strength });
  }
  return cells;
}
