# WhyItSlaps

Next.js App Router app that analyzes **short-form video**: it grabs a **≤60s**, **≤720p** clip (via **yt-dlp**), samples **keyframes every ~4s** and the **first ~10s of audio**, builds a **color palette** (**node-vibrant**), fingerprints audio with **ACRCloud** when configured, and returns a structured critique from a **vision-capable model** via **Anthropic’s Messages API**.

**Docs:** **[How it works & behavior →](./CONCEPT.md)** · **[Technical architecture →](./techstack/README.md)** · **[Production limits (Vercel, IG, binaries) →](./BOTTLENECKS.md)**

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
