export type PreviewCandidate = {
  trackName?: string;
  artistName?: string;
  previewUrl?: string;
};

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
