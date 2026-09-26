import type { MusicAnalysisScores, MusicScoreKey, SpotifyAudioFeatures } from "@/types/music-analysis";

/**
 * Sonic scores used to be six integers the language model invented.
 * The prompt only required 0–100, temperature was 0.42, and nothing
 * mapped a score onto a measurement, so the same track could move
 * and a 72 did not mean anything you could check.
 *
 * They are now a pure function of Spotify audio features. The same
 * features always produce the same integers. The model writes the
 * prose and is told these numbers as facts. When Spotify returns no
 * features, the scores are null.
 *
 * These are proxies. Spotify does not measure hooks, originality, or
 * a mix spectrum, and one valence number is not an emotional arc.
 */

export const SONIC_SCORE_ORDER: MusicScoreKey[] = [
  "hook_strength",
  "production_density",
  "emotional_range",
  "originality",
  "mix_clarity",
  "overall_vibe",
];

export const SONIC_SCORE_LABELS: Record<MusicScoreKey, string> = {
  hook_strength: "HOOK STRENGTH",
  production_density: "PRODUCTION DENSITY",
  emotional_range: "EMOTIONAL RANGE",
  originality: "ORIGINALITY",
  mix_clarity: "MIX CLARITY",
  overall_vibe: "OVERALL VIBE",
};

export const SONIC_SCORE_HINTS: Record<MusicScoreKey, string> = {
  hook_strength: "Groove, energy, and how close the tempo sits to 118 BPM.",
  production_density: "Energy, loudness, and how little acoustic space the arrangement leaves.",
  emotional_range: "The gap between energy and positivity. A driving sad track scores higher than a mood that matches its volume.",
  originality: "Distance from a generic pop feature profile across tempo, energy, danceability, loudness, and the other Spotify features.",
  mix_clarity: "Average loudness near -10 dB. Crushed masters and very quiet masters both land lower.",
  overall_vibe: "Blend of the five scores. Hook 30%, clarity 20%, density 20%, emotional range 15%, originality 15%.",
};

export const SONIC_SCORE_SOURCE =
  "Calculated from Spotify audio features. The same track returns the same numbers.";

/** Weights for overall vibe. They sum to 1 and apply to the already rounded scores. */
const OVERALL_WEIGHTS: Record<Exclude<MusicScoreKey, "overall_vibe">, number> = {
  hook_strength: 0.3,
  production_density: 0.2,
  emotional_range: 0.15,
  originality: 0.15,
  mix_clarity: 0.2,
};

/**
 * Mainstream pop center the originality score measures distance from.
 * These are round reference points, not a fitted corpus.
 */
const POP_CENTER = {
  danceability: 0.67,
  energy: 0.68,
  valence: 0.52,
  acousticness: 0.18,
  instrumentalness: 0.08,
  speechiness: 0.09,
  loudness_db: -7.5,
  tempo_bpm: 120,
} as const;

const HOOK_TEMPO_CENTER_BPM = 118;
const HOOK_TEMPO_WIDTH_BPM = 50;
const CLARITY_LOUDNESS_CENTER_DB = -10;
const CLARITY_LOUDNESS_WIDTH_DB = 12;
const ORIGINALITY_LOUDNESS_SPAN_DB = 20;
const ORIGINALITY_TEMPO_SPAN_BPM = 60;

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

function unitToScore(unit: number): number {
  return Math.round(clamp01(unit) * 100);
}

/** Spotify loudness is dB, typically about -60 to 0. */
function loudnessUnit(db: number): number {
  if (!Number.isFinite(db)) return 0;
  return clamp01((db + 60) / 60);
}

/** 1 at `center`, 0 once `value` is `width` away. */
function bell(value: number, center: number, width: number): number {
  if (!Number.isFinite(value) || width <= 0) return 0;
  return clamp01(1 - Math.abs(value - center) / width);
}

function hookUnit(features: SpotifyAudioFeatures): number {
  const tempoPocket = bell(features.tempo_bpm, HOOK_TEMPO_CENTER_BPM, HOOK_TEMPO_WIDTH_BPM);
  return (
    0.62 * clamp01(features.danceability) +
    0.23 * clamp01(features.energy) +
    0.15 * tempoPocket
  );
}

function densityUnit(features: SpotifyAudioFeatures): number {
  return (
    0.4 * clamp01(features.energy) +
    0.35 * loudnessUnit(features.loudness_db) +
    0.25 * (1 - clamp01(features.acousticness))
  );
}

function emotionalUnit(features: SpotifyAudioFeatures): number {
  return Math.abs(clamp01(features.energy) - clamp01(features.valence));
}

function originalityUnit(features: SpotifyAudioFeatures): number {
  const loudnessDistance = Number.isFinite(features.loudness_db)
    ? clamp01(Math.abs(features.loudness_db - POP_CENTER.loudness_db) / ORIGINALITY_LOUDNESS_SPAN_DB)
    : 1;
  const tempoDistance = Number.isFinite(features.tempo_bpm)
    ? clamp01(Math.abs(features.tempo_bpm - POP_CENTER.tempo_bpm) / ORIGINALITY_TEMPO_SPAN_BPM)
    : 1;
  const deviations = [
    Math.abs(clamp01(features.danceability) - POP_CENTER.danceability),
    Math.abs(clamp01(features.energy) - POP_CENTER.energy),
    Math.abs(clamp01(features.valence) - POP_CENTER.valence),
    Math.abs(clamp01(features.acousticness) - POP_CENTER.acousticness),
    Math.abs(clamp01(features.instrumentalness) - POP_CENTER.instrumentalness),
    Math.abs(clamp01(features.speechiness) - POP_CENTER.speechiness),
    loudnessDistance,
    tempoDistance,
  ];
  return deviations.reduce((sum, value) => sum + value, 0) / deviations.length;
}

function clarityUnit(features: SpotifyAudioFeatures): number {
  return bell(features.loudness_db, CLARITY_LOUDNESS_CENTER_DB, CLARITY_LOUDNESS_WIDTH_DB);
}

export function computeSonicScores(features: SpotifyAudioFeatures): MusicAnalysisScores;
export function computeSonicScores(features: null): null;
export function computeSonicScores(features: SpotifyAudioFeatures | null): MusicAnalysisScores | null;
export function computeSonicScores(features: SpotifyAudioFeatures | null): MusicAnalysisScores | null {
  if (!features) return null;

  const scores: MusicAnalysisScores = {
    hook_strength: unitToScore(hookUnit(features)),
    production_density: unitToScore(densityUnit(features)),
    emotional_range: unitToScore(emotionalUnit(features)),
    originality: unitToScore(originalityUnit(features)),
    mix_clarity: unitToScore(clarityUnit(features)),
    overall_vibe: 0,
  };

  const blended =
    OVERALL_WEIGHTS.hook_strength * scores.hook_strength +
    OVERALL_WEIGHTS.production_density * scores.production_density +
    OVERALL_WEIGHTS.emotional_range * scores.emotional_range +
    OVERALL_WEIGHTS.originality * scores.originality +
    OVERALL_WEIGHTS.mix_clarity * scores.mix_clarity;
  scores.overall_vibe = unitToScore(blended / 100);
  return scores;
}

export function formatSonicScoreFacts(scores: MusicAnalysisScores): string {
  const lines = SONIC_SCORE_ORDER.map(
    (key) => `${SONIC_SCORE_LABELS[key]}: ${scores[key]}/100 — ${SONIC_SCORE_HINTS[key]}`,
  );
  return [
    "Sonic scores are already calculated from Spotify audio features. They are fixed.",
    "Do not output a scores object. Write the critique so it agrees with these numbers.",
    ...lines,
  ].join("\n");
}
