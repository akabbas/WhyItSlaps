import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Cheap liveness probe for Railway / load balancers. */
export async function GET() {
  return NextResponse.json(
    { ok: true, service: "whyitslaps" },
    { status: 200, headers: { "cache-control": "no-store" } },
  );
}
