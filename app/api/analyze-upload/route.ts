import { mkdir, rm, writeFile } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";
import { NextResponse } from "next/server";

import { extractArtifacts, framesToBase64Jpegs, probeVideoDurationSeconds } from "@/lib/frames";
import { analyzeMusic } from "@/lib/music";
import { paletteFromMiddleFrame } from "@/lib/palette";
import { analyzeWithClaude } from "@/lib/claude";
import { keepAliveNdjsonResponse, type AnalyzeWorkResult } from "@/lib/ndjsonKeepAlive";
import { publicFailure } from "@/lib/public-error";
import { rateLimitResponse } from "@/lib/http-rate-limit";
import type { AnalyzeErrorBody, AnalyzeSuccess, PaletteSwatch } from "@/types/analysis";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

const MAX_FILE_BYTES = 100 * 1024 * 1024;
const MAX_DURATION_SECONDS = 60;
const MULTIPART_LENGTH_SLACK = 1024 * 1024;

function isVideoUpload(file: File): boolean {
  if (file.type.startsWith("video/")) return true;
  return /\.(mp4|mov|webm|m4v)$/i.test(file.name);
}

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
  const limited = rateLimitResponse(req, "analyze-upload");
  if (limited) return limited;

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

  if (!isVideoUpload(video)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Upload a video file.",
        hint: "mp4, mov, webm",
      } satisfies AnalyzeErrorBody,
      { status: 400 },
    );
  }

  const buf = Buffer.from(await video.arrayBuffer());

  return keepAliveNdjsonResponse(async (): Promise<AnalyzeWorkResult> => {
    const runId = uuidv4();
    const workDir = join("/tmp", `vc-upload-${runId}`);
    const videoPath = join(workDir, "source.mp4");

    try {
      await mkdir(workDir, { recursive: true });
      await writeFile(videoPath, buf);

      let durationSeconds = 0;
      try {
        durationSeconds = await probeVideoDurationSeconds(videoPath);
      } catch (err) {
        return {
          status: 422,
          body: {
            ok: false,
            ...publicFailure(err, "Could not read the uploaded clip duration."),
            stage: "frames",
          } satisfies AnalyzeErrorBody,
        };
      }

      if (durationSeconds > MAX_DURATION_SECONDS) {
        return {
          status: 422,
          body: {
            ok: false,
            error:
              "This clip is over 60 seconds — WhyItSlaps only analyzes clips under 1 minute. Grab a shorter cut and try again.",
            stage: "frames",
          } satisfies AnalyzeErrorBody,
        };
      }

      let frames: string[] = [];
      let audioPath = join(workDir, "audio.mp3");

      try {
        const artifact = await extractArtifacts(videoPath, workDir);
        durationSeconds = artifact.durationSeconds;
        frames = artifact.framePaths;
        audioPath = artifact.audioPath;
      } catch (err) {
        return {
          status: 422,
          body: {
            ok: false,
            ...publicFailure(err, "Could not decode the uploaded clip."),
            stage: "frames",
          } satisfies AnalyzeErrorBody,
        };
      }

      if (!frames.length) {
        return {
          status: 422,
          body: {
            ok: false,
            error: "No keyframes extracted — clip may be unreadable.",
            stage: "frames",
          } satisfies AnalyzeErrorBody,
        };
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
        return {
          status: 422,
          body: {
            ok: false,
            ...publicFailure(err, "Could not prepare frames for analysis."),
            stage: "palette",
          } satisfies AnalyzeErrorBody,
        };
      }

      let claudePayload;
      try {
        claudePayload = await analyzeWithClaude(thumbs);
      } catch (err) {
        return {
          status: 502,
          body: {
            ok: false,
            ...publicFailure(err, "Vision analysis could not be completed."),
            stage: "claude",
            retrySuggested: true,
          } satisfies AnalyzeErrorBody,
        };
      }

      const payload: AnalyzeSuccess = {
        ok: true,
        claude: claudePayload,
        music,
        palette,
        keyframe_count: frames.length,
        video_duration_seconds: Number(durationSeconds.toFixed(2)),
      };

      return { status: 200, body: payload };
    } catch (err) {
      return {
        status: 422,
        body: {
          ok: false,
          ...publicFailure(err, "Could not save or process the upload."),
        } satisfies AnalyzeErrorBody,
      };
    } finally {
      await rm(workDir, { recursive: true, force: true }).catch(() => undefined);
    }
  });
}
