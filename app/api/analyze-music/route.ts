import { NextResponse } from "next/server";
import { extractSpotifyTrackId, fetchSpotifyTrackData } from "@/lib/spotify";
import { analyzeMusicWithClaude } from "@/lib/claude-music";
import type { MusicAnalyzeSuccess, MusicAnalyzeErrorBody } from "@/types/music-analysis";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { url?: string } = {};
  try {
    body = (await req.json()) as { url?: string };
  } catch {
    return NextResponse.json(
      { ok: false, error: "Malformed JSON." } satisfies MusicAnalyzeErrorBody,
      { status: 400 },
    );
  }

  const urlRaw = typeof body.url === "string" ? body.url.trim() : "";
  if (!urlRaw) {
    return NextResponse.json(
      { ok: false, error: "Provide a Spotify track URL.", stage: "url" } satisfies MusicAnalyzeErrorBody,
      { status: 400 },
    );
  }

  const trackId = extractSpotifyTrackId(urlRaw);
  if (!trackId) {
    return NextResponse.json(
      {
        ok: false,
        error: "That URL doesn't look like a Spotify track link. Paste an open.spotify.com/track/... URL.",
        stage: "url",
      } satisfies MusicAnalyzeErrorBody,
      { status: 400 },
    );
  }

  let track, features;
  try {
    ({ track, features } = await fetchSpotifyTrackData(trackId));
  } catch (err) {
    const hint = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        ok: false,
        error: "Could not fetch track data from Spotify.",
        hint,
        stage: "spotify",
      } satisfies MusicAnalyzeErrorBody,
      { status: 502 },
    );
  }

  let claude;
  try {
    claude = await analyzeMusicWithClaude(track, features);
  } catch (err) {
    const hint = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        ok: false,
        error: "Claude could not analyze the track.",
        hint,
        stage: "claude",
        retrySuggested: true,
      } satisfies MusicAnalyzeErrorBody,
      { status: 502 },
    );
  }

  const payload: MusicAnalyzeSuccess = { ok: true, track, features, claude };
  return NextResponse.json(payload, { status: 200 });
}
