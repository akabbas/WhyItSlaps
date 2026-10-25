import Anthropic from "@anthropic-ai/sdk";
import type { ContentBlockParam, ImageBlockParam } from "@anthropic-ai/sdk/resources";

import { stripJsonFence } from "@/lib/claude";
import { SPEAKER, STILL_CRAFT } from "@/lib/dialogue";
import type { StillAnalysis, StillAnalysisScores, StillMedium } from "@/types/still-analysis";

const STILL_SYSTEM_PROMPT = `${SPEAKER}

${STILL_CRAFT}

You MUST output JSON ONLY — no prose, Markdown, headings, fences, or trailing commentary. Respond with ONE JSON object obeying exactly this schema and key names:

{
  "vibe_summary": string,
  "aesthetic_tags": string[],
  "medium": "photo" | "painting" | "print" | "other",
  "target_viewer": string,
  "scores": {
    "composition": number,
    "light": number,
    "color_harmony": number,
    "subject": number,
    "overall_vibe": number
  },
  "framing": string,
  "light": string,
  "color": string,
  "why_it_works": [
    { "title": string, "detail": string }
  ],
  "how_to_make": [
    { "summary": string }
  ]
}

Rules:
- All five score fields are integers 0–100.
- aesthetic_tags: 6–10 sharp lowercase tokens.
- medium is photo, painting, print, or other. Pick from what the picture looks like.
- target_viewer: one sentence naming who this picture is for.
- framing, light, and color are 2 sentences each. Point at something in the picture.
- why_it_works: EXACTLY four objects.
- how_to_make: EXACTLY four imperative steps. For a photograph, steps are how to shoot one like this. For a painting or print, steps are how to make one like this.
- No camera, lens, aperture, shutter, or ISO. None was read from the file.`;

const MEDIUMS = new Set<StillMedium>(["photo", "painting", "print", "other"]);

function clampScore(n: unknown): number {
  const v = typeof n === "number" ? n : Number.parseInt(String(n), 10);
  if (!Number.isFinite(v)) return 0;
  return Math.min(100, Math.max(0, Math.round(v)));
}

export function coerceStillAnalysis(parsed: unknown): StillAnalysis {
  if (!parsed || typeof parsed !== "object") throw new Error("Model payload was empty.");
  const p = parsed as Record<string, unknown>;
  const rawScores = p.scores && typeof p.scores === "object" ? (p.scores as Record<string, unknown>) : {};

  const scores: StillAnalysisScores = {
    composition: clampScore(rawScores.composition),
    light: clampScore(rawScores.light),
    color_harmony: clampScore(rawScores.color_harmony),
    subject: clampScore(rawScores.subject),
    overall_vibe: clampScore(rawScores.overall_vibe),
  };

  const mediumRaw = typeof p.medium === "string" ? p.medium : "other";
  const medium: StillMedium = MEDIUMS.has(mediumRaw as StillMedium) ? (mediumRaw as StillMedium) : "other";

  const whyRaw = Array.isArray(p.why_it_works) ? p.why_it_works : [];
  const why_it_works = whyRaw.flatMap((row) =>
    typeof row === "object" && row
      ? [
          {
            title: String((row as { title?: unknown }).title ?? ""),
            detail: String((row as { detail?: unknown }).detail ?? ""),
          },
        ]
      : [],
  );

  const howRaw = Array.isArray(p.how_to_make) ? p.how_to_make : [];
  const how_to_make = howRaw.flatMap((row) =>
    typeof row === "object" && row ? [{ summary: String((row as { summary?: unknown }).summary ?? "") }] : [],
  );

  return {
    vibe_summary: typeof p.vibe_summary === "string" ? p.vibe_summary : "",
    aesthetic_tags: Array.isArray(p.aesthetic_tags) ? p.aesthetic_tags.map((t) => String(t)) : [],
    medium,
    target_viewer: typeof p.target_viewer === "string" ? p.target_viewer : "",
    scores,
    framing: typeof p.framing === "string" ? p.framing : "",
    light: typeof p.light === "string" ? p.light : "",
    color: typeof p.color === "string" ? p.color : "",
    why_it_works,
    how_to_make,
  };
}

export type StillImageMedia = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

export async function analyzeStillWithClaude(imageBase64: string, mediaType: StillImageMedia): Promise<StillAnalysis> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY");

  const anthropic = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-4-6";

  const image: ImageBlockParam = {
    type: "image",
    source: { type: "base64", media_type: mediaType, data: imageBase64 },
  };

  const contentBlocks: ContentBlockParam[] = [
    {
      type: "text",
      text: "One still picture is attached. No EXIF was read. Judge only what you can see.",
    },
    image,
  ];

  const resp = await anthropic.messages.create({
    model,
    max_tokens: 2200,
    temperature: 0.38,
    system: STILL_SYSTEM_PROMPT,
    messages: [{ role: "user", content: contentBlocks }],
  });

  let textOut = "";
  for (const block of resp.content) {
    if (block.type === "text") textOut += block.text;
  }
  if (!textOut.trim()) throw new Error("Model returned no text.");

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(stripJsonFence(textOut));
  } catch {
    throw new Error("Model output was not valid JSON.");
  }

  try {
    return coerceStillAnalysis(parsedJson);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Unable to coerce model payload: ${msg}`);
  }
}
