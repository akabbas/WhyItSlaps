# Cloud voice STT (high-accuracy speech experiment)

**Status:** Separate experiment on `ammr/voice-stt-cloud-f408` — **not** the browser Web Speech prototype (`ammr/voice-describe-f408` / PR #15).

**Try it:** `/draft/voice-stt`  
**APIs:** `POST /api/transcribe` · `POST /api/search-spotify`

---

## Goal

Make speech **good enough for music discovery** (artist names, niche genres, vibe phrases) — closer to Wispr-class dictation than Chrome Web Speech — then later feed a vibe/Everynoise-style explorer.

```text
Mic (MediaRecorder)
  → POST /api/transcribe
       Deepgram nova-3 (preferred) or OpenAI gpt-4o-mini-transcribe
       + Claude music intent cleanup
  → cleaned search_query + vibe_tags
  → POST /api/search-spotify
  → pick track → /?mode=music&url=…
```

---

## Why a separate branch

| Branch | Approach |
|--------|----------|
| `ammr/voice-describe-f408` (#15) | Browser **Web Speech API** — free, live interim, Chrome-best |
| **This branch** | **Cloud STT** + Claude cleanup — higher accuracy, needs API keys |

Ship either independently; compare accuracy on real music phrases; keep the winner (or combine: live Web Speech preview + cloud final pass).

---

## Env

```bash
# Prefer Deepgram for streaming-quality models (prerecorded used in v1 scaffold)
DEEPGRAM_API_KEY=
# DEEPGRAM_MODEL=nova-3

# Or OpenAI
OPENAI_API_KEY=
# OPENAI_TRANSCRIBE_MODEL=gpt-4o-mini-transcribe

# Optional force: deepgram | openai
# TRANSCRIBE_PROVIDER=deepgram

# Already used elsewhere
ANTHROPIC_API_KEY=   # Claude intent cleanup (falls back to raw transcript if missing)
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
```

---

## Phases

### Phase 1 — this branch (scaffold)

- [x] MediaRecorder capture on `/draft/voice-stt`
- [x] `POST /api/transcribe` (Deepgram / OpenAI)
- [x] Music keyword boost (Deepgram) + prompt hint (OpenAI)
- [x] Claude → `{ kind, search_query, cleaned, vibe_tags }`
- [x] Spotify search + deep link into music analyze
- [ ] Side-by-side A/B vs Web Speech on the same utterances

### Phase 2 — live streaming (Wispr-feel)

- WebSocket interim transcripts (Deepgram live / AssemblyAI realtime)
- Auto-stop on silence + auto-search

### Phase 3 — Everynoise-style vibe

- When `kind` is `genre` / `vibe`, skip single-track force
- Map `vibe_tags` + Spotify audio features → related tracks / cluster UI
- New `/api/analyze-music-vibe` prose breakdown

---

## Manual test cases

| # | Case | Expected |
|---|------|----------|
| S1 | No STT keys | `503` config error with hint |
| S2 | Listen 5–10s clear artist+song | Raw + cleaned transcript; Spotify hits |
| S3 | Vibe-only (“dark UK garage”) | `kind` genre/vibe; tags; searchable query |
| S4 | Find track → why it slaps | Lands on music analyze via `?mode=music&url=` |
| S5 | Build | `npm run build` passes |

**Do not merge to `main` until S2–S4 pass on a host with Deepgram or OpenAI + Spotify + Anthropic.**

---

## Related

- Browser STT prototype — PR #15 / `docs/voice-describe-music.md`
- Music scan (ACR fingerprint) — `docs/music-detect-scan.md`
- History — home **History** tab (localStorage)
