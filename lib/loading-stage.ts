export type LoadingPhase = "analyze" | "music" | "still" | "download" | "download-music" | "scan";

export const LOADING_STAGES = [
  "fetch",
  "frames",
  "catalog",
  "preview",
  "palette",
  "fingerprint",
  "critique",
  "package",
] as const;

export type LoadingStageId = (typeof LOADING_STAGES)[number];

const STAGE_SET = new Set<string>(LOADING_STAGES);

export function isLoadingStage(value: string): value is LoadingStageId {
  return STAGE_SET.has(value);
}

const IDLE: Record<LoadingPhase, string> = {
  analyze: "starting the video read",
  music: "starting the track read",
  still: "reading the picture",
  scan: "listening for a match",
  download: "fetching the source clip",
  "download-music": "fetching a 30s preview",
};

const COPY: Record<LoadingPhase, Partial<Record<LoadingStageId, string>>> = {
  analyze: {
    fetch: "fetching the clip",
    frames: "pulling stills from the cut",
    palette: "reading color and motion",
    fingerprint: "checking the soundtrack",
    critique: "writing the critique",
  },
  music: {
    fetch: "fetching the spotify track",
    catalog: "reading the full recording",
    preview: "measuring the preview clip",
    critique: "writing the critique",
  },
  still: {
    fetch: "reading the picture",
    palette: "pulling the palette",
    critique: "writing the critique",
  },
  scan: {
    fetch: "sampling the upload",
    fingerprint: "matching the catalog",
  },
  download: {
    fetch: "fetching the source clip",
    package: "packaging the file",
  },
  "download-music": {
    fetch: "fetching a 30s preview",
    package: "packaging the mp3",
  },
};

/** Floor for the wait bar when a real server stage arrives. Never a percent-done claim. */
const FLOOR: Record<LoadingStageId, number> = {
  fetch: 16,
  frames: 34,
  catalog: 40,
  preview: 48,
  palette: 52,
  fingerprint: 58,
  critique: 72,
  package: 55,
};

export function loadingStatus(phase: LoadingPhase, stage: string | null | undefined): string {
  if (stage && isLoadingStage(stage)) {
    return COPY[phase][stage] ?? IDLE[phase];
  }
  return IDLE[phase];
}

export function loadingBarFloor(stage: string | null | undefined): number {
  if (stage && isLoadingStage(stage)) return FLOOR[stage];
  return 8;
}

/** Elapsed ease 8→90 plus real stage floors. Never decreases. Never 100. */
export function nextLoadingBar(
  prev: number,
  elapsedMs: number,
  stage: string | null | undefined,
): number {
  const ease = Math.min(90, Math.round(8 + 82 * (1 - Math.exp(-elapsedMs / 14000))));
  return Math.max(prev, ease, loadingBarFloor(stage));
}
