"use client";

import Link from "next/link";
import React from "react";

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      0: { transcript: string };
    };
  };
};

type SearchHit = {
  id: string;
  title: string;
  artist: string;
  album: string;
  album_art_url: string | null;
  spotify_url: string;
};

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export default function DraftVoicePage() {
  const [supported, setSupported] = React.useState(true);
  const [listening, setListening] = React.useState(false);
  const [interim, setInterim] = React.useState("");
  const [finalText, setFinalText] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [searchBusy, setSearchBusy] = React.useState(false);
  const [hits, setHits] = React.useState<SearchHit[]>([]);
  const recognitionRef = React.useRef<SpeechRecognitionLike | null>(null);

  React.useEffect(() => {
    setSupported(!!getSpeechRecognition());
  }, []);

  const transcript = `${finalText} ${interim}`.trim();

  const startListening = () => {
    setError(null);
    setHits([]);
    const Ctor = getSpeechRecognition();
    if (!Ctor) {
      setSupported(false);
      setError("Speech recognition is not available in this browser. Try Chrome on desktop or Android.");
      return;
    }

    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onresult = (event) => {
      let interimParts = "";
      const finalParts: string[] = [];

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const piece = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalParts.push(piece);
        else interimParts += piece;
      }

      if (finalParts.length) {
        setFinalText((prev) => `${prev} ${finalParts.join(" ")}`.trim());
      }
      setInterim(interimParts.trim());
    };

    rec.onerror = (ev) => {
      if (ev.error !== "aborted") {
        setError(`Mic error: ${ev.error}`);
      }
      setListening(false);
    };

    rec.onend = () => {
      setListening(false);
      setInterim("");
    };

    recognitionRef.current = rec;
    setListening(true);
    rec.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
    setInterim("");
  };

  const runSearch = async () => {
    const q = transcript.trim();
    if (!q) {
      setError("Say or type something first.");
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
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/40">prototype · voice describe</p>
        <h1 className="font-serif text-[clamp(1.4rem,4vw,2.2rem)] uppercase tracking-[0.2em] text-paper">
          Say the song, artist, or vibe
        </h1>
        <p className="font-mono text-[11px] leading-relaxed text-white/55">
          Live speech-to-text while you talk — then we search Spotify and link you into a full breakdown. Spec:{" "}
          <span className="text-white/70">docs/voice-describe-music.md</span>
        </p>
      </header>

      <section className="mt-10 space-y-6">
        {!supported ? (
          <p className="font-mono text-[11px] text-white/60">
            Use Chrome (desktop/Android) over HTTPS for the built-in speech engine. Cloud streaming STT is planned for
            other browsers.
          </p>
        ) : null}

        <div className="min-h-[8rem] border border-white/20 bg-black/30 p-5 text-left">
          <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/35">live transcript</p>
          <p className="mt-3 font-mono text-[14px] leading-relaxed text-paper">
            {finalText || <span className="text-white/25">Start speaking…</span>}
            {interim ? (
              <span className="text-white/45"> {interim}</span>
            ) : null}
          </p>
        </div>

        <textarea
          className="h-24 w-full resize-none border border-white/15 bg-black/40 p-4 font-mono text-[12px] text-white outline-none placeholder:text-white/25"
          placeholder="Or type: Fred again emotional house, or Sicko Mode Travis Scott…"
          value={finalText}
          onChange={(e) => {
            setFinalText(e.target.value);
            setInterim("");
          }}
          disabled={listening}
        />

        <div className="flex flex-wrap gap-3">
          {!listening ? (
            <button
              type="button"
              onClick={startListening}
              className="flex h-12 flex-1 items-center justify-center bg-paper font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-black hover:bg-white sm:flex-none sm:px-8"
            >
              listen
            </button>
          ) : (
            <button
              type="button"
              onClick={stopListening}
              className="flex h-12 flex-1 items-center justify-center border border-paper font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-paper sm:flex-none sm:px-8"
            >
              stop
            </button>
          )}
          <button
            type="button"
            disabled={searchBusy || !transcript.trim()}
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
