export interface SpotifyTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  album_art_url: string | null;
  release_year: number | null;
  duration_ms: number;
  explicit: boolean;
  spotify_url: string;
}

export interface SpotifyAudioFeatures {
  tempo_bpm: number;
  key: string;
  energy: number;
  danceability: number;
  valence: number;
  acousticness: number;
  instrumentalness: number;
  loudness_db: number;
  speechiness: number;
  time_signature: number;
}

export type MusicScoreKey =
  | "hook_strength"
  | "production_density"
  | "emotional_range"
  | "originality"
  | "mix_clarity"
  | "overall_vibe";

export interface MusicAnalysisScores {
  hook_strength: number;
  production_density: number;
  emotional_range: number;
  originality: number;
  mix_clarity: number;
  overall_vibe: number;
}

export interface SonicTexture {
  name: string;
  description: string;
}

export interface EnergyArcSegment {
  label: string;
  note: string;
  energy_level: "low" | "mid" | "high" | "peak";
}

export interface ProduceStep {
  title: string;
  body: string;
}

export interface ClaudeMusicAnalysis {
  /** One punchy sentence — the TL;DR shown in brief mode. */
  brief_summary: string;
  vibe_summary: string;
  /** One line per dense section for brief mode. */
  section_summaries?: {
    arrangement: string;
    mix: string;
    sonic: string;
  };
  aesthetic_tags: string[];
  target_listener: string;
  scores: MusicAnalysisScores;
  sonic_textures: SonicTexture[];
  energy_arc: EnergyArcSegment[];
  arrangement: {
    structure: string;
    density_strategy: string;
    signature_moment: string;
  };
  mix_profile: {
    low_end: string;
    midrange: string;
    high_end: string;
    width: string;
  };
  why_it_works: { title: string; detail: string }[];
  how_to_produce: ProduceStep[];
}

export interface MusicAnalyzeSuccess {
  ok: true;
  track: SpotifyTrack;
  features: SpotifyAudioFeatures | null;
  claude: ClaudeMusicAnalysis;
}

export interface MusicAnalyzeErrorBody {
  ok: false;
  error: string;
  hint?: string;
  stage?: "url" | "spotify" | "claude";
  retrySuggested?: boolean;
}
