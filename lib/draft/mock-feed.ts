export type DraftPlatform = "YT" | "IG" | "TT" | "X" | "SP" | "UP";

export type DraftHistoryEntry = {
  id: string;
  mode: "video" | "music";
  platform: DraftPlatform;
  title: string;
  vibe: string;
  tags: string[];
  palette: string[];
  overallScore: number;
  analyzedAt: string;
  sourceLabel: string;
};

export type DraftExploreEntry = DraftHistoryEntry & {
  publishedAt: string;
  publisher: string;
  publishNote?: string;
};

export const MOCK_HISTORY: DraftHistoryEntry[] = [
  {
    id: "h1",
    mode: "video",
    platform: "TT",
    title: "night drive loop",
    vibe: "Neon melancholy — handheld intimacy with aggressive color separation.",
    tags: ["night", "car", "synth", "lo-fi grade"],
    palette: ["#1a1428", "#4a3f6b", "#e8a4c8", "#f5f0e8"],
    overallScore: 87,
    analyzedAt: "2026-08-18T14:22:00",
    sourceLabel: "tiktok.com/@…/night-drive",
  },
  {
    id: "h2",
    mode: "music",
    platform: "SP",
    title: "Blinding Lights — The Weeknd",
    vibe: "Retro-futurist pop — tight drums, wide synth stack, relentless forward motion.",
    tags: ["synth-pop", "80s", "hook-forward"],
    palette: ["#0d0d0d", "#ff3864", "#fcd34d", "#1e3a5f"],
    overallScore: 91,
    analyzedAt: "2026-08-17T09:05:00",
    sourceLabel: "open.spotify.com/track/…",
  },
  {
    id: "h3",
    mode: "video",
    platform: "IG",
    title: "studio b-roll reel",
    vibe: "Soft documentary — natural light, slow push-ins, earthy palette with one accent.",
    tags: ["documentary", "natural light", "slow pacing"],
    palette: ["#2c2419", "#8b7355", "#d4c4a8", "#f0ebe3"],
    overallScore: 78,
    analyzedAt: "2026-08-15T21:40:00",
    sourceLabel: "uploaded clip",
  },
  {
    id: "h4",
    mode: "video",
    platform: "YT",
    title: "product macro cuts",
    vibe: "Commercial crisp — macro detail, whip transitions, high contrast grade.",
    tags: ["macro", "commercial", "fast cuts"],
    palette: ["#111111", "#ffffff", "#c9a227", "#3d3d3d"],
    overallScore: 82,
    analyzedAt: "2026-08-12T16:18:00",
    sourceLabel: "youtube.com/shorts/…",
  },
];

export const MOCK_EXPLORE: DraftExploreEntry[] = [
  {
    id: "e1",
    mode: "video",
    platform: "TT",
    title: "warehouse rave clip",
    vibe: "Strobe chaos — high shutter, crushed blacks, euphoric crowd energy.",
    tags: ["rave", "strobe", "underground"],
    palette: ["#000000", "#ff00ff", "#00ffcc", "#1a1a2e"],
    overallScore: 89,
    analyzedAt: "2026-08-18T11:00:00",
    sourceLabel: "tiktok.com/@…/warehouse",
    publishedAt: "2026-08-18T12:30:00",
    publisher: "clip.hunter",
    publishNote: "Perfect reference for a client mood board.",
  },
  {
    id: "e2",
    mode: "music",
    platform: "SP",
    title: "Espresso — Sabrina Carpenter",
    vibe: "Bubblegum bounce — dry vocals, punchy low end, meme-ready hook.",
    tags: ["pop", "playful", "radio"],
    palette: ["#fce7f3", "#db2777", "#831843", "#fdf2f8"],
    overallScore: 85,
    analyzedAt: "2026-08-18T08:15:00",
    sourceLabel: "open.spotify.com/track/…",
    publishedAt: "2026-08-18T09:00:00",
    publisher: "sonic.archivist",
  },
  {
    id: "e3",
    mode: "video",
    platform: "X",
    title: "found footage edit",
    vibe: "Analog dread — grain overlay, desaturated greens, jump-cut anxiety.",
    tags: ["horror", "found footage", "grain"],
    palette: ["#1c2b1c", "#4a5d4a", "#8a9a8a", "#e8e4dc"],
    overallScore: 76,
    analyzedAt: "2026-08-17T19:45:00",
    sourceLabel: "x.com/…/status/…",
    publishedAt: "2026-08-17T20:10:00",
    publisher: "vhs.ghost",
    publishNote: "Study this for horror pacing without cheap jumps.",
  },
  {
    id: "e4",
    mode: "video",
    platform: "IG",
    title: "fashion walk-off",
    vibe: "Editorial runway — symmetrical framing, slow motion fabric, cool grade.",
    tags: ["fashion", "runway", "editorial"],
    palette: ["#0a0a0a", "#c0c0c0", "#8b0000", "#f5f0e8"],
    overallScore: 84,
    analyzedAt: "2026-08-16T14:20:00",
    sourceLabel: "instagram.com/reel/…",
    publishedAt: "2026-08-16T15:00:00",
    publisher: "runway.ref",
  },
];

export function formatDraftDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}
