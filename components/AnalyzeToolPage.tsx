"use client";

import React from "react";

import type { AnalyzeErrorBody, AnalyzeSuccess } from "@/types/analysis";
import type { MusicAnalyzeErrorBody, MusicAnalyzeSuccess } from "@/types/music-analysis";
import type { IdentifyAudioErrorBody, IdentifyAudioSuccess } from "@/types/identify-audio";

import { arrayBufferToMp3Download, arrayBufferToMp4Download, saveAudioBlobToDevice, saveVideoBlobToDevice } from "@/lib/clientDownload";
import { readAnalyzeResponse } from "@/lib/clientNdjson";

import { InputScreen } from "@/components/InputScreen";
import type { AppMode } from "@/components/InputScreen";
import { LoadingScreen } from "@/components/LoadingScreen";
import { ResultsScreen } from "@/components/ResultsScreen";
import { MusicResultsScreen } from "@/components/MusicResultsScreen";
import { HistoryPanel } from "@/components/HistoryPanel";
import { pushMusicHistory, pushVideoHistory, type AnalysisHistoryEntry } from "@/lib/analysis-history";

const STORAGE_KEY = "whyitslaps:last-result";
/** Extension injector may write after first paint; poll briefly without delaying normal cache read. */
const EXT_RESULT_POLL_MS = 50;
const EXT_RESULT_MAX_ATTEMPTS = 30;

function networkErrorHint(original: string): string {
  if (!/load failed|failed to fetch|networkerror|network error|http2|ping_failed/i.test(original)) {
    return original;
  }
  const onLocalhost =
    typeof window !== "undefined" &&
    /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname);
  if (onLocalhost) {
    return `${original} — Try http://127.0.0.1:3000 (not "localhost") with npm run dev running; check the terminal for crashes.`;
  }
  return `${original} — The connection dropped while the server was still working (not a 60s clip limit). Retry once; if it keeps failing, try Upload clip with a short MP4.`;
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
  const [storedMusicSourceUrl, setStoredMusicSourceUrl] = React.useState("");
  const [loadingPhase, setLoadingPhase] = React.useState<
    null | "analyze" | "music" | "download" | "scan"
  >(null);
  const busy = loadingPhase !== null;
  const pendingMusicAutoAnalyzeUrl = React.useRef<string | null>(null);

  const [error, setError] = React.useState<string | null>(null);
  const [analysisRetryHint, setAnalysisRetryHint] = React.useState(false);
  const [result, setResult] = React.useState<AnalyzeSuccess | null>(null);
  const [musicResult, setMusicResult] = React.useState<MusicAnalyzeSuccess | null>(null);
  const [historyRefreshToken, setHistoryRefreshToken] = React.useState(0);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "music") {
      setMode("music");
    }
    const urlParam = params.get("url")?.trim();
    if (urlParam && /^https?:\/\//i.test(urlParam)) {
      setUrl(urlParam);
      if (params.get("analyze") !== "0") {
        pendingMusicAutoAnalyzeUrl.current = urlParam;
      }
    }
    if (params.has("fresh") || params.has("new")) {
      window.sessionStorage.removeItem(STORAGE_KEY);
      window.sessionStorage.removeItem("whyitslaps_result");
      params.delete("fresh");
      params.delete("new");
      const q = params.toString();
      const path = `${window.location.pathname}${q ? `?${q}` : ""}${window.location.hash}`;
      window.history.replaceState(null, "", path);
    }

    if (params.has("mode") || params.has("url") || params.has("analyze")) {
      params.delete("mode");
      params.delete("url");
      params.delete("analyze");
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

  const triggerDownloadForMusicUrl = React.useCallback(
    async (targetUrl: string) => {
      setError(null);

      const target = targetUrl.trim();
      if (!target) {
        setError("No saved link — paste a Spotify track URL first.");
        return;
      }
      if (!/^https?:\/\//i.test(target)) {
        setError("Paste a full https Spotify track link first.");
        return;
      }

      setLoadingPhase("download");

      try {
        const res = await fetch("/api/download-music", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ url: target }),
        });

        if (!res.ok) {
          let msg = "";
          try {
            const errBody = (await res.json()) as MusicAnalyzeErrorBody;
            msg = typeof errBody === "object" && errBody?.error ? errBody.error : `HTTP ${res.status}`;
            if (typeof errBody === "object" && errBody.hint) msg = `${msg} — ${String(errBody.hint)}`;
          } catch {
            msg = await res.text().catch(() => "");
            msg = msg || `Download failed (${res.status}).`;
          }
          setError(msg);
          return;
        }

        const disposition = res.headers.get("Content-Disposition");
        const buf = await res.arrayBuffer();
        const prepared = arrayBufferToMp3Download(buf, disposition, "whyitslaps-preview.mp3");
        if (!prepared.ok) {
          setError(prepared.message);
          return;
        }
        await saveAudioBlobToDevice(prepared.blob, prepared.filename);
      } catch (unexpected) {
        setError(
          networkErrorHint(
            unexpected instanceof Error ? unexpected.message : "Browser could not finish the download.",
          ),
        );
      } finally {
        setLoadingPhase(null);
      }
    },
    [],
  );

  const runMusicAnalyze = React.useCallback(async (targetUrl: string) => {
    setError(null);
    setAnalysisRetryHint(false);
    const target = targetUrl.trim();
    if (!target) {
      setError("paste a full https link first.");
      return;
    }

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
        const musicPayload = payload as MusicAnalyzeSuccess;
        setStoredMusicSourceUrl(target);
        pushMusicHistory(musicPayload, target);
        setHistoryRefreshToken((n) => n + 1);
        setMusicResult(musicPayload);
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
  }, []);

  React.useEffect(() => {
    const pending = pendingMusicAutoAnalyzeUrl.current;
    if (!pending || busy || musicResult || result) return;
    if (mode !== "music") return;
    if (url.trim() !== pending) return;
    pendingMusicAutoAnalyzeUrl.current = null;
    void runMusicAnalyze(pending);
  }, [mode, url, busy, musicResult, result, runMusicAnalyze]);

  const runAnalyze = React.useCallback(async () => {
    setError(null);
    setAnalysisRetryHint(false);
    if (mode === "history") return;
    const target = url.trim();
    if (!target) {
      setError("paste a full https link first.");
      return;
    }

    if (mode === "music") {
      await runMusicAnalyze(target);
      return;
    }

    setLoadingPhase("analyze");

    try {
      const res = await fetch(new URL("/api/analyze", window.location.origin), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: target }),
      });

      const payload = await readAnalyzeResponse(res);

      if ("ok" in payload && payload.ok) {
        setStoredSourceUrl(target);
        pushVideoHistory(payload, target);
        setHistoryRefreshToken((n) => n + 1);
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
  }, [url, mode, runMusicAnalyze]);

  const runMusicScan = React.useCallback(
    async (file: File) => {
      setError(null);
      setAnalysisRetryHint(false);
      setLoadingPhase("scan");

      try {
        const form = new FormData();
        form.append("clip", file, file.name || "clip.bin");
        const res = await fetch(new URL("/api/identify-audio", window.location.origin), {
          method: "POST",
          body: form,
        });
        const payload = (await res.json()) as IdentifyAudioSuccess | IdentifyAudioErrorBody;
        if (!res.ok || !payload.ok) {
          const err = payload as IdentifyAudioErrorBody;
          if (err.retrySuggested) setAnalysisRetryHint(true);
          setError(err.hint ? `${err.error} — ${err.hint}` : err.error);
          return;
        }

        const spotifyUrl = payload.spotify_url?.trim();
        if (!spotifyUrl) {
          const { title, artist } = payload.match;
          setError(
            `Found “${title}” by ${artist} — no Spotify link in the match. Paste a track URL to analyze.`,
          );
          return;
        }

        setUrl(spotifyUrl);
        setLoadingPhase(null);
        await runMusicAnalyze(spotifyUrl);
      } catch (unexpected) {
        setError(
          networkErrorHint(
            unexpected instanceof Error ? unexpected.message : "Scan failed.",
          ),
        );
      } finally {
        setLoadingPhase((phase) => (phase === "scan" ? null : phase));
      }
    },
    [runMusicAnalyze],
  );

  const runUploadAnalyze = React.useCallback(async (file: File) => {
    setError(null);
    setAnalysisRetryHint(false);

    if (!file.type.startsWith("video/") && !/\.(mp4|mov|webm|m4v)$/i.test(file.name)) {
      setError("Choose a video file (mp4, mov, webm).");
      return;
    }

    setLoadingPhase("analyze");

    try {
      const form = new FormData();
      form.append("video", file, file.name || "clip.mp4");

      const res = await fetch(new URL("/api/analyze-upload", window.location.origin), {
        method: "POST",
        body: form,
      });

      const payload = await readAnalyzeResponse(res);

      if ("ok" in payload && payload.ok) {
        setStoredSourceUrl("");
        pushVideoHistory(payload, "");
        setHistoryRefreshToken((n) => n + 1);
        setResult(payload);
        return;
      }

      const err = payload as AnalyzeErrorBody;
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
  }, []);


  const openHistoryEntry = React.useCallback((entry: AnalysisHistoryEntry) => {
    setError(null);
    setAnalysisRetryHint(false);
    if (entry.kind === "music" && entry.music) {
      setResult(null);
      setStoredSourceUrl("");
      setStoredMusicSourceUrl(entry.sourceUrl);
      setMusicResult(entry.music);
      return;
    }
    if (entry.kind === "video" && entry.video) {
      setMusicResult(null);
      setStoredMusicSourceUrl("");
      setStoredSourceUrl(entry.sourceUrl);
      setResult(entry.video);
    }
  }, []);

  const handleReset = React.useCallback(() => {
    setResult(null);
    setMusicResult(null);
    setError(null);
    setAnalysisRetryHint(false);
    setStoredSourceUrl("");
    setStoredMusicSourceUrl("");
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const loadingUiPhase =
    loadingPhase === "download"
      ? "download"
      : loadingPhase === "music"
        ? "music"
        : loadingPhase === "scan"
          ? "scan"
          : "analyze";

  if (musicResult) {
    return (
      <>
        <LoadingScreen active={busy} phase={loadingUiPhase} />
        <MusicResultsScreen
          data={musicResult}
          downloadError={error}
          downloadBusy={loadingPhase === "download"}
          onDownloadPreview={() =>
            void triggerDownloadForMusicUrl(storedMusicSourceUrl || musicResult.track.spotify_url)
          }
          onReset={handleReset}
        />
      </>
    );
  }

  if (result) {
    return (
      <>
        <LoadingScreen active={busy} phase={loadingUiPhase} />
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
      <LoadingScreen active={busy} phase={loadingUiPhase} />
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
        onDownload={() =>
          void (mode === "music" ? triggerDownloadForMusicUrl(url) : triggerDownloadForUrl(url))
        }
        onModeChange={(next) => {
          setMode(next);
          if (next !== "history") setUrl("");
          setError(null);
          setAnalysisRetryHint(false);
          if (next === "history") setHistoryRefreshToken((n) => n + 1);
        }}
        onRetryAnalysis={runAnalyze}
        onUploadFile={(file) => void runUploadAnalyze(file)}
        onUploadMusicScan={(file) => void runMusicScan(file)}
        historyPanel={
          <HistoryPanel refreshToken={historyRefreshToken} onOpen={openHistoryEntry} />
        }
      />
    </main>
  );
}
