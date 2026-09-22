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

/** Hosts yt-dlp is allowed to fetch (blocks open-proxy / SSRF abuse). */
const ALLOWED_VIDEO_HOST_SUFFIXES = [
  "youtube.com",
  "youtu.be",
  "tiktok.com",
  "instagram.com",
  "twitter.com",
  "x.com",
] as const;

/**
 * Reject non-allowlisted URLs before spawning yt-dlp.
 * Throws a user-facing Error on failure.
 */
export function assertAllowedVideoUrl(raw: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(raw.trim());
  } catch {
    throw new Error("Paste a full https link first.");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only http(s) video links are supported.");
  }
  const host = parsed.hostname.replace(/^www\./i, "").toLowerCase();
  const ok = ALLOWED_VIDEO_HOST_SUFFIXES.some(
    (suffix) => host === suffix || host.endsWith(`.${suffix}`),
  );
  if (!ok) {
    throw new Error(
      "That site is not supported. Use YouTube, TikTok, Instagram, or X (Twitter) links — or Upload clip.",
    );
  }
  return parsed;
}

/**
 * Streams a remote video via yt-dlp. Max length enforced by yt-dlp --match-filter.
 * Output path should end with .mp4 (or yt-dlp will still merge to best container).
 */
export async function downloadVideo(url: string, outputMp4Path: string): Promise<void> {
  assertAllowedVideoUrl(url);

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
    // Local-only cookie fallback; cloud hosts usually cannot authenticate to Meta.
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
        `Instagram URL paste often fails in the cloud. Save the reel to your device, then upload the file here. Details: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  await run("yt-dlp", [...baseArgs, url], "yt-dlp");
}
