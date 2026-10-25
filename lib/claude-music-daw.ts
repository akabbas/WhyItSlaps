import Anthropic from "@anthropic-ai/sdk";
import type {
  DawId,
  ProduceStep,
  SpotifyAudioFeatures,
  SpotifyTrack,
} from "@/types/music-analysis";
import { stripJsonFence } from "@/lib/claude";

const DAW_LABELS: Record<Exclude<DawId, "ableton">, string> = {
  logic: "Logic Pro",
  fl: "FL Studio",
};

const DAW_DEVICE_HINTS: Record<Exclude<DawId, "ableton">, string> = {
  logic:
    "Use stock Logic tools only: Ultrabeat, Drum Machine Designer, ES2, Alchemy, Sculpture, Channel EQ, Compressor, ChromaVerb, Space Designer, Tape, Overdrive.",
  fl:
    "Use stock FL Studio tools only: FPC, Fruity Sampler, Sytrus, Harmor, 3x Osc, Fruity Parametric EQ 2, Fruity Compressor, Maximus, Fruity Reverb 2, Soundgoodizer.",
};

function coerceProduceSteps(parsed: unknown): ProduceStep[] {
  if (!Array.isArray(parsed)) throw new Error("DAW steps payload was not an array.");
  const steps = parsed.flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const r = row as Record<string, unknown>;
    const title = String(r.title ?? "").trim();
    const body = String(r.body ?? "").trim();
    if (!title || !body) return [];
    return [{ title, body }];
  });
  if (steps.length < 4) throw new Error("Expected at least 4 DAW production steps.");
  return steps.slice(0, 4);
}

export async function generateDawProduceSteps(
  daw: Exclude<DawId, "ableton">,
  track: SpotifyTrack,
  features: SpotifyAudioFeatures | null,
  productionContext: {
    vibe_summary: string;
    aesthetic_tags: string[];
    arrangement: { structure: string; density_strategy: string; signature_moment: string };
    sonic_textures: { name: string }[];
    reference_steps: ProduceStep[];
  },
): Promise<ProduceStep[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY");

  const anthropic = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-4-6";
  const dawLabel = DAW_LABELS[daw];

  const featuresBlock = features
    ? `Tempo: ${features.tempo_bpm} BPM | Key: ${features.key} | Energy: ${features.energy.toFixed(2)} | Danceability: ${features.danceability.toFixed(2)} | Valence: ${features.valence.toFixed(2)} | Acousticness: ${features.acousticness.toFixed(2)}`
    : "No Spotify audio features available.";

  const referenceBlock = productionContext.reference_steps
    .map((step, i) => `${i + 1}. ${step.title}\n${step.body}`)
    .join("\n\n");

  const systemPrompt = `You are WhyItSlaps — a senior music producer localizing a production recipe for ${dawLabel}.

Output JSON ONLY — no prose, no Markdown, no fences. Return ONE JSON array of EXACTLY 4 objects:
[{ "title": string, "body": string }, ...]

Rules:
- Mirror the same four step titles and workflow order as the Ableton reference steps provided.
- Rewrite each body for ${dawLabel} with that DAW's real stock plugins, menu paths, and routing.
- ${DAW_DEVICE_HINTS[daw]}
- Each body is 2–4 sentences. Be specific and actionable.
- Never use hyphens to join words. Write compound words as two separate words.`;

  const userPrompt = `Localize this production recipe for ${dawLabel}.

Track: ${track.title} by ${track.artist}
${featuresBlock}

Vibe: ${productionContext.vibe_summary}
Tags: ${productionContext.aesthetic_tags.join(", ")}
Structure: ${productionContext.arrangement.structure}
Density: ${productionContext.arrangement.density_strategy}
Signature moment: ${productionContext.arrangement.signature_moment}
Key textures: ${productionContext.sonic_textures.map((t) => t.name).join(", ")}

Ableton reference steps (keep titles and workflow order, rewrite bodies for ${dawLabel}):
${referenceBlock}`;

  const resp = await anthropic.messages.create({
    model,
    max_tokens: 1200,
    temperature: 0.35,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
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

  return coerceProduceSteps(parsedJson);
}
