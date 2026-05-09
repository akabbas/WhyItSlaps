import { spawn } from "child_process";

function runFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("ffmpeg", args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    child.stderr?.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited ${code}: ${stderr.slice(-1800)}`));
    });
    child.on("error", reject);
  });
}

/** True if at least one audio stream exists (ffprobe). */
export async function fileHasAudioStream(inputPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn(
      "ffprobe",
      [
        "-v",
        "error",
        "-select_streams",
        "a",
        "-show_entries",
        "stream=index",
        "-of",
        "csv=p=0",
        inputPath,
      ],
      { stdio: ["ignore", "pipe", "pipe"] },
    );
    let out = "";
    child.stdout?.on("data", (c) => {
      out += c.toString();
    });
    child.on("close", () => {
      resolve(out.trim().length > 0);
    });
    child.on("error", () => resolve(false));
  });
}

/**
 * Re-encode to H.264 + AAC in MP4 with faststart — plays in QuickTime / iOS Photos
 * (Instagram and others often serve VP9/AV1/HEVC that QuickTime rejects).
 */
export async function transcodeToQuickTimeMp4(inputPath: string, outputPath: string): Promise<void> {
  const hasAudio = await fileHasAudioStream(inputPath);

  const args: string[] = [
    "-y",
    "-i",
    inputPath,
    "-map",
    "0:v:0",
    "-c:v",
    "libx264",
    "-profile:v",
    "main",
    "-pix_fmt",
    "yuv420p",
    "-preset",
    "fast",
    "-crf",
    "23",
  ];

  if (hasAudio) {
    args.push("-map", "0:a:0", "-c:a", "aac", "-b:a", "128k", "-ac", "2");
  } else {
    args.push("-an");
  }

  args.push("-movflags", "+faststart", outputPath);

  await runFfmpeg(args);
}
