import { NextResponse } from "next/server";

import { allowRequest, clientAddress } from "@/lib/rate-limit";

/** 8 calls per minute per IP per route. Returns a 429 response when exceeded. */
export function rateLimitResponse(req: Request, route: string, limit = 8): NextResponse | null {
  if (allowRequest(`${route}:${clientAddress(req)}`, limit, 60_000)) return null;
  return NextResponse.json(
    { ok: false, error: "Too many requests. Wait a minute and try again." },
    { status: 429 },
  );
}
