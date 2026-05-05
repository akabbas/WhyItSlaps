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
      else reject(new Error(`${label} exited with code ${code}: ${stderr.slice(-2000)}`));
    });
    child.on("error", reject);
  });
}

function isInstagram(url: string): boolean {
  return /instagram\.com/i.test(url);
}

/**
 * Streams a remote video via yt-dlp. Max length enforced by yt-dlp --match-filter.
 * Output path should end with .mp4 (or yt-dlp will still merge to best container).
 */
export async function downloadVideo(url: string, outputMp4Path: string): Promise<void> {
  const baseArgs = [
    "--no-warnings",
    "--no-update",
    "-o",
    outputMp4Path,
    "--match-filter",
    "duration <= 60",
    "-f",
    "bv*[height<=720]+ba/b[height<=720]/b",
    "--merge-output-format",
    "mp4",
  ];

  if (isInstagram(url)) {
    // Try with Chrome cookies first (user must be logged into Instagram in Chrome)
    try {
      await run("yt-dlp", [...baseArgs, "--cookies-from-browser", "chrome", url], "yt-dlp");
      return;
    } catch {
      // Fall through to try Safari
    }
    try {
      await run("yt-dlp", [...baseArgs, "--cookies-from-browser", "safari", url], "yt-dlp");
      return;
    } catch (err) {
      throw new Error(
        `Instagram download requires you to be logged in. Make sure you're logged into Instagram in Chrome or Safari, then try again. Details: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  await run("yt-dlp", [...baseArgs, url], "yt-dlp");
}
