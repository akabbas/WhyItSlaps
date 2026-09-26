import { mkdtemp, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import type { MusicAnalysisScores, SpotifyTrack } from "@/types/music-analysis";
import { decodeAudioFileToPcm } from "./decode-audio";
import { pickPreviewUrl, type PreviewCandidate } from "./preview-match";
import { scoreFromPcm } from "./sonic-scores";

const MAX_PREVIEW_BYTES = 8 * 1024 * 1024;

async function fetchItunesPreviews(artist: string, title: string): Promise<PreviewCandidate[]> {
  const term = encodeURIComponent(`${artist} ${title}`.slice(0, 180));
  const response = await fetch(
    `https://itunes.apple.com/search?term=${term}&media=music&entity=song&limit=8`,
    { cache: "no-store", signal: AbortSignal.timeout(12_000) },
  );
  if (!response.ok) return [];
  const body = (await response.json()) as { results?: PreviewCandidate[] };
  return Array.isArray(body.results) ? body.results : [];
}

async function resolvePreviewUrl(track: SpotifyTrack): Promise<string | null> {
  const spotifyPreview = track.preview_url?.trim();
  if (spotifyPreview && /^https:\/\//i.test(spotifyPreview)) return spotifyPreview;
  try {
    const results = await fetchItunesPreviews(track.artist, track.title);
    return pickPreviewUrl(track.artist, track.title, results);
  } catch {
    return null;
  }
}

async function downloadPreview(url: string): Promise<Buffer | null> {
  const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(15_000) });
  if (!response.ok) return null;
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.byteLength < 512 || buffer.byteLength > MAX_PREVIEW_BYTES) return null;
  return buffer;
}

/**
 * Measure sonic scores from this track's own preview audio.
 * Spotify's preview is used when the label provided one. Otherwise the
 * matching Apple preview is used. Returns null when no audio can be read.
 */
export async function scoreTrackAudio(track: SpotifyTrack): Promise<MusicAnalysisScores | null> {
  const previewUrl = await resolvePreviewUrl(track);
  if (!previewUrl) return null;

  const audio = await downloadPreview(previewUrl);
  if (!audio) return null;

  const dir = await mkdtemp(join(tmpdir(), "whyitslaps-score-"));
  const filePath = join(dir, "preview.bin");
  try {
    await writeFile(filePath, audio);
    const decoded = await decodeAudioFileToPcm(filePath);
    if (!decoded) return null;
    return scoreFromPcm(decoded.samples, decoded.sampleRate);
  } catch {
    return null;
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
