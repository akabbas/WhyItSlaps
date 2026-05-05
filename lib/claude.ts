import Anthropic from "@anthropic-ai/sdk";
import type { ContentBlockParam } from "@anthropic-ai/sdk/resources";
import type { ClaudeAnalysis, ClaudeAnalysisScores } from "@/types/analysis";

export const SYSTEM_PROMPT = `You are VibeCheck — a senior creative director judging short-form aesthetics (TikTok, Reels, Shorts).

You MUST output JSON ONLY — no prose, Markdown, headings, fences, or trailing commentary. Respond with ONE JSON object obeying exactly this schema and key names:

{
  "vibe_summary": string,
  "aesthetic_tags": string[],
  "target_audience": string,
  "scores": {
    "color_harmony": number,
    "edit_pacing": number,
    "motion_feel": number,
    "subject_framing": number,
    "overall_vibe": number
  },
  "cinematography": {
    "framing_composition": string,
    "lens_and_motion": string,
    "depth_focus_light": string
  },
  "color_grade": {
    "palette_mood": string,
    "contrast_curve": string,
    "skin_environment": string
  },
  "edit_style": {
    "pacing_badge": string,
    "cut_pattern": string,
    "transitions": string
  },
  "why_it_works": [
    { "title": string, "detail": string }
  ],
  "how_to_edit_like_this": [
    { "summary": string }
  ]
}

Rules:
- All five score fields are integers 0–100 (not floats, not strings). Do NOT include music_sync or any other score key.
- aesthetic_tags: 6–12 sharp lowercase tokens (comma-free); target_audience: one conversational sentence naming who this resonates with.
- Cinematography and color_grade string fields stay concise-yet-visual (2 sentences each).
- pacing_badge MUST begin with exactly one tempo word in lowercase chosen from hyper, fast, mid, slow (you may extend with an em dash + clause after that word).
- cut_pattern and transitions must reflect what you infer from the sampled frames and their implied cadence.
- why_it_works needs EXACTLY four ordered objects explaining emotional leverage.
- how_to_edit_like_this needs EXACTLY four imperative editing steps reflecting the inferred workflow.
- If evidence is uncertain, tuck the caveat inside the paragraph that is ambiguous — never add extra keys outside the schema.`;

export function stripJsonFence(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith("```")) {
    return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/```$/i, "").trim();
  }
  return trimmed;
}

function clampScore(n: unknown): number {
  const v = typeof n === "number" ? n : Number.parseInt(String(n), 10);
  if (!Number.isFinite(v)) return 0;
  return Math.min(100, Math.max(0, Math.round(v)));
}

export function coerceAnalysis(parsed: unknown): ClaudeAnalysis {
  if (!parsed || typeof parsed !== "object") throw new Error("Claude payload was empty.");

  const p = parsed as Record<string, unknown>;
  const rawScores = p.scores && typeof p.scores === "object" ? (p.scores as Record<string, unknown>) : {};

  const scores: ClaudeAnalysisScores = {
    color_harmony: clampScore(rawScores.color_harmony),
    edit_pacing: clampScore(rawScores.edit_pacing),
    motion_feel: clampScore(rawScores.motion_feel),
    subject_framing: clampScore(rawScores.subject_framing),
    overall_vibe: clampScore(rawScores.overall_vibe),
  };

  const vibe_summary = typeof p.vibe_summary === "string" ? p.vibe_summary : "";
  const aesthetic_tags = Array.isArray(p.aesthetic_tags) ? p.aesthetic_tags.map((t) => String(t)) : [];
  const target_audience = typeof p.target_audience === "string" ? p.target_audience : "";

  const cinematographySrc = typeof p.cinematography === "object" && p.cinematography ? (p.cinematography as Record<string, unknown>) : {};
  const colorSrc = typeof p.color_grade === "object" && p.color_grade ? (p.color_grade as Record<string, unknown>) : {};
  const editSrc = typeof p.edit_style === "object" && p.edit_style ? (p.edit_style as Record<string, unknown>) : {};

  const cinematography = {
    framing_composition: String(cinematographySrc.framing_composition ?? ""),
    lens_and_motion: String(cinematographySrc.lens_and_motion ?? ""),
    depth_focus_light: String(cinematographySrc.depth_focus_light ?? ""),
  };

  const color_grade = {
    palette_mood: String(colorSrc.palette_mood ?? ""),
    contrast_curve: String(colorSrc.contrast_curve ?? ""),
    skin_environment: String(colorSrc.skin_environment ?? ""),
  };

  const edit_style = {
    pacing_badge: String(editSrc.pacing_badge ?? ""),
    cut_pattern: String(editSrc.cut_pattern ?? ""),
    transitions: String(editSrc.transitions ?? ""),
  };

  const whyRaw = Array.isArray(p.why_it_works) ? p.why_it_works : [];
  const why_it_works = whyRaw.flatMap((row) =>
    typeof row === "object" && row && row !== null
      ? [
          {
            title: String((row as { title?: unknown }).title ?? ""),
            detail: String((row as { detail?: unknown }).detail ?? ""),
          },
        ]
      : [],
  );

  const howRaw = Array.isArray(p.how_to_edit_like_this) ? p.how_to_edit_like_this : [];
  const how_to_edit_like_this = howRaw.flatMap((row) =>
    typeof row === "object" && row && row !== null
      ? [{ summary: String((row as { summary?: unknown }).summary ?? "") }]
      : [],
  );

  return {
    vibe_summary,
    aesthetic_tags,
    target_audience,
    scores,
    cinematography,
    color_grade,
    edit_style,
    why_it_works,
    how_to_edit_like_this,
  };
}

export async function analyzeWithClaude(base64Keyframes: string[]): Promise<ClaudeAnalysis> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY");

  const anthropic = new Anthropic({ apiKey });

  const model =
    process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-4-5";

  const preamble =
    base64Keyframes.length <= 1
      ? "You have one JPEG keyframe from an ≤60s short. Infer everything else honestly."
      : "JPEG timeline stack is chronological with ~4s spacing across an ≤60s short video.";

  const contentBlocks: ContentBlockParam[] = [
    { type: "text", text: preamble },
    ...base64Keyframes.map(
      (data): ContentBlockParam => ({
        type: "image",
        source: { type: "base64", media_type: "image/jpeg", data },
      }),
    ),
  ];

  const resp = await anthropic.messages.create({
    model,
    max_tokens: 2800,
    temperature: 0.38,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: contentBlocks }],
  });

  let textOut = "";
  for (const block of resp.content) {
    if (block.type === "text") textOut += block.text;
  }

  if (!textOut.trim()) throw new Error("Claude returned no text.");

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(stripJsonFence(textOut));
  } catch {
    throw new Error("Claude output was not valid JSON.");
  }

  try {
    return coerceAnalysis(parsedJson);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Unable to coerce Claude payload: ${msg}`);
  }
}
