import { readFile } from "fs/promises";
import crypto from "crypto";

import type { MusicMatch } from "@/types/analysis";

const IDENTIFY_PATH = "/v1/identify";
const HTTP_METHOD = "POST";

function resolveIdentifyUrl(hostRaw: string): string | null {
  const trimmed = hostRaw.replace(/^https?:\/\//i, "").replace(/\/+$/, "").trim();
  if (!trimmed) return null;
  return `https://${trimmed}${IDENTIFY_PATH}`;
}

/** HMAC-SHA1 signature per ACRCloud Identify Protocol v1 */
function signRequest(accessKey: string, accessSecret: string, dataType: string, timestampUnixSeconds: number): string {
  const signatureVersion = "1";
  const timestampStr = String(timestampUnixSeconds);
  const stringToSign = `${HTTP_METHOD}\n${IDENTIFY_PATH}\n${accessKey}\n${dataType}\n${signatureVersion}\n${timestampStr}`;
  return crypto.createHmac("sha1", accessSecret).update(stringToSign, "utf8").digest("base64");
}

/** Parse first track slot from Identify API `metadata` (object with `music` array or legacy top-level array). */
function tracksFromMetadata(metadata: unknown): Record<string, unknown>[] | undefined {
  if (!metadata || typeof metadata !== "object") return undefined;
  const m = metadata as Record<string, unknown>;
  if (Array.isArray(m.music) && m.music.length) return m.music as Record<string, unknown>[];
  if (Array.isArray(metadata)) return metadata as Record<string, unknown>[];
  return undefined;
}

function pickArtists(track: Record<string, unknown>): string | null {
  const raw = track.artists;
  if (Array.isArray(raw)) {
    const names = raw
      .map((a) => (typeof (a as { name?: unknown }).name === "string" ? String((a as { name: string }).name).trim() : ""))
      .filter(Boolean);
    return names.length ? names.join(", ") : null;
  }
  if (typeof raw === "string") return raw.trim() || null;
  if (typeof track.artists_names === "string") return track.artists_names.trim() || null;
  return null;
}

function pickTitle(track: Record<string, unknown>): string | null {
  if (typeof track.title === "string" && track.title.trim()) return track.title.trim();
  if (typeof track.music_name === "string" && track.music_name.trim()) return track.music_name.trim();
  return null;
}

function pickAlbum(track: Record<string, unknown>): string | null {
  const alb = track.album;
  if (alb && typeof alb === "object" && alb !== null) {
    const name = (alb as { name?: unknown }).name;
    if (typeof name === "string" && name.trim()) return name.trim();
  }
  if (typeof track.album_name === "string" && track.album_name.trim()) return track.album_name.trim();
  return null;
}

function pickGenres(track: Record<string, unknown>): string[] {
  const out: string[] = [];
  if (typeof track.genre === "string") out.push(track.genre.trim());
  if (Array.isArray(track.genres)) {
    for (const g of track.genres) {
      if (typeof g === "string") out.push(g.trim());
      else if (g && typeof g === "object" && typeof (g as { name?: unknown }).name === "string") out.push(String((g as { name: string }).name).trim());
    }
  } else if (typeof track.genres === "string") {
    out.push(...track.genres.split(/[,\\/]/).map((x) => x.trim()).filter(Boolean));
  }
  return Array.from(new Set(out.filter(Boolean)));
}

function pickBpm(track: Record<string, unknown>): number | null {
  const candidates = [track.bpm, track.music_bpm, track.music_tempo];
  for (const c of candidates) {
    if (typeof c === "number" && Number.isFinite(c)) return c;
    if (typeof c === "string") {
      const n = Number.parseFloat(c.replace(/,/g, "."));
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
}

function pickSpotifyId(track: Record<string, unknown>): string | null {
  const ext = track.external_metadata;
  if (!ext || typeof ext !== "object") return null;
  const spotify = (ext as Record<string, unknown>).spotify;
  if (!spotify || typeof spotify !== "object") return null;
  const sid = ((spotify as { track?: { id?: unknown } }).track)?.id;
  return typeof sid === "string" && sid.trim() ? sid.trim() : null;
}

function parseMatchFromResponse(json: Record<string, unknown>): MusicMatch | null {
  const status = json.status;
  let code: number | null = null;
  if (typeof status === "number") code = status;
  else if (status && typeof status === "object" && "code" in status && typeof (status as { code: unknown }).code === "number") {
    code = (status as { code: number }).code;
  }
  if (code !== 0) return null;

  const tracks = tracksFromMetadata(json.metadata);
  const first = tracks?.[0];
  if (!first) return null;

  const confidence =
    typeof first.score === "number" && Number.isFinite(first.score)
      ? first.score
      : typeof first.accuracy === "number" && Number.isFinite(first.accuracy)
        ? first.accuracy
        : null;

  return {
    title: pickTitle(first),
    artist: pickArtists(first),
    album: pickAlbum(first),
    genres: pickGenres(first),
    bpm: pickBpm(first),
    spotify_id: pickSpotifyId(first),
    confidence,
  };
}

/**
 * Sends an MP3 (or compatible) sample to ACRCloud Identify (multipart/form-data).
 * Uses HMAC-SHA1 signing via Node crypto. Returns structured match fields or null.
 */
export async function analyzeMusic(audioPath: string): Promise<MusicMatch | null> {
  const hostRaw = process.env.ACRCLOUD_HOST?.trim() ?? "";
  const accessKey = process.env.ACRCLOUD_ACCESS_KEY?.trim();
  const accessSecret = process.env.ACRCLOUD_ACCESS_SECRET?.trim();

  if (!hostRaw || !accessKey || !accessSecret) return null;

  const url = resolveIdentifyUrl(hostRaw);
  if (!url) return null;

  const audioBuffer = await readFile(audioPath).catch(() => null);
  if (!audioBuffer?.length) return null;

  const dataType = "audio";
  const signatureVersion = "1";
  const timestampUnixSeconds = Math.floor(Date.now() / 1000);
  const signature = signRequest(accessKey, accessSecret, dataType, timestampUnixSeconds);

  const form = new FormData();
  form.append("sample", new Blob([audioBuffer], { type: "audio/mpeg" }), "sample.mp3");
  form.append("access_key", accessKey);
  form.append("sample_bytes", String(audioBuffer.byteLength));
  form.append("timestamp", String(timestampUnixSeconds));
  form.append("signature", signature);
  form.append("data_type", dataType);
  form.append("signature_version", signatureVersion);

  try {
    const res = await fetch(url, { method: "POST", body: form });
    if (!res.ok) return null;
    const json = (await res.json()) as Record<string, unknown>;
    return parseMatchFromResponse(json);
  } catch {
    return null;
  }
}
