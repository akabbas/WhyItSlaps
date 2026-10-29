import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { decodeAudioFileToPcm } from "./decode-audio.ts";
import {
  blendSonicScores,
  formatSonicScoreFacts,
  scoreFromCatalogSignals,
  scoreFromPcm,
  SONIC_SCORE_HINTS,
  SONIC_SCORE_LABELS,
  SONIC_SCORE_ORDER,
} from "./sonic-scores.ts";

const SAMPLE_RATE = 22050;

function tone(seconds: number, frequency: number, amplitude: number, shape?: (t: number) => number): Float32Array {
  const length = Math.floor(SAMPLE_RATE * seconds);
  const samples = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    const t = i / SAMPLE_RATE;
    const envelope = shape ? shape(t) : 1;
    samples[i] = Math.sin(2 * Math.PI * frequency * t) * amplitude * envelope;
  }
  return samples;
}

function noise(seconds: number, amplitude: number): Float32Array {
  const length = Math.floor(SAMPLE_RATE * seconds);
  const samples = new Float32Array(length);
  let state = 1;
  for (let i = 0; i < length; i++) {
    state = (state * 16807) % 2147483647;
    const unit = state / 2147483647;
    samples[i] = (unit * 2 - 1) * amplitude;
  }
  return samples;
}

test("silence, a short clip, and an empty buffer produce no scores", () => {
  assert.equal(scoreFromPcm(new Float32Array(SAMPLE_RATE * 4), SAMPLE_RATE), null);
  assert.equal(scoreFromPcm(tone(0.4, 440, 0.2), SAMPLE_RATE), null);
  assert.equal(scoreFromPcm(new Float32Array(0), SAMPLE_RATE), null);
});

test("a pulsing tone scores a stronger hook and wider range than a steady tone", () => {
  const steady = scoreFromPcm(tone(4, 220, 0.4), SAMPLE_RATE);
  const pulsing = scoreFromPcm(
    tone(4, 220, 0.4, (t) => 0.15 + 0.85 * (0.5 + 0.5 * Math.sin(2 * Math.PI * 2 * t))),
    SAMPLE_RATE,
  );
  assert.ok(steady);
  assert.ok(pulsing);
  assert.ok(pulsing.hook_strength > steady.hook_strength);
  assert.ok(pulsing.emotional_range > steady.emotional_range);
  assert.ok(steady.emotional_range < 15);
});

test("full-band noise is denser than a low sine, and a late hit scores higher impact than a steady tone", () => {
  const low = scoreFromPcm(tone(4, 80, 0.5), SAMPLE_RATE);
  const wide = scoreFromPcm(noise(4, 0.25), SAMPLE_RATE);
  const steady = scoreFromPcm(tone(4, 220, 0.45), SAMPLE_RATE);
  const hit = scoreFromPcm(
    tone(4, 220, 0.45, (t) => (t < 3 ? 0.08 : 1)),
    SAMPLE_RATE,
  );
  assert.ok(low);
  assert.ok(wide);
  assert.ok(steady);
  assert.ok(hit);
  assert.ok(wide.production_density > low.production_density);
  assert.ok(hit.impact > steady.impact + 25);
  assert.ok(steady.impact < 20);
});

test("a clipped waveform scores lower mix clarity than broadband audio with headroom", () => {
  const clipped = Float32Array.from(noise(4, 1).map((sample) => Math.max(-0.2, Math.min(0.2, sample * 8))));
  const open = noise(4, 0.12);
  const openRms = Math.sqrt(open.reduce((sum, sample) => sum + sample * sample, 0) / open.length);
  open[0] = Math.min(0.98, openRms * 4);
  const crushed = scoreFromPcm(clipped, SAMPLE_RATE);
  const dynamic = scoreFromPcm(open, SAMPLE_RATE);
  assert.ok(crushed);
  assert.ok(dynamic);
  assert.ok(dynamic.mix_clarity > crushed.mix_clarity);
});

test("overall vibe is the weighted blend of the five measured scores", () => {
  const scores = scoreFromPcm(noise(4, 0.3), SAMPLE_RATE);
  assert.ok(scores);
  const expected = Math.round(
    0.3 * scores.hook_strength +
      0.2 * scores.production_density +
      0.15 * scores.emotional_range +
      0.15 * scores.impact +
      0.2 * scores.mix_clarity,
  );
  assert.equal(scores.overall_vibe, expected);
});

test("two different recordings do not receive the same score set", () => {
  const a = scoreFromPcm(tone(4, 110, 0.3), SAMPLE_RATE);
  const b = scoreFromPcm(
    tone(4, 440, 0.5, (t) => (t % 0.5 < 0.12 ? 1 : 0.05)),
    SAMPLE_RATE,
  );
  assert.ok(a);
  assert.ok(b);
  assert.notDeepEqual(a, b);
});

test("ffmpeg decoded audio can be scored", async () => {
  const dir = mkdtempSync(join(tmpdir(), "whyitslaps-pcm-"));
  const wavPath = join(dir, "tone.wav");
  try {
    const rendered = spawnSync(
      "ffmpeg",
      ["-y", "-v", "error", "-f", "lavfi", "-i", "sine=frequency=220:duration=3:sample_rate=22050", wavPath],
      { encoding: "utf8" },
    );
    assert.equal(rendered.status, 0, rendered.stderr);
    const decoded = await decodeAudioFileToPcm(wavPath);
    assert.ok(decoded);
    assert.ok(decoded.samples.length > SAMPLE_RATE * 2);
    const scores = scoreFromPcm(decoded.samples, decoded.sampleRate);
    assert.ok(scores);
    assert.ok(scores.emotional_range < 20);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

const features = {
  tempo_bpm: 120,
  key: "C Major",
  energy: 0.2,
  danceability: 0.3,
  valence: 0.5,
  acousticness: 0.8,
  instrumentalness: 0.1,
  loudness_db: -14,
  speechiness: 0.05,
  time_signature: 4,
};

test("catalog scores track full-recording energy and a chorus loudness lift", () => {
  const quiet = scoreFromCatalogSignals(features, null);
  const dense = scoreFromCatalogSignals({ ...features, energy: 0.9, acousticness: 0.05 }, null);
  assert.ok(quiet);
  assert.ok(dense);
  assert.ok(dense.impact > quiet.impact);
  assert.ok(dense.production_density > quiet.production_density);

  const flat = scoreFromCatalogSignals(features, {
    duration_s: 200,
    loudness_db: -8,
    tempo_bpm: 120,
    sections: [
      { start_s: 0, duration_s: 40, loudness_db: -9, tempo_bpm: 120 },
      { start_s: 40, duration_s: 40, loudness_db: -8.5, tempo_bpm: 120 },
    ],
  });
  const lifted = scoreFromCatalogSignals(features, {
    duration_s: 200,
    loudness_db: -8,
    tempo_bpm: 120,
    sections: [
      { start_s: 0, duration_s: 40, loudness_db: -14, tempo_bpm: 120 },
      { start_s: 40, duration_s: 40, loudness_db: -4, tempo_bpm: 120 },
    ],
  });
  assert.ok(flat);
  assert.ok(lifted);
  assert.ok(lifted.hook_strength > flat.hook_strength);
  assert.ok(lifted.emotional_range > flat.emotional_range);
});

test("blend keeps catalog hook/impact and preview mix clarity", () => {
  const catalog = scoreFromCatalogSignals({ ...features, energy: 0.85, acousticness: 0.1 }, null);
  const preview = scoreFromPcm(noise(4, 0.12), SAMPLE_RATE);
  assert.ok(catalog);
  assert.ok(preview);
  const blended = blendSonicScores(catalog, preview);
  assert.ok(blended);
  assert.equal(blended.impact, catalog.impact);
  assert.equal(blended.hook_strength, catalog.hook_strength);
  assert.equal(blended.mix_clarity, preview.mix_clarity);
});

test("catalog and preview both missing yields no scores", () => {
  assert.equal(scoreFromCatalogSignals(null, null), null);
  assert.equal(blendSonicScores(null, null), null);
});

test("meter labels are measurements and facts use those names", () => {
  assert.equal(SONIC_SCORE_LABELS.hook_strength, "CHORUS LIFT");
  assert.equal(SONIC_SCORE_LABELS.production_density, "DENSITY");
  assert.equal(SONIC_SCORE_LABELS.emotional_range, "DYNAMICS");
  assert.equal(SONIC_SCORE_LABELS.impact, "ENERGY");
  assert.equal(SONIC_SCORE_LABELS.mix_clarity, "HEADROOM");
  assert.equal(SONIC_SCORE_LABELS.overall_vibe, "SHAPE");

  for (const key of SONIC_SCORE_ORDER) {
    assert.ok(SONIC_SCORE_HINTS[key].includes("."));
    assert.notEqual(SONIC_SCORE_HINTS[key], SONIC_SCORE_LABELS[key]);
  }

  const facts = formatSonicScoreFacts({
    hook_strength: 70,
    production_density: 60,
    emotional_range: 50,
    impact: 40,
    mix_clarity: 30,
    overall_vibe: 55,
  });
  assert.match(facts, /CHORUS LIFT: 70\/100/);
  assert.match(facts, /DENSITY: 60\/100/);
  assert.match(facts, /DYNAMICS: 50\/100/);
  assert.match(facts, /ENERGY: 40\/100/);
  assert.match(facts, /HEADROOM: 30\/100/);
  assert.match(facts, /SHAPE: 55\/100/);
  assert.equal(facts.includes("HOOK STRENGTH"), false);
  assert.equal(facts.includes("OVERALL VIBE"), false);
  assert.equal(facts.includes("MIX CLARITY"), false);
});
