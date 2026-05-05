export type ScoreKey =
  | "color_harmony"
  | "edit_pacing"
  | "motion_feel"
  | "subject_framing"
  | "overall_vibe";

/** Claude vision JSON-only response (scores use these five dimensions; no music_sync). */
export interface ClaudeAnalysisScores {
  color_harmony: number;
  edit_pacing: number;
  motion_feel: number;
  subject_framing: number;
  overall_vibe: number;
}

export interface ClaudeAnalysis {
  vibe_summary: string;
  aesthetic_tags: string[];
  target_audience: string;
  scores: ClaudeAnalysisScores;
  cinematography: {
    framing_composition: string;
    lens_and_motion: string;
    depth_focus_light: string;
  };
  color_grade: {
    palette_mood: string;
    contrast_curve: string;
    skin_environment: string;
  };
  edit_style: {
    pacing_badge: string;
    cut_pattern: string;
    transitions: string;
  };
  why_it_works: { title: string; detail: string }[];
  how_to_edit_like_this: { summary: string }[];
}

/** ACRCloud Identify match payload (multipart /v1/identify). */
export interface MusicMatch {
  title: string | null;
  artist: string | null;
  album: string | null;
  genres: string[];
  bpm: number | null;
  spotify_id: string | null;
  /** ACRCloud `score` field when present (typically 0–100). */
  confidence: number | null;
}

export interface PaletteSwatch {
  role:
    | "Vibrant"
    | "DarkVibrant"
    | "LightVibrant"
    | "Muted"
    | "DarkMuted"
    | "LightMuted";
  hex: string;
  populationPercent: number;
}

export interface AnalyzeSuccess {
  ok: true;
  claude: ClaudeAnalysis;
  music: MusicMatch | null;
  palette: PaletteSwatch[];
  keyframe_count: number;
  video_duration_seconds: number;
}

export interface AnalyzeErrorBody {
  ok: false;
  error: string;
  hint?: string;
  stage?: "download" | "frames" | "music" | "palette" | "claude";
  retrySuggested?: boolean;
}
