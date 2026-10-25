import type { PaletteSwatch } from "@/types/analysis";

export type StillScoreKey = "composition" | "light" | "color_harmony" | "subject" | "overall_vibe";

export interface StillAnalysisScores {
  composition: number;
  light: number;
  color_harmony: number;
  subject: number;
  overall_vibe: number;
}

export type StillMedium = "photo" | "painting" | "print" | "other";

export interface StillAnalysis {
  vibe_summary: string;
  aesthetic_tags: string[];
  medium: StillMedium;
  target_viewer: string;
  scores: StillAnalysisScores;
  framing: string;
  light: string;
  color: string;
  why_it_works: { title: string; detail: string }[];
  how_to_make: { summary: string }[];
}

export interface StillAnalyzeSuccess {
  ok: true;
  claude: StillAnalysis;
  palette: PaletteSwatch[];
}

export interface StillAnalyzeErrorBody {
  ok: false;
  error: string;
  hint?: string;
  retrySuggested?: boolean;
}
