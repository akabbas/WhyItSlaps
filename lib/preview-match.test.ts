import assert from "node:assert/strict";
import test from "node:test";
import { pickPreviewUrl, resolvePreviewUrl } from "./preview-match.ts";

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

test("resolvePreviewUrl prefers a Spotify https preview", async () => {
  const url = await resolvePreviewUrl({
    artist: "M83",
    title: "Midnight City",
    preview_url: "https://p.scdn.co/mp3-preview/abc",
  });
  assert.equal(url, "https://p.scdn.co/mp3-preview/abc");
});

test("resolvePreviewUrl falls back to iTunes Search when Spotify has no clip", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({
        results: [
          {
            trackName: "Midnight City",
            artistName: "M83",
            previewUrl: "https://audio-ssl.itunes.apple.com/midnight.m4a",
          },
        ],
      }),
      { status: 200 },
    )) as typeof fetch;
  try {
    const url = await resolvePreviewUrl({
      artist: "M83",
      title: "Midnight City",
      preview_url: null,
    });
    assert.equal(url, "https://audio-ssl.itunes.apple.com/midnight.m4a");
  } finally {
    globalThis.fetch = original;
  }
});

test("resolvePreviewUrl returns null when iTunes has no matching preview", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ results: [] }), { status: 200 })) as typeof fetch;
  try {
    const url = await resolvePreviewUrl({
      artist: "M83",
      title: "Midnight City",
      preview_url: "  ",
    });
    assert.equal(url, null);
  } finally {
    globalThis.fetch = original;
  }
});
