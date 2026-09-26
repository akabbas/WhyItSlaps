import type { MusicAnalysisScores, MusicScoreKey } from "@/types/music-analysis";

/**
 * Sonic scores are measured from the audio of the track being analyzed.
 * Each song is decoded and scored from its own waveform. There is no
 * shared lookup and no fallback number when the audio cannot be read.
 */

export const SONIC_SCORE_ORDER: MusicScoreKey[] = [
  "hook_strength",
  "production_density",
  "emotional_range",
  "impact",
  "mix_clarity",
  "overall_vibe",
];

export const SONIC_SCORE_LABELS: Record<MusicScoreKey, string> = {
  hook_strength: "HOOK STRENGTH",
  production_density: "PRODUCTION DENSITY",
  emotional_range: "EMOTIONAL RANGE",
  impact: "IMPACT",
  mix_clarity: "MIX CLARITY",
  overall_vibe: "OVERALL VIBE",
};

export const SONIC_SCORE_MISSING = "Sonic scores couldn't be found for this track.";

const OVERALL_WEIGHTS = {
  hook_strength: 0.3,
  production_density: 0.2,
  emotional_range: 0.15,
  impact: 0.15,
  mix_clarity: 0.2,
} as const;

const WINDOW_SEC = 0.4;
const HOP_SEC = 0.1;
const MIN_SECONDS = 1.5;
const SILENCE_RMS = 1e-4;

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

function unitToScore(unit: number): number {
  return Math.round(clamp01(unit) * 100);
}

function ampToDb(amp: number): number {
  return 20 * Math.log10(Math.max(amp, 1e-10));
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function stdev(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const variance = values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo] ?? 0;
  const loValue = sorted[lo] ?? 0;
  const hiValue = sorted[hi] ?? loValue;
  return loValue * (hi - idx) + hiValue * (idx - lo);
}

type Biquad = { b0: number; b1: number; b2: number; a1: number; a2: number };

function lowpass(sampleRate: number, freq: number): Biquad {
  const w0 = (2 * Math.PI * freq) / sampleRate;
  const cos = Math.cos(w0);
  const alpha = Math.sin(w0) / (2 * Math.SQRT1_2);
  const b0 = (1 - cos) / 2;
  const b1 = 1 - cos;
  const b2 = (1 - cos) / 2;
  const a0 = 1 + alpha;
  return { b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: (-2 * cos) / a0, a2: (1 - alpha) / a0 };
}

function highpass(sampleRate: number, freq: number): Biquad {
  const w0 = (2 * Math.PI * freq) / sampleRate;
  const cos = Math.cos(w0);
  const alpha = Math.sin(w0) / (2 * Math.SQRT1_2);
  const b0 = (1 + cos) / 2;
  const b1 = -(1 + cos);
  const b2 = (1 + cos) / 2;
  const a0 = 1 + alpha;
  return { b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: (-2 * cos) / a0, a2: (1 - alpha) / a0 };
}

function applyBiquad(samples: Float32Array, filter: Biquad): Float32Array {
  const out = new Float32Array(samples.length);
  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;
  for (let i = 0; i < samples.length; i++) {
    const x0 = samples[i] ?? 0;
    const y0 = filter.b0 * x0 + filter.b1 * x1 + filter.b2 * x2 - filter.a1 * y1 - filter.a2 * y2;
    out[i] = y0;
    x2 = x1;
    x1 = x0;
    y2 = y1;
    y1 = y0;
  }
  return out;
}

function windowRms(samples: Float32Array, start: number, end: number): number {
  let sum = 0;
  const length = Math.max(1, end - start);
  for (let i = start; i < end; i++) {
    const sample = samples[i] ?? 0;
    sum += sample * sample;
  }
  return Math.sqrt(sum / length);
}

/** Strongest repeating pulse between about 0.25s and 4s, ignoring a flat line. */
function pulseStrength(envelope: number[], hopSec: number): number {
  if (envelope.length < 8) return 0;
  const avg = mean(envelope);
  if (avg < SILENCE_RMS) return 0;
  const centered = envelope.map((value) => value - avg);
  let energy = 0;
  for (const value of centered) energy += value * value;
  if (energy < 1e-12) return 0;

  const minLag = Math.max(1, Math.round(0.25 / hopSec));
  const maxLag = Math.min(centered.length - 2, Math.round(4 / hopSec));
  let best = 0;
  for (let lag = minLag; lag <= maxLag; lag++) {
    let sum = 0;
    const overlap = centered.length - lag;
    for (let i = 0; i < overlap; i++) sum += (centered[i] ?? 0) * (centered[i + lag] ?? 0);
    const normalized = sum / energy;
    if (normalized > best) best = normalized;
  }

  const variation = clamp01(stdev(envelope) / avg / 0.25);
  return clamp01(best) * (0.35 + 0.65 * variation);
}

/** How far the loudest stretch sits above the typical level of this clip. */
function impactUnit(envelope: number[]): number {
  if (envelope.length < 4) return 0;
  const sorted = [...envelope].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const body = sorted.length % 2 === 0 ? ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2 : (sorted[mid] ?? 0);
  const hitCount = Math.max(1, Math.round(envelope.length * 0.1));
  const hit = mean(sorted.slice(-hitCount));
  if (body < SILENCE_RMS) return hit >= SILENCE_RMS ? 1 : 0;
  const contrastDb = ampToDb(hit) - ampToDb(body);
  return clamp01(contrastDb / 12);
}

function inRange(scores: MusicAnalysisScores): boolean {
  return SONIC_SCORE_ORDER.every((key) => {
    const value = scores[key];
    return Number.isInteger(value) && value >= 0 && value <= 100;
  });
}

/**
 * Score one recording from its mono samples. Returns null when the
 * buffer is too short or too quiet to measure.
 */
export function scoreFromPcm(samples: Float32Array, sampleRate: number): MusicAnalysisScores | null {
  if (!Number.isFinite(sampleRate) || sampleRate < 8000) return null;
  if (samples.length < sampleRate * MIN_SECONDS) return null;

  let peak = 0;
  let sumSquares = 0;
  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i] ?? 0;
    const abs = Math.abs(sample);
    if (abs > peak) peak = abs;
    sumSquares += sample * sample;
  }
  const fullRms = Math.sqrt(sumSquares / samples.length);
  if (fullRms < SILENCE_RMS) return null;

  const low = applyBiquad(samples, lowpass(sampleRate, 180));
  const mid = applyBiquad(applyBiquad(samples, highpass(sampleRate, 250)), lowpass(sampleRate, 4000));
  const high = applyBiquad(samples, highpass(sampleRate, 5000));

  const window = Math.floor(sampleRate * WINDOW_SEC);
  const hop = Math.floor(sampleRate * HOP_SEC);
  if (window < 32 || hop < 1) return null;

  const envelope: number[] = [];
  const loudnessDb: number[] = [];
  const fill: number[] = [];
  const imbalance: number[] = [];

  for (let start = 0; start + window <= samples.length; start += hop) {
    const end = start + window;
    const rms = windowRms(samples, start, end);
    const lowRms = windowRms(low, start, end);
    const midRms = windowRms(mid, start, end);
    const highRms = windowRms(high, start, end);
    envelope.push(rms);
    if (rms >= SILENCE_RMS) loudnessDb.push(ampToDb(rms));

    const bands = [ampToDb(lowRms), ampToDb(midRms), ampToDb(highRms)];
    const loudest = Math.max(...bands);
    const quietest = Math.min(...bands);
    const occupied = bands.filter((band) => loudest - band < 14).length / bands.length;
    fill.push(occupied);
    imbalance.push(loudest - quietest);
  }

  if (loudnessDb.length < 4) return null;

  const integratedDb = mean(loudnessDb);
  const rangeLu = percentile(loudnessDb, 0.95) - percentile(loudnessDb, 0.1);
  const crestDb = ampToDb(peak) - ampToDb(fullRms);
  const presence = clamp01((integratedDb - -36) / (-8 - -36));
  const fillRatio = mean(fill);
  const crestScore = clamp01(1 - Math.abs(crestDb - 12) / 10);
  const balanceScore = clamp01(1 - (mean(imbalance) - 8) / 28);

  const scores: MusicAnalysisScores = {
    hook_strength: unitToScore(pulseStrength(envelope, HOP_SEC)),
    production_density: unitToScore(0.6 * fillRatio + 0.4 * presence),
    emotional_range: unitToScore(rangeLu / 20),
    impact: unitToScore(impactUnit(envelope)),
    mix_clarity: unitToScore(0.55 * crestScore + 0.45 * balanceScore),
    overall_vibe: 0,
  };

  const blended =
    OVERALL_WEIGHTS.hook_strength * scores.hook_strength +
    OVERALL_WEIGHTS.production_density * scores.production_density +
    OVERALL_WEIGHTS.emotional_range * scores.emotional_range +
    OVERALL_WEIGHTS.impact * scores.impact +
    OVERALL_WEIGHTS.mix_clarity * scores.mix_clarity;
  scores.overall_vibe = unitToScore(blended / 100);
  if (!inRange(scores)) return null;
  return scores;
}

export function formatSonicScoreFacts(scores: MusicAnalysisScores): string {
  const lines = SONIC_SCORE_ORDER.map((key) => `${SONIC_SCORE_LABELS[key]}: ${scores[key]}/100`);
  return [
    "These sonic scores are already set for this track.",
    "Do not output a scores object. Write the critique so it agrees with these numbers.",
    "Do not explain how the scores were calculated.",
    ...lines,
  ].join("\n");
}
