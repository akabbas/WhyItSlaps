/** Cloud speech-to-text helpers for the voice-STT draft experiment. */

export type TranscribeProvider = "deepgram" | "openai";

export type TranscribeResult = {
  provider: TranscribeProvider;
  model: string;
  transcript: string;
  durationSeconds: number | null;
};

/** Boost common music vocabulary for Deepgram keyword spotting. */
export const MUSIC_STT_KEYWORDS = [
  "spotify",
  "travis scott",
  "fred again",
  "uk garage",
  "techno",
  "house",
  "hyperpop",
  "drill",
  "afrobeats",
  "amapiano",
  "shoegaze",
  "phonk",
  "jersey club",
  "jungle",
  "drum and bass",
  "dnb",
  "lo-fi",
  "rnb",
  "hip hop",
  "trap",
] as const;

export function resolveTranscribeProvider(): TranscribeProvider | null {
  const forced = (process.env.TRANSCRIBE_PROVIDER ?? "").trim().toLowerCase();
  if (forced === "deepgram" || forced === "openai") {
    if (forced === "deepgram" && process.env.DEEPGRAM_API_KEY?.trim()) return "deepgram";
    if (forced === "openai" && process.env.OPENAI_API_KEY?.trim()) return "openai";
    return null;
  }
  if (process.env.DEEPGRAM_API_KEY?.trim()) return "deepgram";
  if (process.env.OPENAI_API_KEY?.trim()) return "openai";
  return null;
}

export async function transcribeAudioBuffer(
  audio: Buffer,
  mimeType: string,
  filename: string,
): Promise<TranscribeResult> {
  const provider = resolveTranscribeProvider();
  if (!provider) {
    throw new Error(
      "No transcription provider configured. Set DEEPGRAM_API_KEY or OPENAI_API_KEY (optional TRANSCRIBE_PROVIDER).",
    );
  }
  if (provider === "deepgram") return transcribeWithDeepgram(audio, mimeType);
  return transcribeWithOpenAI(audio, mimeType, filename);
}

async function transcribeWithDeepgram(audio: Buffer, mimeType: string): Promise<TranscribeResult> {
  const key = process.env.DEEPGRAM_API_KEY?.trim();
  if (!key) throw new Error("Missing DEEPGRAM_API_KEY.");

  const model = process.env.DEEPGRAM_MODEL?.trim() || "nova-3";
  const params = new URLSearchParams({
    model,
    smart_format: "true",
    punctuate: "true",
    language: "en",
  });
  for (const kw of MUSIC_STT_KEYWORDS) {
    params.append("keywords", `${kw}:2`);
  }

  const res = await fetch(`https://api.deepgram.com/v1/listen?${params}`, {
    method: "POST",
    headers: {
      Authorization: `Token ${key}`,
      "Content-Type": mimeType || "audio/webm",
    },
    body: new Uint8Array(audio),
    cache: "no-store",
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Deepgram failed (${res.status}): ${errText.slice(0, 240)}`);
  }

  const json = (await res.json()) as {
    results?: {
      channels?: Array<{
        alternatives?: Array<{ transcript?: string }>;
      }>;
    };
    metadata?: { duration?: number };
  };

  const transcript =
    json.results?.channels?.[0]?.alternatives?.[0]?.transcript?.trim() ?? "";
  if (!transcript) {
    throw new Error("Deepgram returned an empty transcript.");
  }

  return {
    provider: "deepgram",
    model,
    transcript,
    durationSeconds: typeof json.metadata?.duration === "number" ? json.metadata.duration : null,
  };
}

async function transcribeWithOpenAI(
  audio: Buffer,
  mimeType: string,
  filename: string,
): Promise<TranscribeResult> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) throw new Error("Missing OPENAI_API_KEY.");

  const model = process.env.OPENAI_TRANSCRIBE_MODEL?.trim() || "gpt-4o-mini-transcribe";
  const form = new FormData();
  const blob = new Blob([new Uint8Array(audio)], { type: mimeType || "audio/webm" });
  form.append("file", blob, filename || "speech.webm");
  form.append("model", model);
  form.append("language", "en");
  form.append(
    "prompt",
    "Music discovery query. Expect song titles, artist names, genres like UK garage, techno, house, drill.",
  );

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: form,
    cache: "no-store",
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`OpenAI transcription failed (${res.status}): ${errText.slice(0, 240)}`);
  }

  const json = (await res.json()) as { text?: string };
  const transcript = json.text?.trim() ?? "";
  if (!transcript) {
    throw new Error("OpenAI returned an empty transcript.");
  }

  return {
    provider: "openai",
    model,
    transcript,
    durationSeconds: null,
  };
}
