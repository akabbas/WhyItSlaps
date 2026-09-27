export const TIMEOUT_MS = {
  video: 330_000,
  music: 90_000,
  scan: 150_000,
} as const;

export function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}, timeoutMs: number = TIMEOUT_MS.video): Promise<Response> {
  return fetch(input, { ...init, signal: AbortSignal.timeout(timeoutMs) });
}

export function timeoutMessage(err: unknown, fallback: string): string {
  if (err instanceof DOMException && (err.name === "TimeoutError" || err.name === "AbortError")) {
    return "That request took too long. Try again.";
  }
  const message = err instanceof Error ? err.message : fallback;
  if (/timed out|timeout|aborted/i.test(message)) return "That request took too long. Try again.";
  return message || fallback;
}
