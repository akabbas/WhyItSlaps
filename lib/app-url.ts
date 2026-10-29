import type { AppMode } from "@/components/InputScreen";

export type AppLocation = {
  mode: AppMode;
  url: string;
  autoAnalyze: boolean;
};

export function buildAppPath(mode: AppMode, sourceUrl?: string): string {
  const params = new URLSearchParams();
  if (mode !== "video") params.set("mode", mode);
  const trimmed = sourceUrl?.trim() ?? "";
  if ((mode === "music" || mode === "video") && /^https?:\/\//i.test(trimmed)) {
    params.set("url", trimmed);
  }
  const q = params.toString();
  return q ? `/?${q}` : "/";
}

export function readAppLocation(search: string): AppLocation {
  const raw = search.startsWith("?") ? search.slice(1) : search;
  const params = new URLSearchParams(raw);
  const modeRaw = params.get("mode");
  const mode: AppMode =
    modeRaw === "music" || modeRaw === "history" || modeRaw === "still" || modeRaw === "video"
      ? modeRaw
      : "video";
  const url = params.get("url")?.trim() ?? "";
  return {
    mode,
    url: /^https?:\/\//i.test(url) ? url : "",
    autoAnalyze: params.get("analyze") !== "0",
  };
}

export function writeAppPath(mode: AppMode, sourceUrl?: string, method: "push" | "replace" = "replace"): void {
  if (typeof window === "undefined") return;
  const next = buildAppPath(mode, sourceUrl);
  const cur = `${window.location.pathname}${window.location.search}`;
  if (cur === next) return;
  if (method === "push") window.history.pushState(null, "", next);
  else window.history.replaceState(null, "", next);
}
