import { NextResponse } from "next/server";

import { resolveTranscribeProvider, transcribeAudioBuffer } from "@/lib/transcribe";
import { interpretMusicSpeech, type VoiceIntent } from "@/lib/voice-intent";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const MAX_BYTES = 8 * 1024 * 1024;

export type TranscribeSuccess = {
  ok: true;
  provider: string;
  model: string;
  raw_transcript: string;
  intent: VoiceIntent;
  duration_seconds: number | null;
};

export type TranscribeErrorBody = {
  ok: false;
  error: string;
  hint?: string;
  stage?: "config" | "upload" | "transcribe" | "intent";
};

export async function POST(req: Request) {
  if (!resolveTranscribeProvider()) {
    return NextResponse.json(
      {
        ok: false,
        error: "Cloud speech-to-text is not configured on this server.",
        hint: "Set DEEPGRAM_API_KEY (preferred) or OPENAI_API_KEY. Optional: TRANSCRIBE_PROVIDER=deepgram|openai.",
        stage: "config",
      } satisfies TranscribeErrorBody,
      { status: 503 },
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Malformed multipart body.", stage: "upload" } satisfies TranscribeErrorBody,
      { status: 400 },
    );
  }

  const audio = form.get("audio") ?? form.get("file");
  if (!(audio instanceof File)) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Expected multipart field "audio" (webm/wav/mp3 from MediaRecorder).',
        stage: "upload",
      } satisfies TranscribeErrorBody,
      { status: 400 },
    );
  }

  if (audio.size > MAX_BYTES) {
    return NextResponse.json(
      { ok: false, error: "Audio exceeds the 8 MB limit.", stage: "upload" } satisfies TranscribeErrorBody,
      { status: 413 },
    );
  }

  try {
    const buf = Buffer.from(await audio.arrayBuffer());
    const stt = await transcribeAudioBuffer(buf, audio.type || "audio/webm", audio.name || "speech.webm");
    const intent = await interpretMusicSpeech(stt.transcript);

    return NextResponse.json(
      {
        ok: true,
        provider: stt.provider,
        model: stt.model,
        raw_transcript: stt.transcript,
        intent,
        duration_seconds: stt.durationSeconds,
      } satisfies TranscribeSuccess,
      { status: 200 },
    );
  } catch (err) {
    const hint = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        ok: false,
        error: "Could not transcribe audio.",
        hint,
        stage: "transcribe",
      } satisfies TranscribeErrorBody,
      { status: 502 },
    );
  }
}
