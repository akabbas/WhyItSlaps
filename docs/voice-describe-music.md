# Voice describe → why it slaps

**Status:** Prototype on branch `ammr/voice-describe-f408` — **`/draft/voice`**

**Goal:** Talk naturally (“that Travis Scott song with the psychedelic intro”, “dark UK garage”, “Fred again style emotional house”) and see **live text while you speak**, then jump to a **WhyItSlaps** music breakdown.

---

## UX target (what you asked for)

| Feel | How we get there |
|------|------------------|
| **Super fast pickup** | Start recognition on tap; **`interimResults: true`** so words appear before you finish the sentence |
| **Real text in real time** | Show **interim** line (dim) + **committed** line (solid), updating on every `onresult` |
| **Intuitive** | One big **Listen** control, obvious **Stop**, then **Search** / auto-search when you pause |
| **Why it slaps** | Resolve speech → **Spotify track** (today) → existing **`/api/analyze-music`** flow |

Text-to-speech (TTS) is the **reverse** (app speaks to you). This feature is **speech-to-text (STT)** for **input**. We can add TTS later to read the breakdown aloud.

---

## Architecture (phased)

```text
Mic → STT (live transcript) → query text
                                  ↓
                    Spotify Search API (track/artist)
                                  ↓
              User picks match (or auto #1 if confident)
                                  ↓
              POST /api/analyze-music → MusicResultsScreen
```

### Phase 1 — Browser STT (prototype, this branch)

- **[Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)** (`SpeechRecognition` / `webkitSpeechRecognition`)
- **Pros:** Zero API cost, **interim results built in**, low latency on Chrome/Android
- **Cons:** Browser-dependent (best on **Chrome**; Safari/iOS partial); needs **HTTPS**; quality varies with accent/noise

**Route:** `/draft/voice` — live transcript + search button.

### Phase 2 — Home landing “Say it” tab

- Same component embedded next to paste URL
- Optional: auto-search after **500ms silence** (debounce on final transcript)

### Phase 3 — Cloud streaming STT (production polish)

When browser STT isn’t good enough:

| Provider | Why |
|----------|-----|
| **Deepgram** | Streaming, low latency, `interim_results` |
| **AssemblyAI** | Real-time websocket |
| **OpenAI Realtime** | If you already centralize on one vendor |

Pattern: mic → **WebSocket** → server → stream partials back to UI (same interim/final UX).

### Phase 4 — Genre / vibe without a single track

Speech like “why does minimal techno slap” may not map to one track.

- **Claude** interprets intent: `{ type: "genre" | "artist" | "track", query, ... }`
- **Track/artist** → Spotify search (today)
- **Genre/vibe** → new **`/api/analyze-music-vibe`** (prose + optional playlist of example tracks) — not built yet

---

## API added on this branch

`POST /api/search-spotify`

```json
{ "q": "fred again emotional house", "limit": 5 }
```

→ `{ ok: true, tracks: [{ id, title, artist, spotify_url, album_art_url }] }`

Uses existing **Spotify client-credentials** (`SPOTIFY_CLIENT_ID` / `SECRET`).

---

## Privacy & permissions

- Mic access is **browser prompt** only; audio stays on device for Web Speech API (Google’s backend processes audio in Chrome — disclose in privacy policy if you ship it).
- Cloud STT: send audio to chosen vendor; document in privacy policy.

---

## Related

- Paste URL music mode — home **`/`** MUSIC tab
- Audio fingerprint — **`docs/music-detect-scan.md`** (`/draft/detect`)
- Spotify analyze — **`/api/analyze-music`**
