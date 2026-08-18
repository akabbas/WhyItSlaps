import { NextResponse } from "next/server";
import { generateDawProduceSteps } from "@/lib/claude-music-daw";
import type {
  DawId,
  DawStepsErrorBody,
  DawStepsRequestBody,
  DawStepsSuccess,
  ProduceStep,
} from "@/types/music-analysis";

export const runtime = "nodejs";
export const maxDuration = 45;
export const dynamic = "force-dynamic";

const VALID_DAWS = new Set<Exclude<DawId, "ableton">>(["logic", "fl"]);

function isProduceStep(value: unknown): value is ProduceStep {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return typeof row.title === "string" && typeof row.body === "string";
}

export async function POST(req: Request) {
  let body: Partial<DawStepsRequestBody> = {};
  try {
    body = (await req.json()) as Partial<DawStepsRequestBody>;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Malformed JSON." } satisfies DawStepsErrorBody,
      { status: 400 },
    );
  }

  const daw = body.daw;
  if (!daw || !VALID_DAWS.has(daw)) {
    return NextResponse.json(
      { ok: false, error: "Provide daw as logic or fl." } satisfies DawStepsErrorBody,
      { status: 400 },
    );
  }

  const track = body.track;
  if (!track || typeof track !== "object" || !track.title?.trim() || !track.artist?.trim()) {
    return NextResponse.json(
      { ok: false, error: "Missing track context." } satisfies DawStepsErrorBody,
      { status: 400 },
    );
  }

  const ctx = body.production_context;
  if (!ctx || typeof ctx !== "object") {
    return NextResponse.json(
      { ok: false, error: "Missing production_context." } satisfies DawStepsErrorBody,
      { status: 400 },
    );
  }

  const referenceSteps = Array.isArray(ctx.reference_steps)
    ? ctx.reference_steps.filter(isProduceStep)
    : [];
  if (referenceSteps.length < 4) {
    return NextResponse.json(
      { ok: false, error: "Need four Ableton reference steps." } satisfies DawStepsErrorBody,
      { status: 400 },
    );
  }

  try {
    const steps = await generateDawProduceSteps(
      daw,
      track,
      body.features ?? null,
      {
        vibe_summary: String(ctx.vibe_summary ?? ""),
        aesthetic_tags: Array.isArray(ctx.aesthetic_tags) ? ctx.aesthetic_tags.map(String) : [],
        arrangement: {
          structure: String(ctx.arrangement?.structure ?? ""),
          density_strategy: String(ctx.arrangement?.density_strategy ?? ""),
          signature_moment: String(ctx.arrangement?.signature_moment ?? ""),
        },
        sonic_textures: Array.isArray(ctx.sonic_textures)
          ? ctx.sonic_textures.flatMap((t) => {
              if (!t || typeof t !== "object") return [];
              const name = String((t as { name?: unknown }).name ?? "").trim();
              return name ? [{ name }] : [];
            })
          : [],
        reference_steps: referenceSteps,
      },
    );

    const payload: DawStepsSuccess = { ok: true, daw, steps };
    return NextResponse.json(payload, { status: 200 });
  } catch (err) {
    const hint = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { ok: false, error: "Could not generate DAW steps.", hint } satisfies DawStepsErrorBody,
      { status: 502 },
    );
  }
}
