import Anthropic from "@anthropic-ai/sdk";
import type {
  SpotifyTrack,
  SpotifyAudioFeatures,
  ClaudeMusicAnalysis,
  MusicAnalysisScores,
  SonicTexture,
  EnergyArcSegment,
  ProduceStep,
} from "@/types/music-analysis";
import { stripJsonFence } from "@/lib/claude";

const MUSIC_SYSTEM_PROMPT = `You are WhyItSlaps — a senior music producer and creative director who decodes why songs hit hard.

You MUST output JSON ONLY — no prose, no Markdown, no fences, no trailing commentary. Respond with ONE JSON object obeying this schema exactly:

{
  "vibe_summary": string,
  "aesthetic_tags": string[],
  "target_listener": string,
  "scores": {
    "hook_strength": number,
    "production_density": number,
    "emotional_range": number,
    "originality": number,
    "mix_clarity": number,
    "overall_vibe": number
  },
  "sonic_textures": [
    { "name": string, "description": string }
  ],
  "energy_arc": [
    { "label": string, "note": string, "energy_level": "low" | "mid" | "high" | "peak" }
  ],
  "arrangement": {
    "structure": string,
    "density_strategy": string,
    "signature_moment": string
  },
  "mix_profile": {
    "low_end": string,
    "midrange": string,
    "high_end": string,
    "width": string
  },
  "why_it_works": [
    { "title": string, "detail": string }
  ],
  "how_to_produce": [
    { "title": string, "body": string }
  ]
}

Rules:
- All six score fields are integers 0–100. No other score keys.
- vibe_summary: 2–3 punchy, opinionated sentences. Write like a creative director, not a music journalist. No hedging.
- aesthetic_tags: 6–10 sharp lowercase tokens describing the sonic identity of this track.
- target_listener: one vivid sentence naming who this resonates with and why.
- sonic_textures: EXACTLY 6 objects naming the most notable sonic layers. Each description is 1–2 short sentences.
- energy_arc: 4–6 objects mapping the song's energy journey through its sections (Intro, Verse, Pre Chorus, Chorus, Bridge, Outro as relevant).
- arrangement.structure: concise shorthand of full song form (e.g., "Intro → V → Pre → Ch → V → Pre → Ch → Bridge → Ch × 2 → Outro").
- mix_profile: each string is 1–2 sentences, specific to this production style inferred from the audio features provided.
- why_it_works: EXACTLY 4 objects. Each must name a specific sonic or structural mechanism and explain the psychological or emotional effect it produces.
- how_to_produce: EXACTLY 4 objects with concrete, DAW-agnostic production steps a producer could follow to recreate this sound.
- CRITICAL: Never use hyphens to join words in any text output. Write compound words as two separate words (e.g., "close mic" not "close-mic", "mid gain" not "mid-gain", "double tracked" not "double-tracked", "high passed" not "high-passed").`;

const VALID_LEVELS = new Set(["low", "mid", "high", "peak"]);

function clampScore(n: unknown): number {
  const v = typeof n === "number" ? n : Number.parseInt(String(n), 10);
  if (!Number.isFinite(v)) return 0;
  return Math.min(100, Math.max(0, Math.round(v)));
}

function coerceMusicAnalysis(parsed: unknown): ClaudeMusicAnalysis {
  if (!parsed || typeof parsed !== "object") throw new Error("Claude music payload was empty.");
  const p = parsed as Record<string, unknown>;

  const rawScores =
    p.scores && typeof p.scores === "object" ? (p.scores as Record<string, unknown>) : {};
  const scores: MusicAnalysisScores = {
    hook_strength: clampScore(rawScores.hook_strength),
    production_density: clampScore(rawScores.production_density),
    emotional_range: clampScore(rawScores.emotional_range),
    originality: clampScore(rawScores.originality),
    mix_clarity: clampScore(rawScores.mix_clarity),
    overall_vibe: clampScore(rawScores.overall_vibe),
  };

  const sonic_textures: SonicTexture[] = (Array.isArray(p.sonic_textures) ? p.sonic_textures : []).flatMap(
    (t) => {
      if (!t || typeof t !== "object") return [];
      const r = t as Record<string, unknown>;
      return [{ name: String(r.name ?? ""), description: String(r.description ?? "") }];
    },
  );

  const energy_arc: EnergyArcSegment[] = (Array.isArray(p.energy_arc) ? p.energy_arc : []).flatMap(
    (seg) => {
      if (!seg || typeof seg !== "object") return [];
      const s = seg as Record<string, unknown>;
      const level = String(s.energy_level ?? "mid");
      return [
        {
          label: String(s.label ?? ""),
          note: String(s.note ?? ""),
          energy_level: (VALID_LEVELS.has(level) ? level : "mid") as EnergyArcSegment["energy_level"],
        },
      ];
    },
  );

  const arrSrc =
    p.arrangement && typeof p.arrangement === "object"
      ? (p.arrangement as Record<string, unknown>)
      : {};
  const arrangement = {
    structure: String(arrSrc.structure ?? ""),
    density_strategy: String(arrSrc.density_strategy ?? ""),
    signature_moment: String(arrSrc.signature_moment ?? ""),
  };

  const mixSrc =
    p.mix_profile && typeof p.mix_profile === "object"
      ? (p.mix_profile as Record<string, unknown>)
      : {};
  const mix_profile = {
    low_end: String(mixSrc.low_end ?? ""),
    midrange: String(mixSrc.midrange ?? ""),
    high_end: String(mixSrc.high_end ?? ""),
    width: String(mixSrc.width ?? ""),
  };

  const why_it_works = (Array.isArray(p.why_it_works) ? p.why_it_works : []).flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const r = row as Record<string, unknown>;
    return [{ title: String(r.title ?? ""), detail: String(r.detail ?? "") }];
  });

  const how_to_produce: ProduceStep[] = (Array.isArray(p.how_to_produce) ? p.how_to_produce : []).flatMap(
    (row) => {
      if (!row || typeof row !== "object") return [];
      const r = row as Record<string, unknown>;
      return [{ title: String(r.title ?? ""), body: String(r.body ?? "") }];
    },
  );

  return {
    vibe_summary: String(p.vibe_summary ?? ""),
    aesthetic_tags: Array.isArray(p.aesthetic_tags) ? p.aesthetic_tags.map(String) : [],
    target_listener: String(p.target_listener ?? ""),
    scores,
    sonic_textures,
    energy_arc,
    arrangement,
    mix_profile,
    why_it_works,
    how_to_produce,
  };
}

export async function analyzeMusicWithClaude(
  track: SpotifyTrack,
  features: SpotifyAudioFeatures,
): Promise<ClaudeMusicAnalysis> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY");

  const anthropic = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-4-6";

  const durationMin = Math.floor(track.duration_ms / 60000);
  const durationSec = Math.round((track.duration_ms % 60000) / 1000);

  const inputText = `Analyze this track and return the full JSON breakdown:

Title: ${track.title}
Artist: ${track.artist}
Album: ${track.album}${track.release_year ? ` (${track.release_year})` : ""}
Duration: ${durationMin}:${String(durationSec).padStart(2, "0")}${track.explicit ? "\nExplicit: yes" : ""}

Spotify Audio Features:
- Tempo: ${features.tempo_bpm} BPM
- Key: ${features.key}
- Energy: ${features.energy.toFixed(2)} / 1.0
- Danceability: ${features.danceability.toFixed(2)} / 1.0
- Valence (positivity): ${features.valence.toFixed(2)} / 1.0
- Acousticness: ${features.acousticness.toFixed(2)} / 1.0
- Instrumentalness: ${features.instrumentalness.toFixed(2)} / 1.0
- Loudness: ${features.loudness_db.toFixed(1)} dBFS
- Speechiness: ${features.speechiness.toFixed(2)} / 1.0
- Time Signature: ${features.time_signature}/4`;

  const resp = await anthropic.messages.create({
    model,
    max_tokens: 3000,
    temperature: 0.42,
    system: MUSIC_SYSTEM_PROMPT,
    messages: [{ role: "user", content: inputText }],
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
    return coerceMusicAnalysis(parsedJson);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Unable to coerce Claude music payload: ${msg}`);
  }
}
