import assert from "node:assert/strict";
import { test } from "node:test";
import { formatAudioAnalysisFacts, summarizeAudioAnalysis } from "./spotify-analysis.ts";

test("summarizeAudioAnalysis keeps a short section list from a full-recording payload", () => {
  const summary = summarizeAudioAnalysis({
    track: { duration: 237.4, loudness: -6.21, tempo: 127.9 },
    sections: [
      { start: 0, duration: 12.44, loudness: -14.1, tempo: 120.2 },
      { start: 12.44, duration: 48.1, loudness: -8.2, tempo: 128 },
      { start: 60.54, duration: 30, loudness: -5.4, tempo: 128 },
    ],
  });
  assert.ok(summary);
  assert.equal(summary.duration_s, 237.4);
  assert.equal(summary.tempo_bpm, 128);
  assert.equal(summary.sections.length, 3);
  assert.equal(summary.sections[0]?.loudness_db, -14.1);
});

test("summarizeAudioAnalysis returns null on empty junk", () => {
  assert.equal(summarizeAudioAnalysis(null), null);
  assert.equal(summarizeAudioAnalysis({}), null);
});

test("formatAudioAnalysisFacts tells the model this is the full recording", () => {
  const text = formatAudioAnalysisFacts({
    duration_s: 200,
    loudness_db: -7,
    tempo_bpm: 90,
    sections: [{ start_s: 0, duration_s: 20, loudness_db: -12, tempo_bpm: 90 }],
  });
  assert.match(text, /full catalog recording/);
  assert.match(text, /not the 30s preview/);
  assert.match(text, /0s to 20s/);
});
