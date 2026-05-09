import type { SpotifyTrack, SpotifyAudioFeatures } from "@/types/music-analysis";

const KEY_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function formatKey(key: number, mode: number): string {
  if (key < 0 || key > 11) return "Unknown";
  return `${KEY_NAMES[key]} ${mode === 1 ? "Major" : "Minor"}`;
}

export function extractSpotifyTrackId(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("spotify.com")) return null;
    const match = u.pathname.match(/\/track\/([a-zA-Z0-9]+)/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

async function getAccessToken(): Promise<string> {
  const clientId = process.env.SPOTIFY_CLIENT_ID?.trim();
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    throw new Error("Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET env vars.");
  }
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Spotify auth failed (${res.status}).`);
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

interface RawSpotifyTrack {
  name: string;
  duration_ms: number;
  explicit: boolean;
  artists: { name: string }[];
  album: {
    name: string;
    release_date: string;
    images: { url: string; width: number; height: number }[];
  };
  external_urls: { spotify: string };
}

interface RawAudioFeatures {
  tempo: number;
  key: number;
  mode: number;
  energy: number;
  danceability: number;
  valence: number;
  acousticness: number;
  instrumentalness: number;
  loudness: number;
  speechiness: number;
  time_signature: number;
}

export async function fetchSpotifyTrackData(
  trackId: string,
): Promise<{ track: SpotifyTrack; features: SpotifyAudioFeatures }> {
  const token = await getAccessToken();

  const [trackRes, featRes] = await Promise.all([
    fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }),
    fetch(`https://api.spotify.com/v1/audio-features/${trackId}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }),
  ]);

  if (!trackRes.ok) throw new Error(`Spotify track fetch failed (${trackRes.status}).`);
  if (!featRes.ok) throw new Error(`Spotify audio features fetch failed (${featRes.status}).`);

  const raw = (await trackRes.json()) as RawSpotifyTrack;
  const feat = (await featRes.json()) as RawAudioFeatures;

  const artist = raw.artists?.map((a) => a.name).join(", ") ?? "Unknown";
  const images = raw.album?.images ?? [];
  const albumArtUrl = images.length > 0 ? images[0].url : null;
  const releaseYear = raw.album?.release_date
    ? parseInt(raw.album.release_date.split("-")[0], 10)
    : null;

  const track: SpotifyTrack = {
    id: trackId,
    title: raw.name ?? "Unknown",
    artist,
    album: raw.album?.name ?? "Unknown",
    album_art_url: albumArtUrl,
    release_year: releaseYear && Number.isFinite(releaseYear) ? releaseYear : null,
    duration_ms: raw.duration_ms ?? 0,
    explicit: raw.explicit ?? false,
    spotify_url: raw.external_urls?.spotify ?? `https://open.spotify.com/track/${trackId}`,
  };

  const features: SpotifyAudioFeatures = {
    tempo_bpm: Math.round(feat.tempo ?? 0),
    key: formatKey(feat.key ?? -1, feat.mode ?? 1),
    energy: feat.energy ?? 0,
    danceability: feat.danceability ?? 0,
    valence: feat.valence ?? 0,
    acousticness: feat.acousticness ?? 0,
    instrumentalness: feat.instrumentalness ?? 0,
    loudness_db: feat.loudness ?? 0,
    speechiness: feat.speechiness ?? 0,
    time_signature: feat.time_signature ?? 4,
  };

  return { track, features };
}
