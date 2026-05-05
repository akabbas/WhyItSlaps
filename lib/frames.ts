import { mkdir, readdir, readFile } from "fs/promises";
import { join } from "path";
import { spawn } from "child_process";

function run(command: string, args: string[], label: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    child.stderr?.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${label} exited with code ${code}: ${stderr.slice(-1500)}`));
    });
    child.on("error", reject);
  });
}

async function probeDurationSeconds(videoPath: string): Promise<number> {
  const args = [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    videoPath,
  ];
  return await new Promise((resolve, reject) => {
    const child = spawn("ffprobe", args, { stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    let err = "";
    child.stdout?.on("data", (c) => (out += c.toString()));
    child.stderr?.on("data", (c) => (err += c.toString()));
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`ffprobe failed: ${err}`));
        return;
      }
      const parsed = Number.parseFloat(out.trim());
      if (!Number.isFinite(parsed)) reject(new Error("Could not parse video duration."));
      else resolve(parsed);
    });
    child.on("error", reject);
  });
}

/**
 * Writes JPEG keyframes every 4s under framesDir/frame_%03d.jpg and trims first 10s audio to mp3.
 */
export async function extractArtifacts(
  videoPath: string,
  workDir: string,
): Promise<{ framesDir: string; audioPath: string; durationSeconds: number; framePaths: string[] }> {
  const framesDir = join(workDir, "frames");
  await mkdir(framesDir, { recursive: true });

  const framePattern = join(framesDir, "frame_%03d.jpg");

  await run("ffmpeg", ["-y", "-i", videoPath, "-vf", "fps=1/4", framePattern], "ffmpeg-keyframes");

  const audioPath = join(workDir, "audio.mp3");
  await run(
    "ffmpeg",
    ["-y", "-i", videoPath, "-t", "10", "-vn", "-codec:a", "libmp3lame", "-q:a", "4", audioPath],
    "ffmpeg-audio",
  );

  const durationSeconds = await probeDurationSeconds(videoPath);

  const files = await readdir(framesDir);
  const framePaths = files
    .filter((n) => n.startsWith("frame_") && n.endsWith(".jpg"))
    .sort()
    .map((n) => join(framesDir, n));

  return { framesDir, audioPath, durationSeconds, framePaths };
}

export async function framesToBase64Jpegs(paths: string[], maxFrames = 16): Promise<string[]> {
  const step = paths.length <= maxFrames ? 1 : Math.ceil(paths.length / maxFrames);
  const subset: string[] = [];
  for (let i = 0; i < paths.length; i += step) subset.push(paths[i]);
  const buffers = await Promise.all(subset.map((p) => readFile(p)));
  return buffers.map((b) => Buffer.from(b).toString("base64"));
}
