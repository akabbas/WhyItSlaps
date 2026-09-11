import { mkdir, readFile, rm, writeFile } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";
import { NextResponse } from "next/server";

import { extractIdentifyAudioSample, probeVideoDurationSeconds } from "@/lib/frames";
import { identifyAudioBuffer } from "@/lib/music";
import type { IdentifyAudioErrorBody, IdentifyAudioSuccess } from "@/types/identify-audio";

export const runtime = "nodejs";
export const maxDuration = 120;
export const dynamic = "force-dynamic";

const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MAX_VIDEO_SECONDS = 60;
const IDENTIFY_SAMPLE_SECONDS = 15;

function isVideoFile(file: File): boolean {
  if (file.type.startsWith("video/")) return true;
  return /\.(mp4|mov|webm|m4v)$/i.test(file.name);
}

function isAudioFile(file: File): boolean {
  if (file.type.startsWith("audio/")) return true;
  return /\.(mp3|m4a|wav|aac|ogg|flac)$/i.test(file.name);
}

export async function POST(req: Request) {
  const hasAcr =
    !!process.env.ACRCLOUD_HOST?.trim() &&
    !!process.env.ACRCLOUD_ACCESS_KEY?.trim() &&
    !!process.env.ACRCLOUD_ACCESS_SECRET?.trim();

  if (!hasAcr) {
    return NextResponse.json(
      {
        ok: false,
        error: "Music scan is not configured on this server.",
        hint: "Set ACRCLOUD_HOST, ACRCLOUD_ACCESS_KEY, and ACRCLOUD_ACCESS_SECRET.",
        stage: "config",
      } satisfies IdentifyAudioErrorBody,
      { status: 503 },
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Malformed multipart body.", stage: "upload" } satisfies IdentifyAudioErrorBody,
      { status: 400 },
    );
  }

  const clip = form.get("clip") ?? form.get("audio") ?? form.get("video");
  if (!(clip instanceof File)) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Expected multipart field "clip" (audio or short video).',
        stage: "upload",
      } satisfies IdentifyAudioErrorBody,
      { status: 400 },
    );
  }

  if (clip.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { ok: false, error: "File exceeds the 25 MB limit.", stage: "upload" } satisfies IdentifyAudioErrorBody,
      { status: 413 },
    );
  }

  if (!isVideoFile(clip) && !isAudioFile(clip)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Upload an audio file or a short video clip.",
        hint: "mp3, m4a, wav, mp4, mov, webm",
        stage: "upload",
      } satisfies IdentifyAudioErrorBody,
      { status: 400 },
    );
  }

  const runId = uuidv4();
  const workDir = join("/tmp", `vc-identify-${runId}`);
  const sourcePath = join(workDir, clip.name.replace(/[^\w.\-()+]/g, "_") || "source.bin");
  const audioPath = join(workDir, "identify.mp3");

  try {
    await mkdir(workDir, { recursive: true });
    await writeFile(sourcePath, Buffer.from(await clip.arrayBuffer()));

    if (isVideoFile(clip)) {
      let durationSeconds = 0;
      try {
        durationSeconds = await probeVideoDurationSeconds(sourcePath);
      } catch {
        return NextResponse.json(
          {
            ok: false,
            error: "Could not read clip duration.",
            stage: "extract",
          } satisfies IdentifyAudioErrorBody,
          { status: 422 },
        );
      }
      if (durationSeconds > MAX_VIDEO_SECONDS) {
        return NextResponse.json(
          {
            ok: false,
            error: `Clip is longer than ${MAX_VIDEO_SECONDS}s.`,
            hint: "Trim or upload a shorter sample.",
            stage: "extract",
          } satisfies IdentifyAudioErrorBody,
          { status: 422 },
        );
      }
      await extractIdentifyAudioSample(sourcePath, audioPath, IDENTIFY_SAMPLE_SECONDS);
    } else {
      await extractIdentifyAudioSample(sourcePath, audioPath, IDENTIFY_SAMPLE_SECONDS);
    }

    const sample = await readFile(audioPath);
    const match = await identifyAudioBuffer(sample);

    if (!match?.title && !match?.artist) {
      return NextResponse.json(
        {
          ok: false,
          error: "No confident match for this sample.",
          hint: "Try a louder 10–15s section with less background noise, or a known commercial recording.",
          stage: "identify",
          retrySuggested: true,
        } satisfies IdentifyAudioErrorBody,
        { status: 404 },
      );
    }

    const spotify_url = match.spotify_id
      ? `https://open.spotify.com/track/${match.spotify_id}`
      : null;

    return NextResponse.json(
      { ok: true, match, spotify_url } satisfies IdentifyAudioSuccess,
      { status: 200 },
    );
  } catch (err) {
    const hint = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        ok: false,
        error: "Could not scan audio.",
        hint,
        stage: "extract",
        retrySuggested: true,
      } satisfies IdentifyAudioErrorBody,
      { status: 502 },
    );
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => undefined);
  }
}
