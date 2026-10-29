const hits = new Map<string, number[]>();

export function resetRateLimits(): void {
  hits.clear();
}

/** True when this key is still inside the limit. */
export function allowRequest(key: string, limit: number, windowMs: number, now = Date.now()): boolean {
  const fresh = (hits.get(key) ?? []).filter((stamp) => now - stamp < windowMs);
  if (fresh.length >= limit) {
    hits.set(key, fresh);
    return false;
  }
  fresh.push(now);
  hits.set(key, fresh);
  return true;
}

export function clientAddress(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || req.headers.get("x-real-ip")?.trim() || "local";
}
