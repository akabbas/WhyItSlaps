import type { AnalyzeSuccess } from "@/types/analysis";

export interface EditPlanSequenceEntry {
  position: number;
  clip_label: string;
  in_point: string;
  hold_duration: string;
  transition_in: string;
  transition_out: string;
  color_grade_instructions: string;
  texture_overlay: string;
  notes: string;
}

export interface EditPlanMusicDirection {
  tempo_bpm: string;
  genre_mood: string;
  search_terms: string;
  sync_notes: string;
}

export interface EditPlanSoftwareSteps {
  premiere: string;
  davinci: string;
}

export interface EditPlan {
  edit_overview: string;
  sequence: EditPlanSequenceEntry[];
  global_grade_settings: string;
  music_direction: EditPlanMusicDirection;
  software_steps: EditPlanSoftwareSteps;
  pro_tips: string[];
}

export type EditPlanResponse =
  | { ok: true; plan: EditPlan }
  | { ok: false; error: string; hint?: string };

export interface EditPlanClipInput {
  label: string;
  duration: number;
  description: string;
}

export interface EditPlanRequestBody {
  clips: EditPlanClipInput[];
  targetDuration: number;
  notes?: string;
  analysis: AnalyzeSuccess;
}
