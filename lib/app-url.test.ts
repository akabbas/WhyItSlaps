import assert from "node:assert/strict";
import test from "node:test";

import { buildAppPath, readAppLocation } from "./app-url.ts";

test("video home stays /", () => {
  assert.equal(buildAppPath("video"), "/");
});

test("music tab and a track url share the address bar", () => {
  assert.equal(buildAppPath("music"), "/?mode=music");
  assert.equal(
    buildAppPath("music", "https://open.spotify.com/track/abc"),
    "/?mode=music&url=https%3A%2F%2Fopen.spotify.com%2Ftrack%2Fabc",
  );
});

test("history and still are mode only", () => {
  assert.equal(buildAppPath("history"), "/?mode=history");
  assert.equal(buildAppPath("still", "https://example.com/x.jpg"), "/?mode=still");
});

test("readAppLocation keeps url and analyze=0", () => {
  const live = readAppLocation("?mode=music&url=https://open.spotify.com/track/abc");
  assert.equal(live.mode, "music");
  assert.equal(live.url, "https://open.spotify.com/track/abc");
  assert.equal(live.autoAnalyze, true);

  const quiet = readAppLocation("?mode=music&url=https://open.spotify.com/track/abc&analyze=0");
  assert.equal(quiet.autoAnalyze, false);

  const home = readAppLocation("");
  assert.equal(home.mode, "video");
  assert.equal(home.url, "");
});
