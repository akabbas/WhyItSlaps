/** Spotify energy × valence as character, not a ranking. */

export const MOOD_QUADRANTS = ["TENSE", "UP", "LOW", "SOFT"] as const;
export type MoodQuadrant = (typeof MOOD_QUADRANTS)[number];

const HIGH = 0.5;

export function clampUnit(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

/**
 * High energy + high valence = UP.
 * High energy + low valence = TENSE.
 * Low energy + high valence = SOFT.
 * Low energy + low valence = LOW.
 * 0.5 and above counts as high so every track lands in one named cell.
 */
export function moodQuadrant(energy: number, valence: number): MoodQuadrant {
  const energyHigh = clampUnit(energy) >= HIGH;
  const valenceHigh = clampUnit(valence) >= HIGH;
  if (energyHigh && valenceHigh) return "UP";
  if (energyHigh && !valenceHigh) return "TENSE";
  if (!energyHigh && valenceHigh) return "SOFT";
  return "LOW";
}

export function moodQuadrantAxes(quadrant: MoodQuadrant): string {
  switch (quadrant) {
    case "UP":
      return "high energy, high valence";
    case "TENSE":
      return "high energy, low valence";
    case "SOFT":
      return "low energy, high valence";
    case "LOW":
      return "low energy, low valence";
  }
}

/** Marker on a valence (x) × energy (y, high at top) plot, in percent. */
export function moodMarkerPercent(energy: number, valence: number): { left: number; top: number } {
  return {
    left: clampUnit(valence) * 100,
    top: (1 - clampUnit(energy)) * 100,
  };
}
