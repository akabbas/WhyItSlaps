import { NextResponse } from "next/server";
import { extractSpotifyTrackId, fetchSpotifyAudioAnalysis, fetchSpotifyTrackData } from "@/lib/spotify";
import { analyzeMusicWithClaude } from "@/lib/claude-music";
import { publicFailure } from "@/lib/public-error";
import { rateLimitResponse } from "@/lib/http-rate-limit";
import { keepAliveNdjsonResponse } from "@/lib/ndjsonKeepAlive";
import { scoreTrackAudio } from "@/lib/score-track-audio";
import { blendSonicScores, scoreFromCatalogSignals } from "@/lib/sonic-scores";
import type { MusicAnalyzeSuccess, MusicAnalyzeErrorBody } from "@/types/music-analysis";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const limited = rateLimitResponse(req, "analyze-music");
  if (limited) return limited;

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

  return keepAliveNdjsonResponse<MusicAnalyzeSuccess | MusicAnalyzeErrorBody>(async (report) => {
    report("fetch");
    let track, features;
    try {
      ({ track, features } = await fetchSpotifyTrackData(trackId));
    } catch (err) {
      return {
        status: 502,
        body: {
          ok: false,
          ...publicFailure(err, "Could not fetch track data from Spotify."),
          stage: "spotify",
        } satisfies MusicAnalyzeErrorBody,
      };
    }

    report("catalog");
    const [previewScores, analysis] = await Promise.all([
      scoreTrackAudio(track).catch(() => null),
      fetchSpotifyAudioAnalysis(trackId),
    ]);
    const scores = blendSonicScores(scoreFromCatalogSignals(features, analysis), previewScores);

    report("critique");
    let claude;
    try {
      claude = await analyzeMusicWithClaude(track, features, scores, analysis);
    } catch (err) {
      return {
        status: 502,
        body: {
          ok: false,
          ...publicFailure(err, "Claude could not analyze the track."),
          stage: "claude",
          retrySuggested: true,
        } satisfies MusicAnalyzeErrorBody,
      };
    }

    const payload: MusicAnalyzeSuccess = { ok: true, track, features, analysis: analysis ?? null, claude };
    return { status: 200, body: payload };
  });
}
