# WhyItSlaps

**WhyItSlaps** is a web app with two modes on the home page **`/`**:

- **VIDEO** — Why does this **short** hit? Paste a reel/short/TikTok/X link (or upload / use the extension). You get palette, pacing, grade, cinematography, edit read, recreation tips, **optional soundtrack ID** from the clip (ACRCloud), plus **Edit my footage** (shot list via `/api/editplan`).
- **MUSIC** — Why does this **track** hit? Paste a **Spotify track** URL. The app pulls metadata + **audio features** from Spotify, then a **language model** returns a structured sonic critique (`/api/analyze-music`).

---

## GitHub “About” description (copy-paste)

Use this in the repository **About** box if you want a single line that matches the product:

```text
Short-form VIDEO analysis (palette, vision critique, optional ACRCloud track ID, edit plan) and MUSIC analysis (Spotify track links, audio features, structured sonic breakdown). Next.js, yt-dlp, ffmpeg, Anthropic, Spotify Web API.
```

---

## How it works

### VIDEO mode

1. Choose **VIDEO** on **`/`** and paste a supported **HTTPS** link (YouTube, Instagram, TikTok, X), or use the **Chrome extension** / **`POST /api/analyze-upload`** when a direct file works better.
2. **Analyze** runs: capped grab (**≤60s**, **720p** on the yt-dlp path) → **ffmpeg** keyframes (~every **4s**) + **~10s MP3** for fingerprinting.
3. **node-vibrant** → palette; **ACRCloud** (if configured) → **MusicCard** on the video results page; **Anthropic** vision API → strict JSON critique.
4. **Results**: share text, download source MP4 (URL flows), **Edit my footage** for a tailored edit plan.

**Download** (VIDEO only) skips analysis and only saves the capped MP4 via `/api/download`.

### MUSIC mode

1. Choose **MUSIC** and paste **`open.spotify.com/track/...`**.
2. **`POST /api/analyze-music`** uses **Spotify Web API** (client-credentials) for track + **audio features**, then **Anthropic** for the JSON breakdown (`lib/claude-music.ts`, `MusicResultsScreen`).

Requires **`SPOTIFY_CLIENT_ID`** and **`SPOTIFY_CLIENT_SECRET`** in `.env.local`. No yt-dlp/ffmpeg on that path.

---

## Stack in one paragraph

Next.js 14 (App Router) + TypeScript + Tailwind. **Video** path: **yt-dlp**, **ffmpeg** / **ffprobe**, **node-vibrant**, **ACRCloud**, **Anthropic**. **Music** path: **Spotify Web API** + **Anthropic**. Optional Chrome **extension** for Instagram CDN uploads.

---

## What you can do in the app

| Action | What happens |
|--------|----------------|
| **VIDEO** + **Analyze** | Full video pipeline → `ResultsScreen`. |
| **VIDEO** + **Download** | `POST /api/download` → MP4 only. |
| **MUSIC** + **Analyze** | `POST /api/analyze-music` → `MusicResultsScreen`. |
| **`/welcome`** | Short intro; **`/?fresh=1`** clears cached **video** result. |
| **Edit My Footage** | After **video** analysis → `/api/editplan`. |
| **Extension** | IG CDN capture → `analyze-upload` when needed. |

**Two different “music” ideas:** (1) **VIDEO** results may show **identified audio** from the clip (ACRCloud). (2) **MUSIC** mode is **Spotify-first track analysis** (features + prose), independent of video.

---

## Prerequisites (local machine running `next dev` / Node API)

**Video features** need CLI tools (examples for macOS):

```bash
brew install yt-dlp ffmpeg
```

`ffprobe` ships with ffmpeg and must be on `$PATH`.

---

## Environment

Create `.env.local` beside `package.json` (never commit it):

```
ANTHROPIC_API_KEY=
# Optional: vision / music / edit-plan model overrides (see lib/claude.ts, lib/claude-music.ts, editplan route)
ANTHROPIC_MODEL=
ANTHROPIC_EDITPLAN_MODEL=

# Video soundtrack fingerprinting (optional — video analysis still runs without)
ACRCLOUD_HOST=identify-eu-west-1.acrcloud.com
ACRCLOUD_ACCESS_KEY=
ACRCLOUD_ACCESS_SECRET=

# Music mode (Spotify track + audio features) — required for /api/analyze-music
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
```

- **Anthropic:** Messages API for vision critique, music JSON, and edit plans.
- **ACRCloud:** Fingerprint clip audio on the **video** path; missing/failed → `music: null` in video results.
- **Spotify:** **Client credentials** flow (`lib/spotify.ts`); needed only for **MUSIC** mode.

---

## Commands

```bash
npm install
npm run dev
```

Production parity:

```bash
npm run build && npm run start
```

---

## API overview

| Route | Purpose |
|-------|---------|
| `POST /api/analyze` | JSON `{ "url": "https://..." }` — **video** pipeline |
| `POST /api/analyze-music` | JSON `{ "url": "https://open.spotify.com/track/..." }` |
| `POST /api/analyze-upload` | Multipart **`video`** (max **100 MB**) |
| `POST /api/download` | JSON `{ "url" }` → MP4 |
| `POST /api/editplan` | Edit plan after **video** analysis |

Details: **[techstack/README.md](./techstack/README.md)** · product notes: **[CONCEPT.md](./CONCEPT.md)** · hosting limits: **[BOTTLENECKS.md](./BOTTLENECKS.md)**.

---

## Implementation notes

- Analyze/download temp dirs live under **`/tmp`** and are removed in `finally` blocks.
- Instagram **video** URLs use **`yt-dlp --cookies-from-browser`** locally; see **[BOTTLENECKS.md](./BOTTLENECKS.md)** for serverless.
- `next.config.mjs` sets `experimental.serverActions.bodySizeLimit` for upload headroom.
