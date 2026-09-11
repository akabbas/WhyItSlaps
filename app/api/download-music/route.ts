import { NextResponse } from "next/server";

import { extractSpotifyTrackId, fetchSpotifyTrackData } from "@/lib/spotify";
import type { MusicAnalyzeErrorBody } from "@/types/music-analysis";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

function asciiFilename(name: string): string {
  return name.replace(/[^\w.\-()+]/g, "_").slice(0, 120) || "whyitslaps-preview.mp3";
}

function previewFilename(artist: string, title: string): string {
  const base = `${artist}-${title}-preview`.replace(/\s+/g, "-");
  return asciiFilename(`${base}.mp3`);
}

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
        error: "That URL doesn't look like a Spotify track link.",
        stage: "url",
      } satisfies MusicAnalyzeErrorBody,
      { status: 400 },
    );
  }

  let track;
  try {
    ({ track } = await fetchSpotifyTrackData(trackId));
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

  const previewUrl = track.preview_url?.trim();
  if (!previewUrl) {
    return NextResponse.json(
      {
        ok: false,
        error: "Spotify has no preview clip for this track.",
        hint: "Try another song or use Open in Spotify for the full track.",
        stage: "spotify",
      } satisfies MusicAnalyzeErrorBody,
      { status: 404 },
    );
  }

  try {
    const audioRes = await fetch(previewUrl, { cache: "no-store" });
    if (!audioRes.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: "Could not fetch the preview audio from Spotify.",
          stage: "spotify",
        } satisfies MusicAnalyzeErrorBody,
        { status: 502 },
      );
    }

    const buffer = Buffer.from(await audioRes.arrayBuffer());
    if (buffer.byteLength < 512) {
      return NextResponse.json(
        {
          ok: false,
          error: "Preview file from Spotify was too small to save.",
          stage: "spotify",
        } satisfies MusicAnalyzeErrorBody,
        { status: 502 },
      );
    }

    const fname = previewFilename(track.artist, track.title);
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(buffer.byteLength),
        "Content-Disposition": `attachment; filename="${fname}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const hint = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        ok: false,
        error: "Preview download failed.",
        hint,
        stage: "spotify",
      } satisfies MusicAnalyzeErrorBody,
      { status: 502 },
    );
  }
}
