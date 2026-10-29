const UNSAFE =
  /yt-dlp|ffmpeg|ffprobe|\/tmp\/|\/users\/|\/home\/|node_modules|\bat\s+\S+\(|\bEACCES\b|\bECONN|\bENOTFOUND\b|stderr|stdout|api[_ ]?key|secret|token|bearer |ANTHROPIC|SPOTIFY_CLIENT/i;

/** A short message safe to show in the browser. Tool output and secrets are dropped. */
export function safeHint(value: unknown): string | undefined {
  const message = value instanceof Error ? value.message : typeof value === "string" ? value : "";
  const trimmed = message.replace(/\s+/g, " ").trim();
  if (!trimmed || trimmed.length > 160) return undefined;
  if (UNSAFE.test(trimmed)) return undefined;
  if (!trimmed.includes(" ") && /[_/\\]/.test(trimmed)) return undefined;
  return trimmed;
}

/**
 * Prefer a safe sentence we threw on purpose. Otherwise return the fallback
 * and never attach raw process output.
 */
export function publicFailure(err: unknown, fallback: string): { error: string; hint?: string } {
  const hint = safeHint(err);
  if (!hint) return { error: fallback };
  return { error: hint };
}
