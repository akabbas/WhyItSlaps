import { NextResponse } from "next/server";
import { mkdir, rm, writeFile } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

import { analyzeStillWithClaude, type StillImageMedia } from "@/lib/claude-still";
import { paletteFromMiddleFrame } from "@/lib/palette";
import type { PaletteSwatch } from "@/types/analysis";
import type { StillAnalyzeErrorBody, StillAnalyzeSuccess } from "@/types/still-analysis";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const MAX_FILE_BYTES = 8 * 1024 * 1024;

const MEDIA_BY_EXT: Record<string, StillImageMedia> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

function fail(error: string, status: number, hint?: string): NextResponse {
  const body: StillAnalyzeErrorBody = { ok: false, error, ...(hint ? { hint } : {}) };
  return NextResponse.json(body, { status });
}

function mediaTypeFor(file: File): StillImageMedia | null {
  const type = file.type.toLowerCase();
  if (type === "image/jpeg" || type === "image/png" || type === "image/webp" || type === "image/gif") {
    return type;
  }
  const dot = file.name.toLowerCase().match(/\.[a-z0-9]+$/)?.[0] ?? "";
  return MEDIA_BY_EXT[dot] ?? null;
}

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail("Malformed multipart body.", 400);
  }

  const image = form.get("image");
  if (!(image instanceof File)) {
    return fail('Expected multipart field "image" with a file.', 400);
  }

  const mediaType = mediaTypeFor(image);
  if (!mediaType) {
    return fail("Use a JPEG, PNG, WebP, or GIF.", 400);
  }

  if (image.size <= 0) return fail("That file is empty.", 400);
  if (image.size > MAX_FILE_BYTES) return fail("Picture exceeds the 8 MB limit.", 413);

  const ext = mediaType === "image/jpeg" ? "jpg" : mediaType === "image/png" ? "png" : mediaType === "image/webp" ? "webp" : "gif";
  const workDir = join("/tmp", `vc-still-${uuidv4()}`);
  const imagePath = join(workDir, `source.${ext}`);

  try {
    await mkdir(workDir, { recursive: true });
    const buf = Buffer.from(await image.arrayBuffer());
    await writeFile(imagePath, buf);

    let palette: PaletteSwatch[] = [];
    try {
      palette = await paletteFromMiddleFrame([imagePath]);
    } catch {
      palette = [];
    }

    const claude = await analyzeStillWithClaude(buf.toString("base64"), mediaType);
    const body: StillAnalyzeSuccess = { ok: true, claude, palette };
    return NextResponse.json(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Still analysis failed.";
    const missingKey = /ANTHROPIC_API_KEY/i.test(message);
    return fail(message, missingKey ? 500 : 502, missingKey ? undefined : "Try the picture again.");
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => undefined);
  }
}
