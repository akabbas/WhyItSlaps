# WhyItSlaps — work order

Ranked list of what’s **doable now**, what’s **next**, and what is a **behemoth**. Product answers live here so we don’t oversell the engine.

Related: [`CREATIVE_UX.md`](./CREATIVE_UX.md) (meters vs rank, share cards, URLs) · [`MIR_MAPPING.md`](./MIR_MAPPING.md) (Spotify / Essentia meter map) · [`DEAD_ENDS.md`](./DEAD_ENDS.md) · [`ui-impeccable-grade.md`](./ui-impeccable-grade.md)

**Out of scope forever unless product reopens it:** ripping a full Spotify track as MP3 · merging voice STT **#17**.

---

## Direct answers

### Do sonic scores mean something?

**Yes — as measurements of the ~30s preview waveform**, not as “this song is better” and not as a lab report on the full master.

| Number | Meaning | Can oversell / undersell a hook? |
|--------|---------|-----------------------------------|
| **Hook / density / range / impact / mix** | Heuristic DSP on **this clip** (`lib/sonic-scores.ts`) | **Yes**, if the preview is a verse and the hook is later, or the opposite |
| **Overall vibe** | Weighted blend of those five (not taste, not charts) | Same clip bias |
| **Spotify energy / danceability / valence** | Spotify’s model of the **catalog track** (`/v1/audio-features`) | Different language; more “whole recording” than our clip DSP |
| **Written critique** | Claude from **title + features + clip scores + (now) audio-analysis sections** — it does **not** listen to the MP3 | Can invent mix/form if we don’t ground it |

We should **not** retune DSP weights without a small fixture set of known tracks (would make oversell/undersell worse). First accuracy win is **using Spotify’s full-recording analysis** for form/energy, and **labeling clip meters as clip meters**.

### Internet / people as sources for the critique?

A real **citation engine** (search Reddit, Genius, interviews, then quote) is a **behemoth**: crawlers, licenses, stale pages, prompt injection, “this YouTuber said.” Claude already leans on training-time knowledge of famous songs **without** sources.

**Do not build RAG/web search as v1.** If we want “people” later: licensed lyrics, editorial quotes the user pastes, or a curated note — not live scrape.

### What we should use from APIs (legal)

Already in use: track metadata, audio **features**, preview (or iTunes) for DSP + Save preview.

**Added this pass:** `/v1/audio-analysis` (sections, loudness/tempo over the **full catalogued recording**). Fail-open if Spotify 403s (deprecated for some new apps). Grounds energy arc / arrangement.

Still unused, later: artist genres, popularity, related artists. Lyrics only via a licensed API.

---

## Music share card — UI check (song)

Live path: `ShareCardPanel` + `components/share-cards/MusicShareCard.tsx` (not `/demo/share-graphics`).

| Issue | Why it hurts | Ticket |
|-------|----------------|--------|
| Headline **“Post your breakdown”** | Marketing, not critique-tool | CREATIVE_UX **T4** |
| Giant **overall vibe** (120–160px) | Reads as a rank / “better song” | **T2** then **T7** |
| Spotify-green **radial gradients** | CONCEPT forbids gradient meshes | **T6** |
| Preview well `rounded-sm`, story scaled top-left | Empty black field, soft corners | **T5** |
| 3-col BPM/KEY/HOOK | Collapses awkwardly if features missing | with **T7** |
| Video **SHARE CARD** vs music **share card** | Split chrome | **T8** |

**Do not** full-redesign. Order: T4 + T6 + T5 (look), T2 (number), T8 (label).

---

## Ranked work (importance)

| # | Item | Status | Why this rank |
|---|------|--------|----------------|
| **1** | Loading overlay: real pipeline stages; no 1/4 loop; hypnotic wait | **This PR** | Fake step carousel felt broken |
| **2** | Spotify **audio-analysis** → Claude (full recording sections) | **This PR** | Uses API we already pay for; grounds the essay without ripping audio |
| **3** | Meter copy: clip character, not rank (CREATIVE_UX **T1**, **T3**) | Open | Stops overselling numbers in history/results |
| **4** | Music share card polish **T4, T6, T5, T2, T8** | Open | You don’t like the share look; tickets already specified |
| **5** | Sonic scores from **full-track** Spotify features + sections; preview DSP only for mix / fallback | Open → implement | Clip-only meters felt random vs the song |
| **6** | History as library + still logging (T11, DEAD_ENDS) | Open | “Accurate note” of what you scanned |
| **7** | User-owned longer file for DSP (scan is 15s ID only) | Later | Best legal “more of the song” |
| **8** | Multimodal **listen** to the preview | Later | Critique hears the clip; new vendor/cost |
| **9** | Web/people citations | **Deferred** | Behemoth; skip |
| **10** | `/s/:id` share URLs | Deferred | Needs storage (CREATIVE_UX T12) |

---

## Agent tickets (engine)

#### W1 — Loading: honest stages + hypnotic wait

- **Status:** Shipped on this branch
- **Files:** [`components/LoadingScreen.tsx`](../components/LoadingScreen.tsx), [`lib/loading-stage.ts`](../lib/loading-stage.ts), [`lib/ndjsonKeepAlive.ts`](../lib/ndjsonKeepAlive.ts)
- **Do:** No fake 1/4→2→3→4 loop. Video/upload/music streams `{ type: "stage" }` when that work actually starts. Copy follows the stage; idle line if the route has no stream (still, scan, download). Bar 8→90, never decreases, never 100. Wait graphic is concentric squares + a paper tick on a square orbit.

#### W2 — Spotify audio-analysis into critique

- **Status:** Shipped on this branch (fail-open)
- **Files:** [`lib/spotify.ts`](../lib/spotify.ts), [`lib/spotify-analysis.ts`](../lib/spotify-analysis.ts), [`lib/claude-music.ts`](../lib/claude-music.ts), [`app/api/analyze-music/route.ts`](../app/api/analyze-music/route.ts)
- **Do:** Parallel `GET /v1/audio-analysis/{id}`; compact sections in the Claude prompt and on `MusicAnalyzeSuccess.analysis` (history gets it for free). If 403/empty, analyze still works.

#### W3 — Clip-meter honesty (copy only)

- **Status:** Open — same as CREATIVE_UX **T1**
- **Don’t:** Change DSP math in the same PR as copy.

#### W4 — Catalog-first sonic scores

- **Status:** Shipped on this branch (`scoreFromCatalogSignals` + `blendSonicScores`)
- **Do not:** Treat remaining preview DSP as the song. Clip path is mix-clarity / fallback only.
- **Later:** Listeners still will not match “I love this song.” Optional fixtures if we retune weights.

#### W5 — Music share card first wave

- **Status:** Open — CREATIVE_UX **T4, T5, T6** then **T2**
- **Prompt:** one ticket per PR from CREATIVE_UX.md.

---

*Update the status column when a ticket ships. Prefer one ticket per PR.*
