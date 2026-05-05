"use client";

import React from "react";

import type { AnalyzeErrorBody, AnalyzeSuccess } from "@/types/analysis";

import { filenameFromContentDisposition } from "@/lib/clientDownload";

import { InputScreen } from "@/components/InputScreen";
import { LoadingScreen } from "@/components/LoadingScreen";
import { ResultsScreen } from "@/components/ResultsScreen";

const STORAGE_KEY = "vibecheck:last-result";

type StoredEnvelopeV1 = { v: 1; result: AnalyzeSuccess; url: string };

function parsePayload(json: string): { result: AnalyzeSuccess; url: string } | null {
  try {
    const data = JSON.parse(json) as unknown;
    if (!data || typeof data !== "object") return null;

    const o = data as Record<string, unknown>;
    if (o.v === 1 && o.result && typeof o.result === "object" && (o.result as AnalyzeSuccess).ok === true) {
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

export default function HomePage() {
  const [url, setUrl] = React.useState("");
  const [storedSourceUrl, setStoredSourceUrl] = React.useState("");
  /** null = idle; otherwise which long-running UX to show under the splash */
  const [loadingPhase, setLoadingPhase] = React.useState<null | "analyze" | "download">(null);
  const busy = loadingPhase !== null;

  const [error, setError] = React.useState<string | null>(null);
  const [claudeRetryHint, setClaudeRetryHint] = React.useState(false);
  const [result, setResult] = React.useState<AnalyzeSuccess | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const cached = window.sessionStorage.getItem(STORAGE_KEY);
    if (!cached) return;
    const parsed = parsePayload(cached);
    if (parsed) {
      setResult(parsed.result);
      setStoredSourceUrl(parsed.url);
    }
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined" || !result) return;
    const body: StoredEnvelopeV1 = { v: 1, result, url: storedSourceUrl };
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(body));
  }, [result, storedSourceUrl]);

  const guessFilename = React.useCallback((rawUrl: string) => {
    try {
      const host = new URL(rawUrl.trim()).hostname.replace(/^www\./, "").replace(/[^a-z0-9]/gi, "-");
      return `${host.slice(0, 36) || "vibecheck"}-clip.mp4`;
    } catch {
      return "vibecheck-clip.mp4";
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
      const filename = filenameFromContentDisposition(disposition, fallback);

      const blob = await res.blob();

      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(a.href), 2800);
    } catch (unexpected) {
      setError(unexpected instanceof Error ? unexpected.message : "Browser could not finish the download.");
    } finally {
      setLoadingPhase(null);
    }
  }, [guessFilename]);

  const runAnalyze = React.useCallback(async () => {
    setError(null);
    setClaudeRetryHint(false);
    const target = url.trim();
    if (!target) {
      setError("paste a full https link first.");
      return;
    }

    setLoadingPhase("analyze");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: target }),
      });

      const payload = (await res.json()) as AnalyzeSuccess | AnalyzeErrorBody;

      if ("ok" in payload && payload.ok) {
        setStoredSourceUrl(target);
        setResult(payload);
        return;
      }

      const err = payload as AnalyzeErrorBody;

      if (err.retrySuggested) {
        setClaudeRetryHint(true);
      }

      const glue = err.hint ? `${err.error} — ${err.hint}` : err.error;
      setError(glue);
    } catch (unexpected) {
      setError(unexpected instanceof Error ? unexpected.message : "Unknown network error.");
    } finally {
      setLoadingPhase(null);
    }
  }, [url]);

  const handleReset = React.useCallback(() => {
    setResult(null);
    setError(null);
    setClaudeRetryHint(false);
    setStoredSourceUrl("");
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  if (result) {
    return (
      <>
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
      <LoadingScreen active={busy} phase={loadingPhase === "download" ? "download" : "analyze"} />
      <InputScreen
        error={error}
        value={url}
        disabled={busy}
        retryClaudeHint={claudeRetryHint}
        onChange={(next) => {
          setUrl(next);
          if (error) setError(null);
        }}
        onAnalyze={runAnalyze}
        onDownload={() => void triggerDownloadForUrl(url)}
        onRetryClaude={runAnalyze}
      />
    </main>
  );
}
