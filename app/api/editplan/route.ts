import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

import { stripJsonFence } from "@/lib/claude";
import type { AnalyzeSuccess } from "@/types/analysis";
import type {
  EditPlan,
  EditPlanMusicDirection,
  EditPlanRequestBody,
  EditPlanResponse,
  EditPlanSequenceEntry,
  EditPlanSoftwareSteps,
} from "@/types/editplan";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

const EDITPLAN_SYSTEM = `You are a professional video editor and creative director. You have just analyzed a reference video and produced an aesthetic breakdown. Now the user wants to edit their own footage to match that exact style.
Your job is to produce a precise, actionable shot-by-shot edit plan that a non-professional editor could follow in Premiere Pro or DaVinci Resolve.
Be extremely specific. Don't say "use a warm grade" — say "lift your blacks to around 15-20 IRE, push your mids toward amber (+10 hue on highlights), desaturate overall by about 20%, add a subtle vignette". Don't say "cut slowly" — say "hold this clip for exactly 4.5 seconds before cutting".
Return ONLY a valid JSON object with no markdown, no backticks, no extra text.
Return this exact structure:
{
"edit_overview": "2-3 sentence description of how this footage will be shaped to match the reference aesthetic",
"sequence": [
{
"position": 1,
"clip_label": "exact label from user's clip list",
"in_point": "suggested start point in the clip e.g. '0:03' or 'beginning'",
"hold_duration": "how many seconds to use from this clip",
"transition_in": "how to enter this clip: cut / fade from black / dissolve / etc",
"transition_out": "how to exit: cut / fade to black / dissolve / etc",
"color_grade_instructions": "specific, technical grading instructions for this clip",
"texture_overlay": "what grain/texture/overlay to add if any, and intensity",
"notes": "any other specific direction for this clip"
}
],
"global_grade_settings": "overall color grade settings to apply as a base across all clips before individual adjustments",
"music_direction": {
"tempo_bpm": "suggested BPM range",
"genre_mood": "specific genre and mood description",
"search_terms": "3-4 search terms to find the right track on Spotify or SoundCloud",
"sync_notes": "where in the edit music should swell, drop, or shift"
},
"software_steps": {
"premiere": "step by step instructions specific to Premiere Pro for setting up this edit",
"davinci": "step by step instructions specific to DaVinci Resolve for setting up this edit"
},
"pro_tips": [
"3-5 advanced tips specific to nailing this aesthetic that go beyond the basic steps"
]
}
When building the sequence, respect the target duration the user gave. Select and order clips to best match the pacing and rhythm of the reference video's edit style. If the user has more footage than needed, choose the clips that best fit the aesthetic. If they have less, suggest how to extend or repeat clips tastefully.`;

function requireString(val: unknown, field: string): string {
  if (typeof val !== "string") throw new Error(`Invalid or missing string field: ${field}`);
  return val;
}

function coercePosition(val: unknown, field: string): number {
  if (typeof val === "number" && Number.isFinite(val)) return Math.round(val);
  if (typeof val === "string" && val.trim() && Number.isFinite(Number(val))) return Math.round(Number(val));
  throw new Error(`Invalid number field: ${field}`);
}

function coerceEditPlan(parsed: unknown): EditPlan {
  if (!parsed || typeof parsed !== "object") throw new Error("Edit plan JSON was not an object.");

  const p = parsed as Record<string, unknown>;

  const edit_overview = requireString(p.edit_overview, "edit_overview");
  const global_grade_settings = requireString(p.global_grade_settings, "global_grade_settings");

  if (!Array.isArray(p.sequence) || p.sequence.length === 0) {
    throw new Error("sequence must be a non-empty array.");
  }

  const sequence: EditPlanSequenceEntry[] = p.sequence.map((row, i) => {
    if (!row || typeof row !== "object") throw new Error(`sequence[${i}] must be an object.`);
    const r = row as Record<string, unknown>;
    return {
      position: coercePosition(r.position, `sequence[${i}].position`),
      clip_label: requireString(r.clip_label, `sequence[${i}].clip_label`),
      in_point: requireString(r.in_point, `sequence[${i}].in_point`),
      hold_duration: requireString(r.hold_duration, `sequence[${i}].hold_duration`),
      transition_in: requireString(r.transition_in, `sequence[${i}].transition_in`),
      transition_out: requireString(r.transition_out, `sequence[${i}].transition_out`),
      color_grade_instructions: requireString(r.color_grade_instructions, `sequence[${i}].color_grade_instructions`),
      texture_overlay: requireString(r.texture_overlay, `sequence[${i}].texture_overlay`),
      notes: requireString(r.notes, `sequence[${i}].notes`),
    };
  });

  if (!p.music_direction || typeof p.music_direction !== "object") {
    throw new Error("music_direction must be an object.");
  }
  const md = p.music_direction as Record<string, unknown>;
  const music_direction: EditPlanMusicDirection = {
    tempo_bpm: requireString(md.tempo_bpm, "music_direction.tempo_bpm"),
    genre_mood: requireString(md.genre_mood, "music_direction.genre_mood"),
    search_terms: requireString(md.search_terms, "music_direction.search_terms"),
    sync_notes: requireString(md.sync_notes, "music_direction.sync_notes"),
  };

  if (!p.software_steps || typeof p.software_steps !== "object") {
    throw new Error("software_steps must be an object.");
  }
  const sw = p.software_steps as Record<string, unknown>;
  const software_steps: EditPlanSoftwareSteps = {
    premiere: requireString(sw.premiere, "software_steps.premiere"),
    davinci: requireString(sw.davinci, "software_steps.davinci"),
  };

  if (!Array.isArray(p.pro_tips)) throw new Error("pro_tips must be an array.");
  const pro_tips = p.pro_tips.map((t, i) => {
    if (typeof t !== "string") throw new Error(`pro_tips[${i}] must be a string.`);
    return t;
  });

  return {
    edit_overview,
    sequence,
    global_grade_settings,
    music_direction,
    software_steps,
    pro_tips,
  };
}

function formatClipsForPrompt(
  clips: EditPlanRequestBody["clips"],
): string {
  return clips
    .map((c, i) => {
      const label = c.label.trim();
      const desc = c.description.trim();
      return `${i + 1}. Label: ${label}\n   Duration (seconds): ${c.duration}\n   Description: ${desc}`;
    })
    .join("\n\n");
}

function buildUserMessage(body: EditPlanRequestBody): string {
  const parts: string[] = [];
  parts.push("Here is the reference video analysis:");
  parts.push(JSON.stringify(body.analysis, null, 2));
  parts.push("");
  parts.push("The user's clips:");
  parts.push(formatClipsForPrompt(body.clips));
  parts.push("");
  parts.push(`Target duration (seconds): ${body.targetDuration}`);
  if (typeof body.notes === "string" && body.notes.trim()) {
    parts.push("");
    parts.push("Additional notes from the user:");
    parts.push(body.notes.trim());
  }
  return parts.join("\n");
}

function isAnalyzeSuccess(v: unknown): v is AnalyzeSuccess {
  return !!v && typeof v === "object" && (v as AnalyzeSuccess).ok === true;
}

function parseRequestBody(raw: unknown): { ok: true; body: EditPlanRequestBody } | { ok: false; error: string; hint?: string } {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "Malformed JSON body." };
  }
  const o = raw as Record<string, unknown>;

  if (!isAnalyzeSuccess(o.analysis)) {
    return { ok: false, error: "analysis must be a successful analyze payload (ok: true).", hint: "Pass the full result object from /api/analyze." };
  }

  if (!Array.isArray(o.clips)) {
    return { ok: false, error: "clips must be an array." };
  }
  if (o.clips.length < 1 || o.clips.length > 20) {
    return { ok: false, error: "Provide between 1 and 20 clips.", hint: `Received ${o.clips.length} clip(s).` };
  }

  const clips: EditPlanRequestBody["clips"] = [];
  for (let i = 0; i < o.clips.length; i++) {
    const row = o.clips[i];
    if (!row || typeof row !== "object") {
      return { ok: false, error: `clips[${i}] must be an object.` };
    }
    const r = row as Record<string, unknown>;
    const label = typeof r.label === "string" ? r.label.trim() : "";
    const description = typeof r.description === "string" ? r.description.trim() : "";
    const duration = typeof r.duration === "number" ? r.duration : Number(r.duration);

    if (!label) return { ok: false, error: `clips[${i}].label must be non-empty.` };
    if (!description) return { ok: false, error: `clips[${i}].description must be non-empty.` };
    if (!Number.isFinite(duration) || duration <= 0) {
      return { ok: false, error: `clips[${i}].duration must be a positive finite number.` };
    }
    clips.push({ label, duration, description });
  }

  const targetDuration =
    typeof o.targetDuration === "number" ? o.targetDuration : Number(o.targetDuration);
  if (!Number.isFinite(targetDuration) || targetDuration <= 0) {
    return { ok: false, error: "targetDuration must be a positive finite number." };
  }

  const notes = o.notes === undefined || o.notes === null ? undefined : String(o.notes);

  return {
    ok: true,
    body: {
      analysis: o.analysis,
      clips,
      targetDuration,
      notes,
    },
  };
}

export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    const err: EditPlanResponse = { ok: false, error: "Malformed JSON.", hint: "Send a JSON object body." };
    return NextResponse.json(err, { status: 400 });
  }

  const parsedBody = parseRequestBody(raw);
  if (!parsedBody.ok) {
    const err: EditPlanResponse = { ok: false, error: parsedBody.error, hint: parsedBody.hint };
    return NextResponse.json(err, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    const err: EditPlanResponse = { ok: false, error: "Server is not configured for AI (missing API key)." };
    return NextResponse.json(err, { status: 500 });
  }

  const anthropic = new Anthropic({ apiKey });
  const userText = buildUserMessage(parsedBody.body);

  let textOut = "";
  try {
    const resp = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8192,
      temperature: 0.35,
      system: EDITPLAN_SYSTEM,
      messages: [{ role: "user", content: userText }],
    });
    for (const block of resp.content) {
      if (block.type === "text") textOut += block.text;
    }
    if (!textOut.trim()) throw new Error("Claude returned no text.");
  } catch (e) {
    const hint = e instanceof Error ? e.message : String(e);
    const err: EditPlanResponse = {
      ok: false,
      error: "Could not generate an edit plan from the model.",
      hint,
    };
    return NextResponse.json(err, { status: 502 });
  }

  let json: unknown;
  try {
    json = JSON.parse(stripJsonFence(textOut));
  } catch (e) {
    const hint = e instanceof Error ? e.message : String(e);
    const err: EditPlanResponse = {
      ok: false,
      error: "Model output was not valid JSON.",
      hint,
    };
    return NextResponse.json(err, { status: 502 });
  }

  let plan: EditPlan;
  try {
    plan = coerceEditPlan(json);
  } catch (e) {
    const hint = e instanceof Error ? e.message : String(e);
    const err: EditPlanResponse = {
      ok: false,
      error: "Model JSON did not match the expected edit plan shape.",
      hint,
    };
    return NextResponse.json(err, { status: 502 });
  }

  const ok: EditPlanResponse = { ok: true, plan };
  return NextResponse.json(ok, { status: 200 });
}
