import { spawn } from "child_process";
import { mkdtemp, readFile, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { NextResponse } from "next/server";

import { publicFailure } from "@/lib/public-error";
import { rateLimitResponse } from "@/lib/http-rate-limit";
import {
  downloadPreviewBytes,
  resolveItunesPreviewUrl,
} from "@/lib/preview-match";
import { extractSpotifyTrackId, fetchSpotifyTrackData } from "@/lib/spotify";
import type { MusicAnalyzeErrorBody } from "@/types/music-analysis";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const NO_PREVIEW_BODY = {
  ok: false,
  error: "No ~30s preview clip for this track.",
  hint: "Spotify and iTunes both lack a preview. Open in Spotify for the full track. This save is never the whole song.",
  stage: "spotify",
} as const satisfies MusicAnalyzeErrorBody;

function asciiFilename(name: string): string {
  return name.replace(/[^\w.\-()+]/g, "_").slice(0, 120) || "whyitslaps-preview.mp3";
}

function previewFilename(artist: string, title: string): string {
  const base = `${artist}-${title}-preview`.replace(/\s+/g, "-");
  return asciiFilename(`${base}.mp3`);
}

function looksLikeMp3(buf: Buffer): boolean {
  if (buf.byteLength < 3) return false;
  if (buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33) return true;
  return buf[0] === 0xff && (buf[1]! & 0xe0) === 0xe0;
}

function runFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("ffmpeg", args, { stdio: ["ignore", "pipe", "pipe"] });
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited ${code}`));
    });
    child.on("error", reject);
  });
}

/** iTunes clips are usually AAC/M4A; client save path expects audio/mpeg. Cap at 35s so this never emits a full track. */
async function toMpegPreview(buffer: Buffer): Promise<Buffer | null> {
  if (looksLikeMp3(buffer)) return buffer;
  const dir = await mkdtemp(join(tmpdir(), "whyitslaps-preview-"));
  const input = join(dir, "preview.bin");
  const output = join(dir, "preview.mp3");
  try {
    await writeFile(input, buffer);
    await runFfmpeg([
      "-y",
      "-i",
      input,
      "-t",
      "35",
      "-codec:a",
      "libmp3lame",
      "-q:a",
      "4",
      output,
    ]);
    const out = await readFile(output);
    if (out.byteLength < 512) return null;
    return out;
  } catch {
    return null;
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

function mpegAttachment(buffer: Buffer, filename: string): NextResponse {
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Content-Length": String(buffer.byteLength),
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(req: Request) {
  const limited = rateLimitResponse(req, "download-music");
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
    return NextResponse.json(
      {
        ok: false,
        ...publicFailure(err, "Could not fetch track data from Spotify."),
        stage: "spotify",
      } satisfies MusicAnalyzeErrorBody,
      { status: 502 },
    );
  }

  const fname = previewFilename(track.artist, track.title);

  try {
    const spotifyPreview = track.preview_url?.trim();
    if (spotifyPreview && /^https:\/\//i.test(spotifyPreview)) {
      const spotifyAudio = await downloadPreviewBytes(spotifyPreview);
      if (spotifyAudio) {
        const mp3 = await toMpegPreview(spotifyAudio);
        if (mp3) return mpegAttachment(mp3, fname);
      }
    }

    const itunesUrl = await resolveItunesPreviewUrl(track.artist, track.title);
    if (itunesUrl) {
      const itunesAudio = await downloadPreviewBytes(itunesUrl);
      if (itunesAudio) {
        const mp3 = await toMpegPreview(itunesAudio);
        if (mp3) return mpegAttachment(mp3, fname);
        return NextResponse.json(
          {
            ok: false,
            error: "Could not package the preview as mp3.",
            hint: "Open in Spotify for the full track. This save is never the whole song.",
            stage: "spotify",
          } satisfies MusicAnalyzeErrorBody,
          { status: 502 },
        );
      }
    }

    return NextResponse.json(NO_PREVIEW_BODY, { status: 404 });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        ...publicFailure(err, "Preview download failed."),
        hint: "Open in Spotify for the full track. This save is never the whole song.",
        stage: "spotify",
      } satisfies MusicAnalyzeErrorBody,
      { status: 502 },
    );
  }
}
