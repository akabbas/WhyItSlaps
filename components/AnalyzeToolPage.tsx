"use client";

import React from "react";

import type { AnalyzeErrorBody, AnalyzeSuccess } from "@/types/analysis";
import type { MusicAnalyzeErrorBody, MusicAnalyzeSuccess } from "@/types/music-analysis";
import type { IdentifyAudioErrorBody, IdentifyAudioSuccess } from "@/types/identify-audio";
import type { StillAnalyzeErrorBody, StillAnalyzeSuccess } from "@/types/still-analysis";

import { fetchWithTimeout, TIMEOUT_MS, timeoutMessage } from "@/lib/client-fetch";
import { LISTEN_SECONDS, micErrorMessage, recordMicClip } from "@/lib/record-mic";
import { arrayBufferToMp3Download, arrayBufferToMp4Download, saveAudioBlobToDevice, saveVideoBlobToDevice } from "@/lib/clientDownload";
import { readAnalyzeResponse } from "@/lib/clientNdjson";

import { InputScreen } from "@/components/InputScreen";
import type { AppMode } from "@/components/InputScreen";
import { LoadingScreen } from "@/components/LoadingScreen";
import { ResultsScreen } from "@/components/ResultsScreen";
import { MusicResultsScreen } from "@/components/MusicResultsScreen";
import { StillResultsScreen } from "@/components/StillResultsScreen";
import { HistoryPanel } from "@/components/HistoryPanel";
import {
  findHistoryBySourceUrl,
  pushMusicHistory,
  pushVideoHistory,
  type AnalysisHistoryEntry,
} from "@/lib/analysis-history";
import { readAppLocation, writeAppPath } from "@/lib/app-url";

const STORAGE_KEY = "whyitslaps:last-result";
/** Extension injector may write after first paint; poll briefly without delaying normal cache read. */
const EXT_RESULT_POLL_MS = 50;
const EXT_RESULT_MAX_ATTEMPTS = 30;

function caughtError(err: unknown, fallback: string): string {
  return networkErrorHint(timeoutMessage(err, fallback));
}

function networkErrorHint(original: string): string {
  if (!/load failed|failed to fetch|networkerror|network error|http2|ping_failed/i.test(original)) {
    return original;
  }
  const onLocalhost =
    typeof window !== "undefined" &&
    /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname);
  if (onLocalhost) {
    return `${original}. Try http://127.0.0.1:3000 (not "localhost") with npm run dev running; check the terminal for crashes.`;
  }
  return `${original}. The connection dropped while the server was still working (not a 60s clip limit). Retry once; if it keeps failing, try Upload clip with a short MP4.`;
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
    null | "analyze" | "music" | "still" | "download" | "download-music" | "scan"
  >(null);
  const [loadingStage, setLoadingStage] = React.useState<string | null>(null);
  const busy = loadingPhase !== null;
  const onLoadingStage = React.useCallback((stage: string) => setLoadingStage(stage), []);
  const pendingMusicAutoAnalyzeUrl = React.useRef<string | null>(null);
  const listenAbortRef = React.useRef<AbortController | null>(null);
  const [listenArmed, setListenArmed] = React.useState(false);
  const [listenSecondsLeft, setListenSecondsLeft] = React.useState<number | null>(null);

  const [error, setError] = React.useState<string | null>(null);
  const [analysisRetryHint, setAnalysisRetryHint] = React.useState(false);
  const [result, setResult] = React.useState<AnalyzeSuccess | null>(null);
  const [musicResult, setMusicResult] = React.useState<MusicAnalyzeSuccess | null>(null);
  const [stillResult, setStillResult] = React.useState<StillAnalyzeSuccess | null>(null);
  const [stillPreview, setStillPreview] = React.useState<string | null>(null);
  const [historyRefreshToken, setHistoryRefreshToken] = React.useState(0);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const loc = readAppLocation(window.location.search);
    setMode(loc.mode);
    if (loc.url) setUrl(loc.url);

    let skipSessionVideo = loc.mode === "history" || loc.mode === "still" || loc.mode === "music";
    if (loc.url) {
      if (loc.mode === "music") {
        const hit = findHistoryBySourceUrl(loc.url, "music");
        if (hit?.music) {
          setStoredMusicSourceUrl(loc.url);
          setMusicResult(hit.music);
          skipSessionVideo = true;
        } else if (loc.autoAnalyze) {
          pendingMusicAutoAnalyzeUrl.current = loc.url;
        }
      } else {
        const hit = findHistoryBySourceUrl(loc.url, "video");
        if (hit?.video) {
          setStoredSourceUrl(loc.url);
          setResult(hit.video);
          skipSessionVideo = true;
        }
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
      if (!skipSessionVideo && attempt === 0 && tryHydrateFromSessionCache()) return;
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

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const onPop = () => {
      const loc = readAppLocation(window.location.search);
      setMode(loc.mode);
      setUrl(loc.url);
      setError(null);
      if (loc.mode === "history" || loc.mode === "still" || !loc.url) {
        setResult(null);
        setMusicResult(null);
        setStoredSourceUrl("");
        setStoredMusicSourceUrl("");
        return;
      }
      if (loc.mode === "music") {
        const hit = findHistoryBySourceUrl(loc.url, "music");
        setResult(null);
        setStoredSourceUrl("");
        if (hit?.music) {
          setStoredMusicSourceUrl(loc.url);
          setMusicResult(hit.music);
        } else {
          setMusicResult(null);
          setStoredMusicSourceUrl("");
        }
        return;
      }
      const hit = findHistoryBySourceUrl(loc.url, "video");
      setMusicResult(null);
      setStoredMusicSourceUrl("");
      if (hit?.video) {
        setStoredSourceUrl(loc.url);
        setResult(hit.video);
      } else {
        setResult(null);
        setStoredSourceUrl("");
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

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
      setError("No saved link. Paste a URL on the previous screen.");
      return;
    }
    if (!/^https?:\/\//i.test(target)) {
      setError("Paste a full https link first.");
      return;
    }

    setLoadingStage(null);
    setLoadingPhase("download");

    try {
      const res = await fetchWithTimeout(
        "/api/download",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ url: target }),
        },
        TIMEOUT_MS.video,
      );

      if (!res.ok) {
        let msg = "";
        try {
          const errBody = (await res.json()) as AnalyzeErrorBody;
          msg =
            typeof errBody === "object" && errBody?.error ? errBody.error : `HTTP ${res.status}`;
          if (typeof errBody === "object" && errBody.hint) msg = `${msg}. ${String(errBody.hint)}`;
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
      setError(caughtError(unexpected, "Browser could not finish the download."));
    } finally {
      setLoadingPhase(null);
    }
  }, [guessFilename]);

  const triggerDownloadForMusicUrl = React.useCallback(
    async (targetUrl: string) => {
      setError(null);

      const target = targetUrl.trim();
      if (!target) {
        setError("No saved link. Paste a Spotify track URL first.");
        return;
      }
      if (!/^https?:\/\//i.test(target)) {
        setError("Paste a full https Spotify track link first.");
        return;
      }

      setLoadingStage(null);
      setLoadingPhase("download-music");

      try {
        const res = await fetchWithTimeout(
          "/api/download-music",
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ url: target }),
          },
          TIMEOUT_MS.music,
        );

        if (!res.ok) {
          let msg = "";
          try {
            const errBody = (await res.json()) as MusicAnalyzeErrorBody;
            msg = typeof errBody === "object" && errBody?.error ? errBody.error : `HTTP ${res.status}`;
            if (typeof errBody === "object" && errBody.hint) msg = `${msg}. ${String(errBody.hint)}`;
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
        setError(caughtError(unexpected, "Browser could not finish the download."));
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

    setLoadingStage(null);
    setLoadingPhase("music");
    try {
      const res = await fetchWithTimeout(
        new URL("/api/analyze-music", window.location.origin),
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ url: target }),
        },
        TIMEOUT_MS.music,
      );
      const payload = await readAnalyzeResponse<MusicAnalyzeSuccess | MusicAnalyzeErrorBody>(res, {
        onStage: onLoadingStage,
      });
      if ("ok" in payload && payload.ok) {
        const musicPayload = payload as MusicAnalyzeSuccess;
        setStoredMusicSourceUrl(target);
        pushMusicHistory(musicPayload, target);
        setHistoryRefreshToken((n) => n + 1);
        setMusicResult(musicPayload);
        writeAppPath("music", target, "push");
        return;
      }
      const err = payload as MusicAnalyzeErrorBody;
      if (err.retrySuggested) setAnalysisRetryHint(true);
      setError(err.hint ? `${err.error}. ${err.hint}` : err.error);
    } catch (unexpected) {
      setError(caughtError(unexpected, "Unknown network error."));
    } finally {
      setLoadingPhase(null);
    }
  }, [onLoadingStage]);

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
    if (mode === "history" || mode === "still") return;
    const target = url.trim();
    if (!target) {
      setError("paste a full https link first.");
      return;
    }

    if (mode === "music") {
      await runMusicAnalyze(target);
      return;
    }

    setLoadingStage(null);
    setLoadingPhase("analyze");

    try {
      const res = await fetchWithTimeout(
        new URL("/api/analyze", window.location.origin),
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ url: target }),
        },
        TIMEOUT_MS.video,
      );

      const payload = await readAnalyzeResponse(res, { onStage: onLoadingStage });

      if ("ok" in payload && payload.ok) {
        setStoredSourceUrl(target);
        pushVideoHistory(payload, target);
        setHistoryRefreshToken((n) => n + 1);
        setResult(payload);
        writeAppPath("video", target, "push");
        return;
      }

      const err = payload as AnalyzeErrorBody;

      if (err.retrySuggested) {
        setAnalysisRetryHint(true);
      }

      const glue = err.hint ? `${err.error}. ${err.hint}` : err.error;
      setError(glue);
    } catch (unexpected) {
      setError(caughtError(unexpected, "Unknown network error."));
    } finally {
      setLoadingPhase(null);
    }
  }, [url, mode, runMusicAnalyze, onLoadingStage]);

  const runMusicScan = React.useCallback(
    async (file: File) => {
      setError(null);
      setAnalysisRetryHint(false);
      setLoadingStage(null);
      setLoadingPhase("scan");

      try {
        const form = new FormData();
        form.append("clip", file, file.name || "clip.bin");
        const res = await fetchWithTimeout(
          new URL("/api/identify-audio", window.location.origin),
          {
            method: "POST",
            body: form,
          },
          TIMEOUT_MS.scan,
        );
        const payload = (await res.json()) as IdentifyAudioSuccess | IdentifyAudioErrorBody;
        if (!res.ok || !payload.ok) {
          const err = payload as IdentifyAudioErrorBody;
          if (err.retrySuggested) setAnalysisRetryHint(true);
          setError(err.hint ? `${err.error}. ${err.hint}` : err.error);
          return;
        }

        const spotifyUrl = payload.spotify_url?.trim();
        if (!spotifyUrl) {
          const { title, artist } = payload.match;
          setError(
            `Found “${title}” by ${artist}. No Spotify link in the match. Paste a track URL to analyze.`,
          );
          return;
        }

        setUrl(spotifyUrl);
        setLoadingPhase(null);
        await runMusicAnalyze(spotifyUrl);
      } catch (unexpected) {
        setError(caughtError(unexpected, "Scan failed."));
      } finally {
        setLoadingPhase((phase) => (phase === "scan" ? null : phase));
      }
    },
    [runMusicAnalyze],
  );

  const stopMusicListen = React.useCallback(() => {
    listenAbortRef.current?.abort();
    listenAbortRef.current = null;
    setListenArmed(false);
    setListenSecondsLeft(null);
  }, []);

  const runMusicListen = React.useCallback(async () => {
    if (listenAbortRef.current) {
      stopMusicListen();
      return;
    }

    const ac = new AbortController();
    listenAbortRef.current = ac;
    setError(null);
    setAnalysisRetryHint(false);
    setListenArmed(true);
    setListenSecondsLeft(null);

    try {
      const file = await recordMicClip({
        durationMs: LISTEN_SECONDS * 1000,
        onTick: (left) => {
          if (!ac.signal.aborted) setListenSecondsLeft(left);
        },
        signal: ac.signal,
      });
      if (listenAbortRef.current === ac) listenAbortRef.current = null;
      setListenArmed(false);
      setListenSecondsLeft(null);
      await runMusicScan(file);
    } catch (unexpected) {
      if (listenAbortRef.current === ac) listenAbortRef.current = null;
      setListenArmed(false);
      setListenSecondsLeft(null);
      if (ac.signal.aborted) return;
      const message = micErrorMessage(unexpected);
      if (message) setError(message);
    }
  }, [runMusicScan, stopMusicListen]);

  React.useEffect(() => () => listenAbortRef.current?.abort(), []);

  const runUploadAnalyze = React.useCallback(async (file: File) => {
    setError(null);
    setAnalysisRetryHint(false);

    if (!file.type.startsWith("video/") && !/\.(mp4|mov|webm|m4v)$/i.test(file.name)) {
      setError("Choose a video file (mp4, mov, webm).");
      return;
    }

    setLoadingStage(null);
    setLoadingPhase("analyze");

    try {
      const form = new FormData();
      form.append("video", file, file.name || "clip.mp4");

      const res = await fetchWithTimeout(
        new URL("/api/analyze-upload", window.location.origin),
        {
          method: "POST",
          body: form,
        },
        TIMEOUT_MS.video,
      );

      const payload = await readAnalyzeResponse(res, { onStage: onLoadingStage });

      if ("ok" in payload && payload.ok) {
        setStoredSourceUrl("");
        pushVideoHistory(payload, "");
        setHistoryRefreshToken((n) => n + 1);
        setResult(payload);
        writeAppPath("video", undefined, "push");
        return;
      }

      const err = payload as AnalyzeErrorBody;
      if (err.retrySuggested) setAnalysisRetryHint(true);
      setError(err.hint ? `${err.error}. ${err.hint}` : err.error);
    } catch (unexpected) {
      setError(caughtError(unexpected, "Unknown network error."));
    } finally {
      setLoadingPhase(null);
    }
  }, [onLoadingStage]);


  const clearStill = React.useCallback(() => {
    setStillResult(null);
    setStillPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, []);

  const runStillAnalyze = React.useCallback(async (file: File) => {
    setError(null);
    setAnalysisRetryHint(false);

    const looksLikeImage = file.type.startsWith("image/") || /\.(jpe?g|png|webp|gif)$/i.test(file.name);
    if (!looksLikeImage) {
      setError("Choose a JPEG, PNG, WebP, or GIF.");
      return;
    }

    setLoadingStage(null);
    setLoadingPhase("still");

    try {
      const form = new FormData();
      form.append("image", file, file.name || "picture.jpg");

      const res = await fetchWithTimeout(
        new URL("/api/analyze-still", window.location.origin),
        {
          method: "POST",
          body: form,
        },
        TIMEOUT_MS.music,
      );

      let payload: StillAnalyzeSuccess | StillAnalyzeErrorBody;
      try {
        payload = (await res.json()) as StillAnalyzeSuccess | StillAnalyzeErrorBody;
      } catch {
        throw new Error("Invalid response from server.");
      }

      if ("ok" in payload && payload.ok) {
        setStillPreview((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(file);
        });
        setStillResult(payload);
        writeAppPath("still", undefined, "push");
        return;
      }

      const err = payload as StillAnalyzeErrorBody;
      setError(err.hint ? `${err.error}. ${err.hint}` : err.error);
    } catch (unexpected) {
      setError(caughtError(unexpected, "Unknown network error."));
    } finally {
      setLoadingPhase(null);
    }
  }, []);

  const openHistoryEntry = React.useCallback((entry: AnalysisHistoryEntry) => {
    setError(null);
    setAnalysisRetryHint(false);
    clearStill();
    if (entry.kind === "music" && entry.music) {
      setResult(null);
      setStoredSourceUrl("");
      setStoredMusicSourceUrl(entry.sourceUrl);
      setMusicResult(entry.music);
      setMode("music");
      writeAppPath("music", entry.sourceUrl, "push");
      return;
    }
    if (entry.kind === "video" && entry.video) {
      setMusicResult(null);
      setStoredMusicSourceUrl("");
      setStoredSourceUrl(entry.sourceUrl);
      setResult(entry.video);
      setMode("video");
      writeAppPath("video", entry.sourceUrl, "push");
    }
  }, [clearStill]);

  const handleReset = React.useCallback(() => {
    setResult(null);
    setMusicResult(null);
    clearStill();
    setError(null);
    setAnalysisRetryHint(false);
    setStoredSourceUrl("");
    setStoredMusicSourceUrl("");
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(STORAGE_KEY);
      writeAppPath(mode, undefined, "replace");
    }
  }, [clearStill, mode]);

  const loadingUiPhase =
    loadingPhase === "download" ||
    loadingPhase === "download-music" ||
    loadingPhase === "music" ||
    loadingPhase === "still" ||
    loadingPhase === "scan"
      ? loadingPhase
      : "analyze";

  if (stillResult) {
    return (
      <>
        <LoadingScreen active={busy} phase={loadingUiPhase} stage={loadingStage} />
        <StillResultsScreen data={stillResult} previewUrl={stillPreview} onReset={handleReset} />
      </>
    );
  }

  if (musicResult) {
    return (
      <>
        <LoadingScreen active={busy} phase={loadingUiPhase} stage={loadingStage} />
        <MusicResultsScreen
          data={musicResult}
          downloadError={error}
          downloadBusy={loadingPhase === "download-music"}
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
        <LoadingScreen active={busy} phase={loadingUiPhase} stage={loadingStage} />
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
      <LoadingScreen active={busy} phase={loadingUiPhase} stage={loadingStage} />
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
          stopMusicListen();
          setMode(next);
          if (next !== "history") setUrl("");
          setError(null);
          setAnalysisRetryHint(false);
          if (next === "history") setHistoryRefreshToken((n) => n + 1);
          writeAppPath(next, undefined, "push");
        }}
        onRetryAnalysis={runAnalyze}
        onUploadFile={(file) => void (mode === "still" ? runStillAnalyze(file) : runUploadAnalyze(file))}
        onUploadMusicScan={(file) => void runMusicScan(file)}
        onListenMusic={() => void runMusicListen()}
        listenArmed={listenArmed}
        listenSecondsLeft={listenSecondsLeft}
        historyPanel={
          <HistoryPanel refreshToken={historyRefreshToken} onOpen={openHistoryEntry} />
        }
      />
    </main>
  );
}
