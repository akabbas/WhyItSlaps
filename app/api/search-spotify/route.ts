import { NextResponse } from "next/server";

import { searchSpotifyTracks } from "@/lib/spotify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Success = {
  ok: true;
  tracks: Awaited<ReturnType<typeof searchSpotifyTracks>>;
};

type ErrorBody = {
  ok: false;
  error: string;
  hint?: string;
};

export async function POST(req: Request) {
  let body: { q?: string; limit?: number } = {};
  try {
    body = (await req.json()) as { q?: string; limit?: number };
  } catch {
    return NextResponse.json({ ok: false, error: "Malformed JSON." } satisfies ErrorBody, { status: 400 });
  }

  const q = typeof body.q === "string" ? body.q.trim() : "";
  if (!q) {
    return NextResponse.json({ ok: false, error: "Provide a search query." } satisfies ErrorBody, { status: 400 });
  }

  try {
    const tracks = await searchSpotifyTracks(q, body.limit ?? 5);
    if (!tracks.length) {
      return NextResponse.json(
        {
          ok: false,
          error: "No tracks matched that description.",
          hint: "Try artist + song name, or a clearer genre phrase.",
        } satisfies ErrorBody,
        { status: 404 },
      );
    }
    return NextResponse.json({ ok: true, tracks } satisfies Success);
  } catch (err) {
    const hint = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { ok: false, error: "Spotify search failed.", hint } satisfies ErrorBody,
      { status: 502 },
    );
  }
}
