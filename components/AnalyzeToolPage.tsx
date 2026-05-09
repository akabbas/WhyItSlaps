"use client";

import Link from "next/link";
import React from "react";

import type { AnalyzeErrorBody, AnalyzeSuccess } from "@/types/analysis";
import type { MusicAnalyzeErrorBody, MusicAnalyzeSuccess } from "@/types/music-analysis";

import { arrayBufferToMp4Download, saveVideoBlobToDevice } from "@/lib/clientDownload";

import { InputScreen } from "@/components/InputScreen";
import type { AppMode } from "@/components/InputScreen";
import { LoadingScreen } from "@/components/LoadingScreen";
import { ResultsScreen } from "@/components/ResultsScreen";
import { MusicResultsScreen } from "@/components/MusicResultsScreen";

const STORAGE_KEY = "whyitslaps:last-result";
/** Extension injector may write after first paint; poll briefly without delaying normal cache read. */
const EXT_RESULT_POLL_MS = 50;
const EXT_RESULT_MAX_ATTEMPTS = 30;

function networkErrorHint(original: string): string {
  if (!/load failed|failed to fetch|networkerror|network error/i.test(original)) return original;
  return `${original} — Try http://127.0.0.1:3000 (not "localhost") with npm run dev running; check the terminal for crashes.`;
}

type StoredEnvelopeV1 = { v: 1; result: AnalyzeSuccess; url: string };

function parsePayload(json: string): { result: AnalyzeSuccess; url: string } | null {
  try {
    const data = JSON.parse(json) as unknown;
    if (!data || typeof data !== "object") return null;

    const o = data as Record<string, unknown>;
    if (
      o.v === 1 &&
      o.result &&
      typeof o.result === "object" &&
      (o.result as AnalyzeSuccess).ok === true &&
      (o.result as AnalyzeSuccess).claude
    ) {
      const result = o.result as AnalyzeSuccess;
      const url = typeof o.url === "string" ? o.url : "";
      return { result, url };
    }

    const legacy = data as AnalyzeSuccess;
    if (legacy?.ok === true && legacy?.claude) return { result: legacy, url: "" };
    return null;
  } catch {
    return null;
  }
}

export function AnalyzeToolPage() {
  const [mode, setMode] = React.useState<AppMode>("video");
  const [url, setUrl] = React.useState("");
  const [storedSourceUrl, setStoredSourceUrl] = React.useState("");
  const [loadingPhase, setLoadingPhase] = React.useState<null | "analyze" | "music" | "download">(null);
  const busy = loadingPhase !== null;

  const [error, setError] = React.useState<string | null>(null);
  const [analysisRetryHint, setAnalysisRetryHint] = React.useState(false);
  const [result, setResult] = React.useState<AnalyzeSuccess | null>(null);
  const [musicResult, setMusicResult] = React.useState<MusicAnalyzeSuccess | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    if (params.has("fresh") || params.has("new")) {
      window.sessionStorage.removeItem(STORAGE_KEY);
      window.sessionStorage.removeItem("whyitslaps_result");
      params.delete("fresh");
      params.delete("new");
      const q = params.toString();
      const path = `${window.location.pathname}${q ? `?${q}` : ""}${window.location.hash}`;
      window.history.replaceState(null, "", path);
    }

    let cancelled = false;

    const tryHydrateFromExtension = (): boolean => {
      const extRaw = window.sessionStorage.getItem("whyitslaps_result");
      if (!extRaw) return false;
      window.sessionStorage.removeItem("whyitslaps_result");
      try {
        const parsed = JSON.parse(extRaw) as unknown;
        if (
          parsed &&
          typeof parsed === "object" &&
          "ok" in parsed &&
          (parsed as AnalyzeSuccess).ok === true &&
          (parsed as AnalyzeSuccess).claude
        ) {
          setResult(parsed as AnalyzeSuccess);
          setStoredSourceUrl("");
          return true;
        }
      } catch {
        /* ignore */
      }
      return false;
    };

    const tryHydrateFromSessionCache = (): boolean => {
      const cached = window.sessionStorage.getItem(STORAGE_KEY);
      if (!cached) return false;
      const parsed = parsePayload(cached);
      if (parsed) {
        setResult(parsed.result);
        setStoredSourceUrl(parsed.url);
        return true;
      }
      return false;
    };

    const tick = (attempt: number) => {
      if (cancelled) return;
      if (tryHydrateFromExtension()) return;
      if (attempt === 0 && tryHydrateFromSessionCache()) return;
      if (attempt + 1 < EXT_RESULT_MAX_ATTEMPTS) {
        window.setTimeout(() => tick(attempt + 1), EXT_RESULT_POLL_MS);
      }
    };

    tick(0);

    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined" || !result) return;
    const body: StoredEnvelopeV1 = { v: 1, result, url: storedSourceUrl };
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(body));
  }, [result, storedSourceUrl]);

  const guessFilename = React.useCallback((rawUrl: string) => {
    try {
      const host = new URL(rawUrl.trim()).hostname.replace(/^www\./, "").replace(/[^a-z0-9]/gi, "-");
      return `${host.slice(0, 36) || "whyitslaps"}-clip.mp4`;
    } catch {
      return "whyitslaps-clip.mp4";
    }
  }, []);

  const triggerDownloadForUrl = React.useCallback(async (targetUrl: string) => {
    setError(null);

    const target = targetUrl.trim();
    if (!target) {
      setError("No saved link — paste a URL on the previous screen.");
      return;
    }
    if (!/^https?:\/\//i.test(target)) {
      setError("Paste a full https link first.");
      return;
    }

    setLoadingPhase("download");

    try {
      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: target }),
      });

      if (!res.ok) {
        let msg = "";
        try {
          const errBody = (await res.json()) as AnalyzeErrorBody;
          msg =
            typeof errBody === "object" && errBody?.error ? errBody.error : `HTTP ${res.status}`;
          if (typeof errBody === "object" && errBody.hint) msg = `${msg} — ${String(errBody.hint)}`;
        } catch {
          msg = await res.text().catch(() => "");
          msg = msg || `Download failed (${res.status}).`;
        }
        setError(msg);
        return;
      }

      const fallback = guessFilename(target);
      const disposition = res.headers.get("Content-Disposition");
      const buf = await res.arrayBuffer();
      const prepared = arrayBufferToMp4Download(buf, disposition, fallback);
      if (!prepared.ok) {
        setError(prepared.message);
        return;
      }
      await saveVideoBlobToDevice(prepared.blob, prepared.filename);
    } catch (unexpected) {
      setError(
        networkErrorHint(
          unexpected instanceof Error ? unexpected.message : "Browser could not finish the download.",
        ),
      );
    } finally {
      setLoadingPhase(null);
    }
  }, [guessFilename]);

  const runAnalyze = React.useCallback(async () => {
    setError(null);
    setAnalysisRetryHint(false);
    const target = url.trim();
    if (!target) {
      setError("paste a full https link first.");
      return;
    }

    if (mode === "music") {
      setLoadingPhase("music");
      try {
        const res = await fetch(new URL("/api/analyze-music", window.location.origin), {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ url: target }),
        });
        const text = await res.text();
        let payload: MusicAnalyzeSuccess | MusicAnalyzeErrorBody;
        try {
          payload = JSON.parse(text) as MusicAnalyzeSuccess | MusicAnalyzeErrorBody;
        } catch {
          throw new Error(text || `HTTP ${res.status}`);
        }
        if ("ok" in payload && payload.ok) {
          setMusicResult(payload as MusicAnalyzeSuccess);
          return;
        }
        const err = payload as MusicAnalyzeErrorBody;
        if (err.retrySuggested) setAnalysisRetryHint(true);
        setError(err.hint ? `${err.error} — ${err.hint}` : err.error);
      } catch (unexpected) {
        setError(
          networkErrorHint(
            unexpected instanceof Error ? unexpected.message : "Unknown network error.",
          ),
        );
      } finally {
        setLoadingPhase(null);
      }
      return;
    }

    setLoadingPhase("analyze");

    try {
      const res = await fetch(new URL("/api/analyze", window.location.origin), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: target }),
      });

      let payload: AnalyzeSuccess | AnalyzeErrorBody;
      try {
        payload = (await res.json()) as AnalyzeSuccess | AnalyzeErrorBody;
      } catch {
        throw new Error("Invalid response from server.");
      }

      if ("ok" in payload && payload.ok) {
        setStoredSourceUrl(target);
        setResult(payload);
        return;
      }

      const err = payload as AnalyzeErrorBody;

      if (err.retrySuggested) {
        setAnalysisRetryHint(true);
      }

      const glue = err.hint ? `${err.error} — ${err.hint}` : err.error;
      setError(glue);
    } catch (unexpected) {
      setError(
        networkErrorHint(
          unexpected instanceof Error ? unexpected.message : "Unknown network error.",
        ),
      );
    } finally {
      setLoadingPhase(null);
    }
  }, [url, mode]);

  const handleReset = React.useCallback(() => {
    setResult(null);
    setMusicResult(null);
    setError(null);
    setAnalysisRetryHint(false);
    setStoredSourceUrl("");
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  if (musicResult) {
    return (
      <>
        <div className="absolute right-4 top-4 z-20 md:right-8">
          <Link
            href="/welcome"
            className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/45 underline-offset-4 hover:text-paper"
          >
            About
          </Link>
        </div>
        <LoadingScreen active={busy} phase="music" />
        <MusicResultsScreen data={musicResult} onReset={handleReset} />
      </>
    );
  }

  if (result) {
    return (
      <>
        <div className="absolute right-4 top-4 z-20 md:right-8">
          <Link
            href="/welcome"
            className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/45 underline-offset-4 hover:text-paper"
          >
            About
          </Link>
        </div>
        <LoadingScreen active={busy} phase={loadingPhase === "download" ? "download" : "analyze"} />
        <ResultsScreen
          data={result}
          downloadError={error}
          videoSourceUrl={storedSourceUrl}
          downloadBusy={loadingPhase === "download"}
          onDownloadVideo={() => void triggerDownloadForUrl(storedSourceUrl)}
          onReset={handleReset}
        />
      </>
    );
  }

  return (
    <main className="relative">
      <div className="absolute right-4 top-4 z-20 md:right-8">
        <Link
          href="/welcome"
          className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/45 underline-offset-4 hover:text-paper"
        >
          About
        </Link>
      </div>
      <LoadingScreen active={busy} phase={loadingPhase === "download" ? "download" : "analyze"} />
      <InputScreen
        error={error}
        value={url}
        disabled={busy}
        retryAnalysisHint={analysisRetryHint}
        mode={mode}
        onChange={(next) => {
          setUrl(next);
          if (error) setError(null);
        }}
        onAnalyze={runAnalyze}
        onDownload={() => void triggerDownloadForUrl(url)}
        onModeChange={(next) => {
          setMode(next);
          setUrl("");
          setError(null);
          setAnalysisRetryHint(false);
        }}
        onRetryAnalysis={runAnalyze}
      />
    </main>
  );
}
