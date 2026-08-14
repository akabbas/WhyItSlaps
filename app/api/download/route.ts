import { mkdir, readFile, rm } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

import { NextResponse } from "next/server";

import { downloadVideo } from "@/lib/download";
import { transcodeToQuickTimeMp4 } from "@/lib/transcodeDownload";
import type { AnalyzeErrorBody } from "@/types/analysis";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

const ROOT_TMP = "/tmp";

function asciiFilename(name: string): string {
  return name.replace(/[^\w.\-()+]/g, "_").slice(0, 120) || "whyitslaps-clip.mp4";
}

/** Human-ish filename derived from hostname + suffix (still only ASCII for Content-Disposition). */
function deriveFilename(rawUrl: string): string {
  try {
    const host = new URL(rawUrl).hostname.replace(/^www\./, "").replace(/[^a-z0-9]/gi, "-");
    return asciiFilename(`${host || "video"}-${Date.now().toString(36)}.mp4`);
  } catch {
    return asciiFilename(`whyitslaps-${Date.now().toString(36)}.mp4`);
  }
}

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
  const workDir = join(ROOT_TMP, `vc-dl-${runId}`);
  const videoPath = join(workDir, "download.mp4");
  const quickTimePath = join(workDir, "quicktime.mp4");
  await mkdir(workDir, { recursive: true });

  try {
    await downloadVideo(urlRaw, videoPath);
    await transcodeToQuickTimeMp4(videoPath, quickTimePath);

    const buffer = await readFile(quickTimePath);
    const fname = deriveFilename(urlRaw);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "video/mp4",
        "Content-Length": String(buffer.byteLength),
        "Content-Disposition": `attachment; filename="${fname}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    const hintMsg =
      message.length && (message.includes("yt-dlp") || /http|403|blocked|sign in|private/i.test(message))
        ? message
        : message || undefined;

    return NextResponse.json(
      {
        ok: false,
        error:
          message.includes("Instagram") || /cookies|Instagram/i.test(message)
            ? "Could not fetch that Instagram reel from a link. Save the reel, then upload the file."
            : "Download blocked or URL unsupported.",
        hint: /instagram/i.test(message)
          ? "Save the reel to your device, then use Upload clip on the home page."
          : hintMsg,
        stage: "download",
      } satisfies AnalyzeErrorBody,
      { status: 422 },
    );
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}
