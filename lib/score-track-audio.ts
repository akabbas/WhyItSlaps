import { mkdtemp, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import type { MusicAnalysisScores, SpotifyTrack } from "@/types/music-analysis";
import { decodeAudioFileToPcm } from "./decode-audio";
import { downloadPreviewBytes, resolvePreviewUrl } from "./preview-match";
import { scoreFromPcm } from "./sonic-scores";

/**
 * Measure sonic scores from this track's own preview audio.
 * Spotify's preview is used when the label provided one. Otherwise the
 * matching Apple preview is used. Returns null when no audio can be read.
 */
export async function scoreTrackAudio(track: SpotifyTrack): Promise<MusicAnalysisScores | null> {
  const previewUrl = await resolvePreviewUrl(track);
  if (!previewUrl) return null;

  const audio = await downloadPreviewBytes(previewUrl);
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
