# WhyItSlaps — product summary & roadmap

## One-liner

WhyItSlaps takes a **short video** (URL, upload, or browser-captured media), samples it, and returns a **structured aesthetic breakdown**—palette, scores, cinematography, grade, edit read, recreation tips—plus **soundtrack identification** when ACRCloud finds a match.

### How it works (same as README)

1. Paste a supported URL on **`/`** (or upload / extension).
2. Server downloads a capped clip and extracts frames + short audio.
3. Palette + optional ACRCloud track ID; vision model fills JSON critique.
4. One results page: share text, download MP4 (URL flows), optional edit plan.

For the **full numbered walkthrough**, see the [README](./README.md#how-it-works). For **implementation detail**, stay in this doc’s later sections and **[techstack/README.md](./techstack/README.md)**.

Design system: dark editorial **`#0A0A0A`**, **`paper`** accent (`#F5F0E8`), **DM Serif Display** + **IBM Plex Mono**, sharp corners, grain overlay, minimal chrome.

For **how it’s implemented**, see **[techstack/README.md](./techstack/README.md)**. For **local setup**, **[README.md](./README.md)**. For **production gotchas**, **[BOTTLENECKS.md](./BOTTLENECKS.md)**.

---

## How the product behaves today

### Primary flow: video analysis

1. User pastes a supported **HTTPS video link** on **`/`** (YouTube, Instagram, TikTok, X/Twitter) — max length enforced at download (**≤60s**), resolution capped (**720p**) on the yt-dlp path.
2. **Analyze** runs the full pipeline: grab → keyframes + audio snippet → palette → optional track ID → vision model → JSON UI.
3. **Download** (same screen) only fetches a capped **MP4** via `/api/download` (no vision bill).
4. **`/welcome`** is a lightweight explainer; **`/analyze`** redirects to **`/`**.

**Music in the product today** is **not** a separate “mode.” It is **ACRCloud fingerprinting** on the first ~10s of extracted audio, surfaced in **MusicCard** (title, artist, BPM, genres, Spotify link when present). If keys are missing or identify fails, **`music` is `null`** and the rest of the critique still shows.

### Other entry paths

- **`POST /api/analyze-upload`** — multipart **video** file (e.g. extension or custom client), **100 MB** cap, same analysis pipeline **without** yt-dlp.
- **Chrome extension** (`extension/`) — captures Instagram CDN **MP4** URLs from the tab and can upload them to **`analyze-upload`** when server-side IG download is blocked.

### After results

- **Share** copies a text summary (clipboard).
- **Edit My Footage** collects user-described clips + target duration, calls **`/api/editplan`**, returns a shot list, grade notes, NLE setup hints, and **music direction** for the *edit* (tempo, mood, search terms—not a second ACR pass).

### Video vs music (clarity)

| | **Shipped** | **Not shipped yet** |
|---|-------------|---------------------|
| **Video** | Full URL / upload / extension-assisted analysis | — |
| **Music** | Track **ID** next to video results (ACRCloud) | Dedicated **music-only** analysis (paste Spotify / audio URL, song-centric UI, no video pipeline) |
| **UI toggle** | None — single **video-first** entry | A future **music mode** would need new routes, types, and results screen (see Roadmap) |

Scores in the UI are **0–100** integers per dimension, not “out of 10.”

---

## Built feature list

- **`/api/analyze`** — URL JSON → `AnalyzeSuccess` / error body (`types/analysis.ts`).
- **`/api/analyze-upload`** — multipart video → same shape.
- **`/api/download`** — URL → MP4 attachment (with client-side compatibility handling where applicable).
- **`/api/editplan`** — reference analysis + user clips → `EditPlan` JSON (`types/editplan.ts`).
- **Results UI** — `ResultsScreen` + panels (scores, palette, music card, copy blocks, edit panel).
- **Session persistence** — last result in `sessionStorage`; **`?fresh=1`** clears.
- **Extension** — optional IG CDN capture → upload API.

---

## Tech stack (product view)

| Layer | Tool |
|-------|------|
| App | Next.js 14 App Router, TypeScript, Tailwind |
| Vision + edit copy | Anthropic Messages API |
| Download | yt-dlp |
| Frames / audio | ffmpeg, ffprobe |
| Track ID | ACRCloud Identify |
| Palette | node-vibrant |

---

## Design system (short)

- Background `#0A0A0A` + film grain; accent **`paper`** `#F5F0E8`.
- Cards: `border-white/12`, muted fills; accent rail `border-l-2 border-paper`.
- Typography: serif for pull quotes / hero, mono for UI and metadata.

---

## Roadmap

### Dedicated music analysis mode

Goal: paste a **music** link (Spotify, YouTube audio, etc.) and get song-centric analysis without running the full video pipeline.

Planned building blocks (illustrative):

- New route e.g. `/api/analyze-music` + types + `MusicResultsScreen` (or equivalent).
- Optional **Spotify Audio Features** (or similar) for quantitative layer beside qualitative prose.
- **UI**: explicit **Video / Music** switch on the home flow once both paths exist.

### Generative video prompt export

Post-analysis prompts tuned for tools like Runway / Kling, using tags, grade, and palette.

### Share / export

- Richer share formats; optional PDF one-pager; durable share URLs (today: session-only).

### Product ideas

- Slap library / saved analyses.
- Batch compare (many clips → pattern report).

---

## Domain & ops notes

- **whyitslaps.com** (Porkbun) — branding fits both video-first today and future music mode.
- ACRCloud free tier limits — see their console for Identify quotas.
- Anthropic usage — vision + edit plan calls; monitor dashboard for cost.
