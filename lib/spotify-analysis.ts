import type { SpotifyAudioAnalysisSummary, SpotifySectionSummary } from "@/types/music-analysis";

export type { SpotifyAudioAnalysisSummary, SpotifySectionSummary };

const MAX_SECTIONS = 12;

function num(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return value;
}

/**
 * Keep a small, prompt-safe slice of `/v1/audio-analysis`.
 * Returns null when the payload is empty or unusable.
 */
export function summarizeAudioAnalysis(raw: unknown): SpotifyAudioAnalysisSummary | null {
  if (!raw || typeof raw !== "object") return null;
  const body = raw as Record<string, unknown>;
  const track = body.track && typeof body.track === "object" ? (body.track as Record<string, unknown>) : {};
  const rawSections = Array.isArray(body.sections) ? body.sections : [];

  const sections: SpotifySectionSummary[] = [];
  for (const row of rawSections) {
    if (!row || typeof row !== "object") continue;
    const s = row as Record<string, unknown>;
    const start = num(s.start);
    const duration = num(s.duration);
    const loudness = num(s.loudness);
    const tempo = num(s.tempo);
    if (start === null || duration === null || loudness === null) continue;
    sections.push({
      start_s: Math.round(start * 10) / 10,
      duration_s: Math.round(duration * 10) / 10,
      loudness_db: Math.round(loudness * 10) / 10,
      tempo_bpm: tempo === null ? 0 : Math.round(tempo),
    });
    if (sections.length >= MAX_SECTIONS) break;
  }

  if (sections.length < 2 && num(track.duration) === null) return null;

  return {
    duration_s: Math.round((num(track.duration) ?? 0) * 10) / 10,
    loudness_db: num(track.loudness) !== null ? Math.round((num(track.loudness) as number) * 10) / 10 : null,
    tempo_bpm: num(track.tempo) !== null ? Math.round(num(track.tempo) as number) : null,
    sections,
  };
}

/** Facts for Claude: full-recording shape, distinct from preview DSP scores. */
export function formatAudioAnalysisFacts(summary: SpotifyAudioAnalysisSummary): string {
  const head = [
    "Spotify Audio Analysis of the full catalog recording (not the 30s preview). Use this for form, energy arc, and when loudness/tempo shift. Do not treat preview sonic scores as the whole song.",
    summary.duration_s ? `Duration: ${summary.duration_s}s` : null,
    summary.tempo_bpm ? `Integrated tempo: ${summary.tempo_bpm} BPM` : null,
    summary.loudness_db !== null ? `Integrated loudness: ${summary.loudness_db} dB` : null,
  ]
    .filter(Boolean)
    .join("\n");

  if (summary.sections.length === 0) return head;

  const rows = summary.sections
    .map(
      (s, i) =>
        `${i + 1}. ${s.start_s}s to ${Math.round((s.start_s + s.duration_s) * 10) / 10}s · ${s.loudness_db} dB · ${s.tempo_bpm || "n/a"} BPM`,
    )
    .join("\n");
  return `${head}\nSections:\n${rows}`;
}
