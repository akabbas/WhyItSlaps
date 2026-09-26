import assert from "node:assert/strict";
import test from "node:test";
import { pickPreviewUrl } from "./preview-match.ts";

test("picks the preview whose title and artist match", () => {
  const url = pickPreviewUrl("M83", "Midnight City", [
    {
      trackName: "Midnight City",
      artistName: "Somebody Else",
      previewUrl: "https://example.com/wrong.m4a",
    },
    {
      trackName: "Midnight City",
      artistName: "M83",
      previewUrl: "https://audio-ssl.itunes.apple.com/midnight.m4a",
    },
  ]);
  assert.equal(url, "https://audio-ssl.itunes.apple.com/midnight.m4a");
});

test("ignores a close title from a different artist and a non-https url", () => {
  const url = pickPreviewUrl("M83", "Midnight City", [
    { trackName: "Midnight City", artistName: "Cover Band", previewUrl: "http://example.com/nope.m4a" },
    { trackName: "Midnight", artistName: "M83", previewUrl: "https://audio-ssl.itunes.apple.com/short.m4a" },
  ]);
  assert.equal(url, "https://audio-ssl.itunes.apple.com/short.m4a");
});

test("returns null when nothing matches", () => {
  assert.equal(
    pickPreviewUrl("M83", "Midnight City", [
      { trackName: "Other Song", artistName: "M83", previewUrl: "https://example.com/other.m4a" },
    ]),
    null,
  );
});
