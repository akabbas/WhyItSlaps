"use client";

import Link from "next/link";
import React from "react";

type SearchHit = {
  id: string;
  title: string;
  artist: string;
  album: string;
  album_art_url: string | null;
  spotify_url: string;
};

type Intent = {
  kind: string;
  search_query: string;
  cleaned: string;
  vibe_tags: string[];
  confidence: number;
};

type TranscribeSuccess = {
  ok: true;
  provider: string;
  model: string;
  raw_transcript: string;
  intent: Intent;
  duration_seconds: number | null;
};

type TranscribeError = {
  ok: false;
  error: string;
  hint?: string;
};

function pickMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "audio/webm";
  if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) return "audio/webm;codecs=opus";
  if (MediaRecorder.isTypeSupported("audio/webm")) return "audio/webm";
  if (MediaRecorder.isTypeSupported("audio/mp4")) return "audio/mp4";
  return "audio/webm";
}

export default function DraftVoiceSttPage() {
  const [supported, setSupported] = React.useState(true);
  const [listening, setListening] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [searchBusy, setSearchBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [rawTranscript, setRawTranscript] = React.useState("");
  const [intent, setIntent] = React.useState<Intent | null>(null);
  const [providerMeta, setProviderMeta] = React.useState<string | null>(null);
  const [hits, setHits] = React.useState<SearchHit[]>([]);
  const [elapsed, setElapsed] = React.useState(0);

  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<BlobPart[]>([]);
  const streamRef = React.useRef<MediaStream | null>(null);
  const timerRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    setSupported(typeof window !== "undefined" && typeof MediaRecorder !== "undefined" && !!navigator.mediaDevices?.getUserMedia);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const stopTimer = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startListening = async () => {
    setError(null);
    setHits([]);
    setIntent(null);
    setRawTranscript("");
    setProviderMeta(null);
    setElapsed(0);

    if (!supported) {
      setError("MediaRecorder / mic access is not available in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = pickMimeType();
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data);
      };
      recorder.onstop = () => {
        void finalizeRecording(recorder.mimeType || mime);
      };
      mediaRecorderRef.current = recorder;
      recorder.start(250);
      setListening(true);
      timerRef.current = window.setInterval(() => setElapsed((n) => n + 1), 1000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not access microphone.");
    }
  };

  const stopListening = () => {
    stopTimer();
    const rec = mediaRecorderRef.current;
    if (rec && rec.state !== "inactive") {
      rec.stop();
    }
    setListening(false);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const finalizeRecording = async (mimeType: string) => {
    setBusy(true);
    setError(null);
    try {
      const blob = new Blob(chunksRef.current, { type: mimeType || "audio/webm" });
      chunksRef.current = [];
      if (blob.size < 800) {
        setError("Recording too short — hold Listen a bit longer.");
        return;
      }

      const form = new FormData();
      const ext = mimeType.includes("mp4") ? "m4a" : "webm";
      form.append("audio", blob, `speech.${ext}`);

      const res = await fetch("/api/transcribe", { method: "POST", body: form });
      const payload = (await res.json()) as TranscribeSuccess | TranscribeError;
      if (!res.ok || !payload.ok) {
        const err = payload as TranscribeError;
        setError(err.hint ? `${err.error} — ${err.hint}` : err.error);
        return;
      }

      setRawTranscript(payload.raw_transcript);
      setIntent(payload.intent);
      setProviderMeta(`${payload.provider} · ${payload.model}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Transcription failed.");
    } finally {
      setBusy(false);
    }
  };

  const runSearch = async () => {
    const q = (intent?.search_query || rawTranscript).trim();
    if (!q) {
      setError("Speak or wait for a transcript first.");
      return;
    }
    setSearchBusy(true);
    setError(null);
    setHits([]);
    try {
      const res = await fetch("/api/search-spotify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ q, limit: 5 }),
      });
      const payload = (await res.json()) as
        | { ok: true; tracks: SearchHit[] }
        | { ok: false; error: string; hint?: string };
      if (!res.ok || !payload.ok) {
        const err = payload as { error: string; hint?: string };
        setError(err.hint ? `${err.error} — ${err.hint}` : err.error);
        return;
      }
      setHits(payload.tracks);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed.");
    } finally {
      setSearchBusy(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10 md:px-8 md:py-14">
      <header className="space-y-3 border-b border-white/12 pb-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/40">
          experiment · cloud speech
        </p>
        <h1 className="font-serif text-[clamp(1.4rem,4vw,2.2rem)] uppercase tracking-[0.2em] text-paper">
          High-accuracy voice → music
        </h1>
        <p className="font-mono text-[11px] leading-relaxed text-white/55">
          Separate from the browser Web Speech prototype. Record → Deepgram/OpenAI transcription → Claude cleanup
          → Spotify. Spec: docs/voice-stt-cloud.md
        </p>
      </header>

      <section className="mt-10 space-y-6">
        {!supported ? (
          <p className="font-mono text-[11px] text-white/60">
            This browser cannot record audio via MediaRecorder. Try Chrome or Safari on HTTPS.
          </p>
        ) : null}

        <div className="min-h-[7rem] border border-white/20 bg-black/30 p-5 text-left">
          <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/35">
            raw transcript {providerMeta ? `· ${providerMeta}` : ""}
          </p>
          <p className="mt-3 font-mono text-[14px] leading-relaxed text-white/70">
            {rawTranscript || (
              <span className="text-white/25">
                {listening ? `Listening… ${elapsed}s` : busy ? "Transcribing…" : "Tap listen and describe a song or vibe"}
              </span>
            )}
          </p>
        </div>

        {intent ? (
          <div className="border border-white/12 bg-black/25 p-5 text-left">
            <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/35">
              cleaned intent · {intent.kind} · {Math.round(intent.confidence * 100)}%
            </p>
            <p className="mt-2 font-mono text-[13px] text-paper">{intent.cleaned}</p>
            <p className="mt-2 font-mono text-[11px] text-white/55">search: {intent.search_query}</p>
            {intent.vibe_tags.length ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {intent.vibe_tags.map((tag) => (
                  <span
                    key={tag}
                    className="border border-white/15 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-white/50"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          {!listening ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void startListening()}
              className="flex h-12 flex-1 items-center justify-center bg-paper font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-black hover:bg-white disabled:opacity-40 sm:flex-none sm:px-8"
            >
              listen
            </button>
          ) : (
            <button
              type="button"
              onClick={stopListening}
              className="flex h-12 flex-1 items-center justify-center border border-paper font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-paper sm:flex-none sm:px-8"
            >
              stop · {elapsed}s
            </button>
          )}
          <button
            type="button"
            disabled={searchBusy || busy || !(intent?.search_query || rawTranscript).trim()}
            onClick={() => void runSearch()}
            className="flex h-12 flex-1 items-center justify-center border border-white/30 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-white/90 hover:border-paper disabled:opacity-40 sm:flex-none sm:px-8"
          >
            {searchBusy ? "searching…" : "find track"}
          </button>
        </div>

        {error ? (
          <p className="border-l-2 border-paper/60 pl-4 font-mono text-[12px] leading-relaxed text-white/85">{error}</p>
        ) : null}

        {hits.length > 0 ? (
          <ul className="space-y-3 border-t border-white/10 pt-6">
            {hits.map((track) => (
              <li key={track.id} className="flex items-center gap-4 border border-white/12 bg-black/25 p-4">
                {track.album_art_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={track.album_art_url} alt="" className="h-14 w-14 object-cover" />
                ) : (
                  <div className="h-14 w-14 bg-white/10" />
                )}
                <div className="min-w-0 flex-1 text-left">
                  <p className="truncate font-mono text-[12px] text-paper">{track.title}</p>
                  <p className="truncate font-mono text-[11px] text-white/55">{track.artist}</p>
                </div>
                <Link
                  href={`/?mode=music&url=${encodeURIComponent(track.spotify_url)}`}
                  className="shrink-0 border border-white/25 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.16em] text-paper hover:border-paper"
                >
                  why it slaps →
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <footer className="mt-14 font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">
        <Link href="/draft" className="hover:text-paper">
          ← draft hub
        </Link>
      </footer>
    </main>
  );
}
