import assert from "node:assert/strict";
import test from "node:test";
import { publicFailure, safeHint } from "./public-error.ts";
import { allowRequest, resetRateLimits } from "./rate-limit.ts";

test("safe hints keep short product sentences and drop tool output", () => {
  assert.equal(safeHint("That site is not supported. Use YouTube, TikTok, Instagram, or X."), "That site is not supported. Use YouTube, TikTok, Instagram, or X.");
  assert.equal(safeHint("yt-dlp exited with code 1: ERROR: [generic] unsupported URL"), undefined);
  assert.equal(safeHint("ffmpeg exited with code 1: /tmp/vc-abc/source.mp4: Invalid data"), undefined);
  assert.equal(safeHint("Missing ANTHROPIC_API_KEY"), undefined);
  assert.equal(publicFailure(new Error("yt-dlp exited with code 1: secret dump"), "Download failed.").error, "Download failed.");
});

test("rate limit allows a burst and then blocks", () => {
  resetRateLimits();
  const now = 1_000_000;
  assert.equal(allowRequest("analyze:1", 2, 60_000, now), true);
  assert.equal(allowRequest("analyze:1", 2, 60_000, now + 10), true);
  assert.equal(allowRequest("analyze:1", 2, 60_000, now + 20), false);
  assert.equal(allowRequest("analyze:1", 2, 60_000, now + 60_001), true);
  assert.equal(allowRequest("download:1", 2, 60_000, now), true);
});
