import type { MusicMatch } from "@/types/analysis";

export interface IdentifyAudioSuccess {
  ok: true;
  match: MusicMatch;
  /** Built when ACR returns a Spotify track id. */
  spotify_url: string | null;
}

export interface IdentifyAudioErrorBody {
  ok: false;
  error: string;
  hint?: string;
  stage?: "upload" | "extract" | "identify" | "config";
  retrySuggested?: boolean;
}
