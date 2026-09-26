import assert from "node:assert/strict";
import test from "node:test";
import type { SpotifyAudioFeatures } from "../types/music-analysis.ts";
import { computeSonicScores } from "./sonic-scores.ts";

const popCenter: SpotifyAudioFeatures = {
  tempo_bpm: 120,
  key: "C Major",
  energy: 0.68,
  danceability: 0.67,
  valence: 0.52,
  acousticness: 0.18,
  instrumentalness: 0.08,
  loudness_db: -7.5,
  speechiness: 0.09,
  time_signature: 4,
};

test("missing features produce no scores", () => {
  assert.equal(computeSonicScores(null), null);
});

test("a generic pop center is reproducible and low on originality", () => {
  const scores = computeSonicScores(popCenter);
  assert.deepEqual(scores, computeSonicScores(popCenter));
  assert.equal(scores.originality, 0);
  assert.equal(scores.hook_strength, 72);
  assert.equal(scores.production_density, 78);
  assert.equal(scores.emotional_range, 16);
  assert.equal(scores.mix_clarity, 79);
  assert.equal(scores.overall_vibe, 55);
});

test("emotional range is the rounded gap between energy and valence", () => {
  const scores = computeSonicScores({
    ...popCenter,
    energy: 0.91,
    valence: 0.2,
  });
  assert.equal(scores.emotional_range, 71);
});

test("overall vibe is the weighted blend of the five rounded scores", () => {
  const scores = computeSonicScores({
    ...popCenter,
    energy: 0.2,
    danceability: 0.2,
    valence: 0.9,
    acousticness: 0.95,
    instrumentalness: 0.9,
    speechiness: 0.7,
    loudness_db: -24,
    tempo_bpm: 70,
  });
  const expected = Math.round(
    0.3 * scores.hook_strength +
      0.2 * scores.production_density +
      0.15 * scores.emotional_range +
      0.15 * scores.originality +
      0.2 * scores.mix_clarity,
  );
  assert.equal(scores.overall_vibe, expected);
  assert.ok(scores.originality > 40);
});

test("extreme features stay inside 0–100", () => {
  const extremes: SpotifyAudioFeatures[] = [
    {
      tempo_bpm: 0,
      key: "Unknown",
      energy: 0,
      danceability: 0,
      valence: 0,
      acousticness: 0,
      instrumentalness: 0,
      loudness_db: -60,
      speechiness: 0,
      time_signature: 4,
    },
    {
      tempo_bpm: 240,
      key: "F# minor",
      energy: 1,
      danceability: 1,
      valence: 1,
      acousticness: 1,
      instrumentalness: 1,
      loudness_db: 0,
      speechiness: 1,
      time_signature: 7,
    },
    {
      tempo_bpm: Number.NaN,
      key: "C Major",
      energy: Number.NaN,
      danceability: Number.NaN,
      valence: Number.NaN,
      acousticness: Number.NaN,
      instrumentalness: Number.NaN,
      loudness_db: Number.NaN,
      speechiness: Number.NaN,
      time_signature: 4,
    },
  ];

  for (const features of extremes) {
    const scores = computeSonicScores(features);
    for (const value of Object.values(scores)) {
      assert.equal(Number.isInteger(value), true);
      assert.ok(value >= 0 && value <= 100);
    }
  }
});
