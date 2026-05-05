# VibeCheck

Next.js App Router analyzer that yt-dlp’s a ≤60 s clip (≤720 p), samples JPEG keyframes (~4 s cadence), fingerprints the opening 10 s audio with **ACRCloud**, extracts a Vibrant-derived palette from the middle-ish frame, then asks **Claude Sonnet with vision** (default **`claude-3-5-sonnet-20241022`**) for a JSON critique. Optionally set **`ANTHROPIC_MODEL`** in `.env.local` if your workspace uses another model ID from [Models](https://docs.anthropic.com/en/docs/about-claude/models).

## Prerequisites (local machine running `next dev` / Node API)

Install CLI tools globally (examples for macOS with Homebrew):

```bash
brew install yt-dlp ffmpeg
```

`ffprobe` ships with ffmpeg and must be on `$PATH`.

## Environment

Create `.env.local` beside `package.json` (never commit it):

```
ANTHROPIC_API_KEY=
# Optional override (default used if omitted): ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
ACRCLOUD_HOST=identify-eu-west-1.acrcloud.com
ACRCLOUD_ACCESS_KEY=
ACRCLOUD_ACCESS_SECRET=
```

- `ANTHROPIC_API_KEY`: Anthropic Console key with Messages API access.
- `ANTHROPIC_MODEL`: Optional. Defaults to **`claude-3-5-sonnet-20241022`** (vision-capable).
- `ACRCLOUD_HOST`: The region host shown in your ACRCloud Identify project (**no** trailing slash path).
- `ACRCLOUD_ACCESS_KEY` / `ACRCLOUD_ACCESS_SECRET`: Identify credentials exactly as documented at [ACRCloud Identify API](https://docs.acrcloud.com/reference/identification-api/identification-api.md) (multipart `/v1/identify` signing).

Missing ACR vars (or failed identify) yields `music: null` in the API response — the rest of the analysis still completes.

## Commands

```bash
npm install
npm run dev
```

Production parity check:

```bash
npm run build && npm run start
```

## Implementation notes

- Analysis API: `POST /api/analyze` (`app/api/analyze/route.ts`). Optional **download** of the same capped clip: `POST /api/download` (`app/api/download/route.ts`) — returns `video/mp4` as an attachment (same `yt-dlp` rules as analyze; Instagram still prefers browser cookies).
- Temp artifacts go to `/tmp/vc-{uuid}` (analyze) or `/tmp/vc-dl-{uuid}` (download only) and are wiped in a `finally` block.
- The original spec mentioned both `/tmp/{uuid}.mp4` and `/tmp/{uuid}/frames…`; a single `.mp4` file cannot coexist with a directory of the **same name** on Unix, so the server uses **`/tmp/vc-{uuid}/source.mp4` + `./frames/frame_%03d.jpg` + `./audio.mp3`** instead—same semantics, collision-free.
- `next.config.mjs` raises `experimental.serverActions.bodySizeLimit`; the analyze route body is tiny (URL JSON) but leaves headroom if you evolve the POST shape.
