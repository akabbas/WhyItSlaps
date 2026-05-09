import { NextResponse } from "next/server";
import { mkdir, rm } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

import { downloadVideo } from "@/lib/download";
import { extractArtifacts, framesToBase64Jpegs } from "@/lib/frames";
import { analyzeMusic } from "@/lib/music";
import { paletteFromMiddleFrame } from "@/lib/palette";
import { analyzeWithClaude } from "@/lib/claude";
import type { AnalyzeSuccess, AnalyzeErrorBody, PaletteSwatch } from "@/types/analysis";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

/** Local temp workspace (macOS/Linux). yt-dlp + ffmpeg artifacts land here — deleted after respond. */
const ROOT_TMP = "/tmp";

export async function POST(req: Request) {
  let body: { url?: string } = {};

  try {
    body = (await req.json()) as { url?: string };
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Malformed JSON.",
        retrySuggested: false,
      } satisfies AnalyzeErrorBody,
      { status: 400 },
    );
  }

  const urlRaw = typeof body.url === "string" ? body.url.trim() : "";
  if (!urlRaw || !/^https?:\/\//i.test(urlRaw)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Provide a valid HTTP(S) link.",
      } satisfies AnalyzeErrorBody,
      { status: 400 },
    );
  }

  const runId = uuidv4();
  const workDir = join(ROOT_TMP, `vc-${runId}`);
  const videoPath = join(workDir, "source.mp4");

  await mkdir(workDir, { recursive: true });

  try {
    await downloadVideo(urlRaw, videoPath);

    let durationSeconds = 0;
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
          error: "Could not decode the downloaded clip.",
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
        error:
          message.includes("Instagram download requires")
            ? message.split("Details:")[0].trim()
            : message.length && (message.includes("yt-dlp") || /http|403|blocked|sign in|private/i.test(message))
              ? "Download blocked or URL unsupported — try another public clip."
              : "Download failed.",
        hint: message || undefined,
        stage: "download",
      } satisfies AnalyzeErrorBody,
      { status: 422 },
    );
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => undefined);
  }
}
