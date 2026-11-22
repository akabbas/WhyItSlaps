import Anthropic from "@anthropic-ai/sdk";

export type VoiceIntentKind = "track" | "artist" | "genre" | "vibe" | "unknown";

export type VoiceIntent = {
  kind: VoiceIntentKind;
  /** Clean Spotify-friendly search string. */
  search_query: string;
  /** Short human restatement of what they meant. */
  cleaned: string;
  /** Free tags for a future Everynoise-style vibe map. */
  vibe_tags: string[];
  confidence: number;
};

const SYSTEM = `You normalize messy speech-to-text from a music discovery app (WhyItSlaps).
Users describe songs, artists, genres, or vibes ("dark UK garage", "that Travis Scott song with the psychedelic intro", "why does minimal techno slap").

Return ONLY compact JSON:
{
  "kind": "track" | "artist" | "genre" | "vibe" | "unknown",
  "search_query": "best Spotify search string (artist + title when possible)",
  "cleaned": "one clean sentence of what they meant",
  "vibe_tags": ["up to 6 short genre/mood tags"],
  "confidence": 0.0-1.0
}

Rules:
- Fix ASR mistakes for music (fred again → Fred again.., travis scott → Travis Scott).
- Strip filler (um, uh, like, you know).
- If they name a vibe/genre without a specific track, kind=genre or vibe and still give a useful search_query (example artist or genre phrase).
- Never invent a specific track title you are unsure of; prefer artist/genre search.`;

export async function interpretMusicSpeech(rawTranscript: string): Promise<VoiceIntent> {
  const raw = rawTranscript.trim();
  if (!raw) {
    return {
      kind: "unknown",
      search_query: "",
      cleaned: "",
      vibe_tags: [],
      confidence: 0,
    };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    // Still usable without Claude — pass transcript through.
    return {
      kind: "unknown",
      search_query: raw,
      cleaned: raw,
      vibe_tags: [],
      confidence: 0.4,
    };
  }

  const anthropic = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-4-6";

  const resp = await anthropic.messages.create({
    model,
    max_tokens: 400,
    temperature: 0.2,
    system: SYSTEM,
    messages: [{ role: "user", content: `Transcript:\n${raw}` }],
  });

  const text = resp.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return {
      kind: "unknown",
      search_query: raw,
      cleaned: raw,
      vibe_tags: [],
      confidence: 0.45,
    };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]) as Partial<VoiceIntent>;
    const kind = (["track", "artist", "genre", "vibe", "unknown"] as const).includes(
      parsed.kind as VoiceIntentKind,
    )
      ? (parsed.kind as VoiceIntentKind)
      : "unknown";
    return {
      kind,
      search_query: String(parsed.search_query ?? raw).trim() || raw,
      cleaned: String(parsed.cleaned ?? raw).trim() || raw,
      vibe_tags: Array.isArray(parsed.vibe_tags)
        ? parsed.vibe_tags.map((t) => String(t).trim()).filter(Boolean).slice(0, 6)
        : [],
      confidence:
        typeof parsed.confidence === "number" && Number.isFinite(parsed.confidence)
          ? Math.max(0, Math.min(1, parsed.confidence))
          : 0.6,
    };
  } catch {
    return {
      kind: "unknown",
      search_query: raw,
      cleaned: raw,
      vibe_tags: [],
      confidence: 0.45,
    };
  }
}
