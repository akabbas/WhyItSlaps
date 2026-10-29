export type PreviewCandidate = {
  trackName?: string;
  artistName?: string;
  previewUrl?: string;
};

export type PreviewTrackRef = {
  artist: string;
  title: string;
  preview_url?: string | null;
};

export const MIN_PREVIEW_BYTES = 512;
export const MAX_PREVIEW_BYTES = 8 * 1024 * 1024;

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\(.*?\)|\[.*?\]/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function titlesAgree(wanted: string, found: string): boolean {
  if (!wanted || !found) return false;
  return found === wanted || found.includes(wanted) || wanted.includes(found);
}

/** Pick a preview URL for this artist and title from an iTunes-style result list. */
export function pickPreviewUrl(artist: string, title: string, results: PreviewCandidate[]): string | null {
  const wantedTitle = normalize(title);
  const wantedArtist = normalize((artist.split(",")[0] ?? artist).trim());
  let fallback: string | null = null;

  for (const result of results) {
    const preview = result.previewUrl?.trim();
    if (!preview || !/^https:\/\//i.test(preview)) continue;
    const foundTitle = normalize(result.trackName ?? "");
    const foundArtist = normalize(result.artistName ?? "");
    if (!titlesAgree(wantedTitle, foundTitle)) continue;
    const artistOk =
      !wantedArtist || foundArtist.includes(wantedArtist) || wantedArtist.includes(foundArtist);
    if (artistOk && foundTitle === wantedTitle) return preview;
    if (artistOk && !fallback) fallback = preview;
  }

  return fallback;
}

/** iTunes Search ~30s preview candidates for this artist + title. */
export async function fetchItunesPreviews(artist: string, title: string): Promise<PreviewCandidate[]> {
  const term = encodeURIComponent(`${artist} ${title}`.slice(0, 180));
  const response = await fetch(
    `https://itunes.apple.com/search?term=${term}&media=music&entity=song&limit=8`,
    { cache: "no-store", signal: AbortSignal.timeout(12_000) },
  );
  if (!response.ok) return [];
  const body = (await response.json()) as { results?: PreviewCandidate[] };
  return Array.isArray(body.results) ? body.results : [];
}

export async function resolveItunesPreviewUrl(artist: string, title: string): Promise<string | null> {
  try {
    const results = await fetchItunesPreviews(artist, title);
    return pickPreviewUrl(artist, title, results);
  } catch {
    return null;
  }
}

/**
 * Spotify preview_url when the label provided one; otherwise the matching
 * iTunes Search preview. Null when neither catalog has a clip.
 */
export async function resolvePreviewUrl(track: PreviewTrackRef): Promise<string | null> {
  const spotifyPreview = track.preview_url?.trim();
  if (spotifyPreview && /^https:\/\//i.test(spotifyPreview)) return spotifyPreview;
  return resolveItunesPreviewUrl(track.artist, track.title);
}

export async function downloadPreviewBytes(url: string): Promise<Buffer | null> {
  if (!/^https:\/\//i.test(url)) return null;
  try {
    const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(15_000) });
    if (!response.ok) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength < MIN_PREVIEW_BYTES || buffer.byteLength > MAX_PREVIEW_BYTES) return null;
    return buffer;
  } catch {
    return null;
  }
}
