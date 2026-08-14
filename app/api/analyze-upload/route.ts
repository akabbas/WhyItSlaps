import { NextResponse } from "next/server";
import { mkdir, rm, writeFile } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

import { extractArtifacts, framesToBase64Jpegs, probeVideoDurationSeconds } from "@/lib/frames";
import { analyzeMusic } from "@/lib/music";
import { paletteFromMiddleFrame } from "@/lib/palette";
import { analyzeWithClaude } from "@/lib/claude";
import type { AnalyzeSuccess, AnalyzeErrorBody, PaletteSwatch } from "@/types/analysis";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

const MAX_FILE_BYTES = 100 * 1024 * 1024;
/** Match URL-analyze yt-dlp --match-filter "duration <= 60". */
const MAX_DURATION_SECONDS = 60;
/** Extra slack for multipart boundaries and small fields when comparing Content-Length. */
const MULTIPART_LENGTH_SLACK = 1024 * 1024;

function payloadTooLarge(): NextResponse {
  return NextResponse.json(
    {
      ok: false,
      error: "Video file exceeds the 100 MB limit.",
    } satisfies AnalyzeErrorBody,
    { status: 413 },
  );
}

export async function POST(req: Request) {
  const contentLength = req.headers.get("content-length");
  if (contentLength) {
    const n = Number(contentLength);
    if (Number.isFinite(n) && n > MAX_FILE_BYTES + MULTIPART_LENGTH_SLACK) {
      return payloadTooLarge();
    }
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Malformed multipart body.",
        retrySuggested: false,
      } satisfies AnalyzeErrorBody,
      { status: 400 },
    );
  }

  const video = form.get("video");
  if (!(video instanceof File)) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Expected multipart field "video" with a file.',
      } satisfies AnalyzeErrorBody,
      { status: 400 },
    );
  }

  if (video.size > MAX_FILE_BYTES) {
    return payloadTooLarge();
  }

  const runId = uuidv4();
  const workDir = join("/tmp", `vc-upload-${runId}`);
  const videoPath = join(workDir, "source.mp4");

  try {
    await mkdir(workDir, { recursive: true });
    const buf = Buffer.from(await video.arrayBuffer());
    await writeFile(videoPath, buf);

    let durationSeconds = 0;
    try {
      durationSeconds = await probeVideoDurationSeconds(videoPath);
    } catch (err) {
      const hint = err instanceof Error ? err.message : String(err);
      return NextResponse.json(
        {
          ok: false,
          error: "Could not read the uploaded clip duration.",
          hint,
          stage: "frames",
        } satisfies AnalyzeErrorBody,
        { status: 422 },
      );
    }

    if (durationSeconds > MAX_DURATION_SECONDS) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "This clip is over 60 seconds — WhyItSlaps only analyzes clips under 1 minute. Grab a shorter cut and try again.",
          stage: "frames",
        } satisfies AnalyzeErrorBody,
        { status: 422 },
      );
    }

    let frames: string[] = [];
    let audioPath = join(workDir, "audio.mp3");

    try {
      const artifact = await extractArtifacts(videoPath, workDir);
      durationSeconds = artifact.durationSeconds;
      frames = artifact.framePaths;
      audioPath = artifact.audioPath;
    } catch (err) {
      const hint = err instanceof Error ? err.message : String(err);
      return NextResponse.json(
        {
          ok: false,
          error: "Could not decode the uploaded clip.",
          hint,
          stage: "frames",
        } satisfies AnalyzeErrorBody,
        { status: 422 },
      );
    }

    if (!frames.length) {
      return NextResponse.json(
        {
          ok: false,
          error: "No keyframes extracted — clip may be unreadable.",
          stage: "frames",
        } satisfies AnalyzeErrorBody,
        { status: 422 },
      );
    }

    let palette: PaletteSwatch[] = [];
    try {
      palette = await paletteFromMiddleFrame(frames);
    } catch {
      palette = [];
    }

    let music: Awaited<ReturnType<typeof analyzeMusic>> = null;
    try {
      music = await analyzeMusic(audioPath);
    } catch {
      music = null;
    }

    let thumbs: string[];
    try {
      thumbs = await framesToBase64Jpegs(frames, 14);
      if (!thumbs.length) throw new Error("empty_thumbs");
    } catch (err) {
      const hint = err instanceof Error ? err.message : String(err);
      return NextResponse.json(
        {
          ok: false,
          error: "Could not serialize keyframes for vision.",
          hint,
          stage: "palette",
        } satisfies AnalyzeErrorBody,
        { status: 422 },
      );
    }

    let claudePayload;
    try {
      claudePayload = await analyzeWithClaude(thumbs);
    } catch (err) {
      const hint = err instanceof Error ? err.message : String(err);
      return NextResponse.json(
        {
          ok: false,
          error: "Vision analysis could not be completed.",
          hint,
          stage: "claude",
          retrySuggested: true,
        } satisfies AnalyzeErrorBody,
        { status: 502 },
      );
    }

    const payload: AnalyzeSuccess = {
      ok: true,
      claude: claudePayload,
      music,
      palette,
      keyframe_count: frames.length,
      video_duration_seconds: Number(durationSeconds.toFixed(2)),
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        ok: false,
        error: "Could not save or process the upload.",
        hint: message || undefined,
      } satisfies AnalyzeErrorBody,
      { status: 422 },
    );
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => undefined);
  }
}
