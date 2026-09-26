import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { decodeAudioFileToPcm } from "./decode-audio.ts";
import { scoreFromPcm } from "./sonic-scores.ts";

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

test("full-band noise is denser than a low sine, and a tone shift scores higher originality", () => {
  const low = scoreFromPcm(tone(4, 80, 0.5), SAMPLE_RATE);
  const wide = scoreFromPcm(noise(4, 0.25), SAMPLE_RATE);
  const shifting = scoreFromPcm(
    tone(4, 80, 0.4, () => 1).map((sample, index) => {
      const t = index / SAMPLE_RATE;
      if (t < 2) return sample;
      return Math.sin(2 * Math.PI * 4000 * t) * 0.4;
    }),
    SAMPLE_RATE,
  );
  assert.ok(low);
  assert.ok(wide);
  assert.ok(shifting);
  assert.ok(wide.production_density > low.production_density);
  assert.ok(shifting.originality > low.originality);
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
      0.15 * scores.originality +
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
