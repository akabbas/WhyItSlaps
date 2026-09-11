# Music detect / scan (Shazam-style)

**Status:** Prototype on branch `ammr/music-detect-scan-f408` — not on the main home flow yet.

**Try it:** `/draft/detect` (upload scan) · **API:** `POST /api/identify-audio`

---

## Problem

**MUSIC** mode today assumes you already have a **Spotify track URL**. **VIDEO** mode runs ACRCloud on clip audio but only shows the match as a sidebar card after a full vision analysis.

Users often have **audio or a short clip** and want: *“what song is this?”* before pasting links or running a full breakdown.

---

## Approach (reuse ACRCloud)

We already fingerprint clip audio via **ACRCloud Identify** (`lib/music.ts`) on the video pipeline. This feature exposes the same engine as a **first-class scan**:

| Input | Processing |
|-------|------------|
| Audio file (mp3, m4a, wav, …) | ffmpeg → first **15s** MP3 sample |
| Short video (≤60s) | Same audio extract (no vision) |
| *(future)* Mic / system audio | MediaRecorder → blob → same API |

**Output:** `MusicMatch` (title, artist, album, genres, bpm, confidence, optional `spotify_id`) plus `spotify_url` when ACR returns Spotify metadata.

**Next step after a hit:** deep-link to home **MUSIC** analyze with `?url=<spotify_url>` (prototype button on draft page).

---

## API

`POST /api/identify-audio` — `multipart/form-data`

| Field | Description |
|-------|-------------|
| `clip` | Preferred: audio or video file |
| `audio` / `video` | Aliases for the same field |

**Requires** `ACRCLOUD_*` env vars (same as video soundtrack ID).

**Success:**

```json
{
  "ok": true,
  "match": { "title", "artist", "album", "genres", "bpm", "spotify_id", "confidence" },
  "spotify_url": "https://open.spotify.com/track/..."
}
```

**No match:** `404` with retry hint ( noisy room, obscure edit, no Spotify link in ACR metadata).

---

## Product phases

### Phase 1 (this branch)

- [x] `identifyAudioBuffer()` shared helper
- [x] `/api/identify-audio`
- [x] `/draft/detect` upload UI
- [ ] Wire **Scan** tab on home landing (optional fourth path next to paste URL)

### Phase 2

- Browser **microphone** capture (15s countdown, wave UI)
- “Listen like Shazam” without file pick

### Phase 3

- Auto-run **`/api/analyze-music`** after high-confidence match
- Show **MusicResultsScreen** in one flow: scan → breakdown

### Phase 4

- Fallback when ACR has no `spotify_id`: Spotify search by title/artist (metadata search API — needs scoping)

---

## Limits & ops

- **Not full Shazam replacement** — ACR catalog + quota limits; same as video MusicCard.
- **15s sample** — balance hit rate vs upload size.
- **25 MB** upload cap on identify route (draft / scan).
- Monitor ACRCloud dashboard alongside video analyze volume.

---

## Remaining work (PR #14 · develop separately from voice)

**Ship blockers**

- [ ] Confirm **ACRCloud** env on Railway (`ACRCLOUD_*` — same as video analyze) so `/api/identify-audio` works in production preview
- [ ] Manual QA on `/draft/detect`: mp3, m4a, short mp4; no-match copy; match without `spotify_id`

**Already in this branch**

- [x] `identifyAudioBuffer()` + ffmpeg 15s sample (`lib/music.ts`, `lib/frames.ts`)
- [x] `POST /api/identify-audio` (25 MB cap, multipart `clip` / aliases)
- [x] `/draft/detect` upload UI + `MusicCard` + deep link `/?mode=music&url=`
- [x] Draft hub **Music scan** card
- [x] Home query hydration (`AnalyzeToolPage`: `mode` + `url` only — user still taps **Analyze**)

**Finish before calling it “done” on prod home**

- [ ] **Scan** entry on landing (`InputScreen` / MUSIC tab or fourth path) — not only `/draft/detect`
- [ ] **Mic capture** (Phase 2): MediaRecorder ~15s, wave/countdown UX, same API
- [ ] **One-flow breakdown** (Phase 3): after match, auto `POST /api/analyze-music` or `?url=` + auto-run analyze (today: extra click)
- [ ] **Spotify fallback** (Phase 4): when ACR returns title/artist but no `spotify_id`, call search (reuse `/api/search-spotify` from voice branch after merge/rebase)
- [ ] Error/empty states: file too large, ffmpeg failure, rate-limit messaging
- [ ] Docs/README on main when merged; optional CONCEPT link from voice branch if both land

**Merge note**

- Overlaps **`app/draft/page.tsx`** and **`components/AnalyzeToolPage.tsx`** with **`ammr/voice-describe-f408` (PR #15)**. Merge one PR first, rebase the other, combine draft hub cards (3-col grid can hold history + explore + detect + voice).

---

## Related code

| Piece | Path |
|-------|------|
| ACR client | `lib/music.ts` → `identifyAudioBuffer` |
| ffmpeg sample | `lib/frames.ts` → `extractIdentifyAudioSample` |
| Video-side match UI | `components/MusicCard.tsx` |
| Types | `types/identify-audio.ts`, `types/analysis.ts` (`MusicMatch`) |
