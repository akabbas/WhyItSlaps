import { Vibrant } from "node-vibrant/node";
import type { Palette } from "@vibrant/color";
import type { PaletteSwatch } from "@/types/analysis";

const ROLES: PaletteSwatch["role"][] = [
  "Vibrant",
  "DarkVibrant",
  "LightVibrant",
  "Muted",
  "DarkMuted",
  "LightMuted",
];

/** Prefer the fourth frame (~frame_004) when available, else the middle keyframe. */
function pickRepresentative(paths: string[]): string | undefined {
  if (!paths.length) return undefined;
  const sorted = [...paths].sort((a, b) => a.localeCompare(b));
  const idx = sorted.length >= 4 ? 3 : Math.floor((sorted.length - 1) / 2);
  return sorted[idx];
}

export async function paletteFromMiddleFrame(paths: string[]): Promise<PaletteSwatch[]> {
  const target = pickRepresentative(paths);
  if (!target) return [];

  let palette: Palette;
  try {
    palette = await Vibrant.from(target).quality(6).clearFilters().getPalette();
  } catch {
    return [];
  }

  const rows: PaletteSwatch[] = [];
  const pops: Array<{ hex: string; population: number; role: PaletteSwatch["role"] }> = [];

  for (const role of ROLES) {
    const swatch = palette[role];
    if (!swatch) continue;

    let hex = swatch.hex.startsWith("#") ? swatch.hex : `#${swatch.hex}`;
    hex = hex.toUpperCase();
    const population = typeof swatch.population === "number" ? swatch.population : 0;
    if (population <= 0) continue;
    pops.push({ hex, population, role });
  }

  const sum = pops.reduce((a, row) => a + row.population, 0) || 1;

  for (const role of ROLES) {
    const row = pops.find((x) => x.role === role);
    if (!row) continue;

    rows.push({
      role,
      hex: row.hex,
      populationPercent: Math.round((row.population / sum) * 10000) / 100,
    });
  }

  return rows;
}
