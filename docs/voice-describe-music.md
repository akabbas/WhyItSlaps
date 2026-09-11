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

## Remaining work (PR #15 · develop separately from music detect)

**Ship blockers**

- [ ] Confirm **Spotify** credentials on Railway (`SPOTIFY_CLIENT_ID` / `SECRET`) for `/api/search-spotify`
- [ ] Manual QA on `/draft/voice` in **Chrome + HTTPS**: listen → interim text → find track → pick row → home with URL prefilled → user taps **Analyze**

**Already in this branch**

- [x] Web Speech API on `/draft/voice` (`interimResults`, listen/stop, typed fallback textarea)
- [x] `searchSpotifyTracks()` + `POST /api/search-spotify`
- [x] Result list with **why it slaps →** deep link `/?mode=music&url=`
- [x] Draft hub **Voice describe** card
- [x] Home query hydration (`AnalyzeToolPage`: `mode` + `url` — **does not** auto-run analyze)

**Finish before calling it “done” on prod home**

- [ ] **Say it** on landing (Phase 2): embed voice UI in `InputScreen` MUSIC flow
- [ ] **Auto-search on pause** (~500ms after final transcript) — spec UX target; today user taps **find track**
- [ ] **Auto-analyze after pick** (optional): navigate with `?url=` and trigger music analyze in `AnalyzeToolPage`, or analyze inline on draft page
- [ ] **Auto-pick #1** when query is unambiguous (heuristic or LLM) — not built
- [ ] **Cloud streaming STT** (Phase 3) for Safari/Firefox and better accuracy
- [ ] **Genre/vibe path** (Phase 4): `/api/analyze-music-vibe` when speech is not a single track
- [ ] Privacy copy if Web Speech ships to all users (Chrome sends audio to Google)
- [ ] README / CONCEPT cross-links when merged (detect spec lives on PR #14 branch until then)

**Merge note**

- Overlaps **`app/draft/page.tsx`** and **`components/AnalyzeToolPage.tsx`** with **`ammr/music-detect-scan-f408` (PR #14)**. Merge one PR first, rebase the other; expand draft hub grid to show **Music scan** + **Voice describe** together.

---

## Related

- Paste URL music mode — home **`/`** MUSIC tab
- Audio fingerprint — **`docs/music-detect-scan.md`** (`/draft/detect`)
- Spotify analyze — **`/api/analyze-music`**
