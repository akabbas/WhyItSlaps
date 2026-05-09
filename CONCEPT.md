# WhyItSlaps — product summary & roadmap

## One-liner

**Two modes, one site:** analyze **short video** (why the clip slaps) or analyze a **Spotify track** (why the song slaps).

For setup, see **[README.md](./README.md)**. For architecture, **[techstack/README.md](./techstack/README.md)**. For deployment limits, **[BOTTLENECKS.md](./BOTTLENECKS.md)**.

---

## How it works (short)

| Mode | Input | Main outputs |
|------|--------|----------------|
| **VIDEO** | YT / IG / TikTok / X URL, file upload, or extension-captured MP4 | Vision critique JSON, palette, scores (0–100), optional **ACRCloud** track match on the **clip audio**, share text, MP4 download (URL flow), **Edit my footage** |
| **MUSIC** | `open.spotify.com/track/...` | Spotify metadata + **audio features**, structured sonic critique (`MusicResultsScreen`) |

Toggle **VIDEO** / **MUSIC** on the home page (`InputScreen`).

**Note:** “Music” on the **video** results page (MusicCard) is **fingerprint ID** from the video’s soundtrack, not the same as **MUSIC** mode (Spotify-first pipeline).

---

## Design system

Dark editorial **`#0A0A0A`**, **`paper`** `#F5F0E8`, **DM Serif Display** + **IBM Plex Mono**, grain overlay, sharp corners, mono uppercase UI type.

---

## Built feature list

- **VIDEO:** `/api/analyze`, `/api/analyze-upload`, `/api/download`, `/api/editplan`; `ResultsScreen`; session cache `whyitslaps:last-result`.
- **MUSIC:** `/api/analyze-music`; `MusicResultsScreen`; `lib/spotify.ts`, `lib/claude-music.ts`, `types/music-analysis.ts`.
- **Chrome extension** (`extension/`) — optional IG CDN → upload API.
- **`/welcome`** — explainer; **`/analyze`** → redirect `/`.

---

## Tech stack (product view)

| Layer | Tool |
|-------|------|
| App | Next.js 14 App Router, TypeScript, Tailwind |
| Video critique + edit plan | Anthropic Messages API |
| Music critique | Anthropic Messages API (+ Spotify data as input) |
| Video download | yt-dlp |
| Frames / clip audio | ffmpeg, ffprobe |
| Soundtrack ID (on video) | ACRCloud Identify |
| Track + features (music mode) | Spotify Web API |
| Palette | node-vibrant |

---

## Roadmap

### More music sources

MUSIC mode is **Spotify track URLs** today. Future: YouTube-music style links, uploads, or other DSPs — each needs ingest + feature extraction or model-only analysis.

### Generative video prompt export

Post-**video**-analysis prompts for tools like Runway / Kling from tags, grade, palette.

### Share / export

Richer share formats; PDF; durable share URLs (today: **video** result cached in `sessionStorage`; **music** session is not persisted the same way — see code).

### Product ideas

Slap library, batch “what do these shares have in common?” reports.

---

## Domain & ops

- **whyitslaps.com** (Porkbun).
- **ACRCloud** — Identify quotas on the **video** path.
- **Spotify** — developer app + client-credentials for **music** mode.
- **Anthropic** — vision, music prose, edit plan; monitor usage dashboard.
