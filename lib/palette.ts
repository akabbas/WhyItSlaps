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

function swatchesFromPalette(palette: Palette): PaletteSwatch[] {
  const pops: Array<{ hex: string; population: number; role: PaletteSwatch["role"] }> = [];

  for (const role of ROLES) {
    const swatch = palette[role];
    if (!swatch) continue;
    let hex = swatch.hex.startsWith("#") ? swatch.hex : `#${swatch.hex}`;
    hex = hex.toUpperCase();
    const population = typeof swatch.population === "number" ? swatch.population : 1;
    pops.push({ hex, population: Math.max(population, 1), role });
  }

  const sum = pops.reduce((a, row) => a + row.population, 0) || 1;
  const rows: PaletteSwatch[] = [];

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

export async function paletteFromMiddleFrame(paths: string[]): Promise<PaletteSwatch[]> {
  if (!paths.length) return [];

  const sorted = [...paths].sort((a, b) => a.localeCompare(b));

  let best: PaletteSwatch[] = [];
  let bestScore = -1;

  for (const path of sorted) {
    try {
      const palette = await Vibrant.from(path).quality(6).clearFilters().getPalette();
      const score = ROLES.reduce((n, role) => {
        const s = palette[role];
        return n + (s && typeof s.population === "number" && s.population > 0 ? 1 : 0);
      }, 0);
      if (score > bestScore) {
        bestScore = score;
        best = swatchesFromPalette(palette);
      }
      if (bestScore === ROLES.length) break;
    } catch {
      continue;
    }
  }

  return best;
}
