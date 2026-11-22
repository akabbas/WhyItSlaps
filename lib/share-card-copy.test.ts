import assert from "node:assert/strict";
import test from "node:test";

import type { ClaudeAnalysisScores } from "../types/analysis.ts";
import type { MusicAnalysisScores, SpotifyAudioFeatures } from "../types/music-analysis.ts";
import {
  formatShareTag,
  formatShareTags,
  musicShareMeters,
  MUSIC_SHARE_METER_KICKER,
  videoShareMeters,
  VIDEO_SHARE_METER_KICKER,
} from "./share-card-copy.ts";

test("video share tags match results: one leading hash", () => {
  assert.equal(formatShareTag("neon grain", true), "#neon grain");
  assert.equal(formatShareTag("#whip-cut", true), "#whip-cut");
  assert.equal(formatShareTag("  ", true), "");
});

test("music share tags match results: no hash prefix", () => {
  assert.equal(formatShareTag("late-night bass", false), "late-night bass");
  assert.equal(formatShareTag("#club-fog", false), "club-fog");
});

test("formatShareTags keeps three live chips and drops blanks", () => {
  assert.deepEqual(formatShareTags(["#a", "", "b", "c", "d"], true), ["#a", "#b", "#c"]);
  assert.deepEqual(formatShareTags(["a", "b"], false), ["a", "b"]);
});

test("video share meters are character axes, not overall vibe", () => {
  const scores: ClaudeAnalysisScores = {
    color_harmony: 74,
    edit_pacing: 61,
    motion_feel: 82,
    subject_framing: 55,
    overall_vibe: 99,
  };
  assert.deepEqual(videoShareMeters(scores), [
    { label: "COLOR", value: 74 },
    { label: "PACING", value: 61 },
    { label: "MOTION", value: 82 },
  ]);
});

test("music share meters omit missing features and hook", () => {
  assert.deepEqual(musicShareMeters(null, null), []);

  const features = { tempo_bpm: 118, key: "F#m" } as SpotifyAudioFeatures;
  assert.deepEqual(musicShareMeters(features, null), [
    { label: "BPM", value: 118 },
    { label: "KEY", value: "F#m" },
  ]);

  const scores = { hook_strength: 81 } as MusicAnalysisScores;
  assert.deepEqual(musicShareMeters(features, scores), [
    { label: "BPM", value: 118 },
    { label: "KEY", value: "F#m" },
    { label: "HOOK", value: 81 },
  ]);
});

test("share meter kickers frame 0-100 as this piece, not a rank", () => {
  assert.match(VIDEO_SHARE_METER_KICKER, /this clip's meters/);
  assert.match(MUSIC_SHARE_METER_KICKER, /this track's meters/);
  assert.equal(VIDEO_SHARE_METER_KICKER.includes("—"), false);
  assert.equal(MUSIC_SHARE_METER_KICKER.includes("—"), false);
  assert.match(VIDEO_SHARE_METER_KICKER, /not a ranking/);
  assert.match(MUSIC_SHARE_METER_KICKER, /not a ranking/);
});
