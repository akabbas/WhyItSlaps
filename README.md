# WhyItSlaps

**WhyItSlaps** is a web app that explains *why* a short video hits: pacing, color grade, cinematography, edit style, palette, and concrete “how to recreate this” notes—plus **track identification** when the soundtrack is recognized.

---

## How it works

1. **You paste a link** to a public short (YouTube, Instagram, TikTok, or X) on the home page **`/`**, or you use the **Chrome extension** / **upload API** when a direct video file works better than a URL.
2. **The server grabs a capped clip** (about **60 seconds** max, **720p** cap on the download path) and writes temporary files under `/tmp`.
3. **ffmpeg** turns the clip into **still frames** (roughly one JPEG every **4 seconds**) and a short **MP3** slice (**~10 seconds**) for audio ID.
4. **node-vibrant** reads a representative frame for a **dominant palette**. **ACRCloud** (if configured) tries to **name the song** from that MP3; if it can’t, you still get the full visual critique.
5. A **vision model** (Anthropic Messages API) reads a batch of those frames and returns **strict JSON**: vibe summary, tags, scores (0–100), cinematography / grade / edit sections, “why it works,” and editing tips.
6. **Results** render on one page: you can **copy a text summary**, **download the source MP4** (when the analysis was URL-based), or open **Edit my footage** to generate a **shot list** tailored to your own clips (`/api/editplan`).

**Download-only:** the **Download** button skips steps 4–6 and just saves the capped MP4 through your browser.

For product positioning and roadmap, see **[CONCEPT.md](./CONCEPT.md)**. For sequence diagrams, env vars, and API detail, see **[techstack/README.md](./techstack/README.md)**. For hosting limits (Instagram cookies on servers, Vercel timeouts, missing `yt-dlp`), see **[BOTTLENECKS.md](./BOTTLENECKS.md)**.

---

## Stack in one paragraph

Next.js 14 (App Router) + TypeScript + Tailwind. Video acquisition uses **yt-dlp**; processing uses **ffmpeg** / **ffprobe**; color from **node-vibrant**; audio fingerprinting from **ACRCloud**; critique JSON from **Anthropic’s Messages API**.

---

## What you can do in the app

| Action | What happens |
|--------|----------------|
| Paste a video URL on **`/`** and click **Analyze** | Full pipeline: download → frames + audio → palette + track ID (if ACR matches) → vision JSON → results screen. |
| **Download** on the same screen | Only `POST /api/download` — saves a capped MP4 through the browser (no vision step). |
| **`/welcome`** | Short intro + links to open the tool or start with a cleared session (`/?fresh=1`). |
| **Edit My Footage** (after analysis) | Sends your clip notes + reference analysis to **`/api/editplan`** for a shot-by-shot plan and music direction for the edit. |
| **Chrome extension** (`extension/`) | Optionally captures Instagram CDN MP4 URLs and uploads to **`/api/analyze-upload`** when server-side IG fetch is flaky. |

**Music vs video:** There is **one video-first flow** today. **Music** means **identified soundtrack** on that clip (ACRCloud), shown in **MusicCard** — not a separate “music mode” tab. A dedicated **music-only** analyzer is **roadmap**; see [CONCEPT.md](./CONCEPT.md).

---

## Prerequisites (local machine running `next dev` / Node API)

Install CLI tools globally (examples for macOS with Homebrew):

```bash
brew install yt-dlp ffmpeg
```

`ffprobe` ships with ffmpeg and must be on `$PATH`.

---

## Environment

Create `.env.local` beside `package.json` (never commit it):

```
ANTHROPIC_API_KEY=
# Optional: override default vision model id from code
ANTHROPIC_MODEL=
# Optional: use a different model only for /api/editplan
ANTHROPIC_EDITPLAN_MODEL=
ACRCLOUD_HOST=identify-eu-west-1.acrcloud.com
ACRCLOUD_ACCESS_KEY=
ACRCLOUD_ACCESS_SECRET=
```

- `ANTHROPIC_API_KEY`: Anthropic Console key with Messages API access.
- `ANTHROPIC_MODEL`: Optional. Defaults to a vision-capable model id in `lib/claude.ts`.
- `ANTHROPIC_EDITPLAN_MODEL`: Optional. If unset, edit plan uses `ANTHROPIC_MODEL`.
- `ACRCLOUD_*`: Identify credentials per [ACRCloud Identify API](https://docs.acrcloud.com/reference/identification-api/identification-api.md).

Missing or failed ACR → `music: null` in the API; the rest of the analysis still completes.

---

## Commands

```bash
npm install
npm run dev
```

Production parity check:

```bash
npm run build && npm run start
```

---

## API overview

| Route | Purpose |
|-------|---------|
| `POST /api/analyze` | JSON `{ "url": "https://..." }` |
| `POST /api/analyze-upload` | Multipart field **`video`** (max **100 MB** file) |
| `POST /api/download` | JSON `{ "url": "https://..." }` → MP4 download |
| `POST /api/editplan` | Edit plan from prior analysis + user clip descriptions |

Details, pipeline diagram, and extension behavior: **[techstack/README.md](./techstack/README.md)**.

---

## Implementation notes

- Analyze and download use temp dirs under **`/tmp`** (`vc-*` prefixes), removed in `finally` blocks.
- Instagram URLs use **`yt-dlp --cookies-from-browser`** (Chrome then Safari) — **works on a dev machine with a logged-in browser**, not on typical serverless hosts; see **[BOTTLENECKS.md](./BOTTLENECKS.md)**.
- `next.config.mjs` sets `experimental.serverActions.bodySizeLimit` for headroom on large bodies (upload route).
