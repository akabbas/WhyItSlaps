import type { AnalyzeSuccess } from "@/types/analysis";
import type { MusicAnalyzeSuccess } from "@/types/music-analysis";

export const ANALYSIS_HISTORY_KEY = "whyitslaps:analysis-history:v1";
export const ANALYSIS_HISTORY_MAX = 40;

export type HistoryKind = "video" | "music";
export type HistoryPlatform = "YT" | "IG" | "TT" | "X" | "SP" | "UP";

export type AnalysisHistoryEntry = {
  id: string;
  kind: HistoryKind;
  platform: HistoryPlatform;
  title: string;
  subtitle: string;
  sourceUrl: string;
  analyzedAt: string;
  tags: string[];
  palette: string[];
  score: number | null;
  /** Album art for music rows (optional; omit large blobs). */
  artUrl: string | null;
  video: AnalyzeSuccess | null;
  music: MusicAnalyzeSuccess | null;
};

function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `h_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

export function inferHistoryPlatform(rawUrl: string, kind: HistoryKind): HistoryPlatform {
  if (!rawUrl.trim()) return "UP";
  try {
    const host = new URL(rawUrl).hostname.replace(/^www\./, "");
    if (kind === "music" || host.includes("spotify.com")) return "SP";
    if (host.includes("youtube.com") || host === "youtu.be") return "YT";
    if (host.includes("instagram.com")) return "IG";
    if (host.includes("tiktok.com")) return "TT";
    if (host.includes("twitter.com") || host === "x.com") return "X";
    return "UP";
  } catch {
    return "UP";
  }
}

function readRaw(): AnalysisHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ANALYSIS_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is AnalysisHistoryEntry => {
      if (!item || typeof item !== "object") return false;
      const e = item as AnalysisHistoryEntry;
      return typeof e.id === "string" && (e.kind === "video" || e.kind === "music");
    });
  } catch {
    return [];
  }
}

function writeRaw(entries: AnalysisHistoryEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ANALYSIS_HISTORY_KEY, JSON.stringify(entries.slice(0, ANALYSIS_HISTORY_MAX)));
  } catch {
    // Quota or private mode — drop oldest and retry once.
    try {
      window.localStorage.setItem(
        ANALYSIS_HISTORY_KEY,
        JSON.stringify(entries.slice(0, Math.max(5, Math.floor(ANALYSIS_HISTORY_MAX / 2)))),
      );
    } catch {
      /* ignore */
    }
  }
}

export function listAnalysisHistory(): AnalysisHistoryEntry[] {
  return readRaw();
}

export function getAnalysisHistoryEntry(id: string): AnalysisHistoryEntry | null {
  return readRaw().find((e) => e.id === id) ?? null;
}

export function removeAnalysisHistoryEntry(id: string): AnalysisHistoryEntry[] {
  const next = readRaw().filter((e) => e.id !== id);
  writeRaw(next);
  return next;
}

export function clearAnalysisHistory(): AnalysisHistoryEntry[] {
  writeRaw([]);
  return [];
}

export function pushVideoHistory(result: AnalyzeSuccess, sourceUrl: string): AnalysisHistoryEntry {
  const title =
    result.claude.brief_summary?.trim() ||
    result.claude.vibe_summary?.trim().slice(0, 80) ||
    "Video analysis";
  const entry: AnalysisHistoryEntry = {
    id: newId(),
    kind: "video",
    platform: inferHistoryPlatform(sourceUrl, "video"),
    title: title.slice(0, 120),
    subtitle: result.claude.vibe_summary?.trim() || "",
    sourceUrl: sourceUrl.trim(),
    analyzedAt: new Date().toISOString(),
    tags: (result.claude.aesthetic_tags ?? []).slice(0, 6),
    palette: (result.palette ?? []).slice(0, 6).map((s) => s.hex),
    score: result.claude.scores?.overall_vibe ?? null,
    artUrl: null,
    video: result,
    music: null,
  };
  writeRaw([entry, ...readRaw().filter((e) => !(e.kind === "video" && e.sourceUrl && e.sourceUrl === entry.sourceUrl))]);
  return entry;
}

export function pushMusicHistory(result: MusicAnalyzeSuccess, sourceUrl: string): AnalysisHistoryEntry {
  const trackTitle = result.track?.title?.trim() || "Track";
  const artist = result.track?.artist?.trim() || "";
  const entry: AnalysisHistoryEntry = {
    id: newId(),
    kind: "music",
    platform: "SP",
    title: artist ? `${trackTitle} — ${artist}` : trackTitle,
    subtitle: result.claude.vibe_summary?.trim() || result.claude.brief_summary?.trim() || "",
    sourceUrl: sourceUrl.trim() || result.track.spotify_url || "",
    analyzedAt: new Date().toISOString(),
    tags: (result.claude.aesthetic_tags ?? []).slice(0, 6),
    palette: [],
    score: result.claude.scores?.overall_vibe ?? null,
    artUrl: result.track.album_art_url ?? null,
    video: null,
    music: result,
  };
  writeRaw([
    entry,
    ...readRaw().filter((e) => !(e.kind === "music" && e.sourceUrl && e.sourceUrl === entry.sourceUrl)),
  ]);
  return entry;
}

export function formatHistoryWhen(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const sameDay =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();
    if (sameDay) {
      return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    }
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}
