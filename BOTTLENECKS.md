# Production bottlenecks & constraints

This app is straightforward on a **developer machine** with Homebrew-installed tools and a logged-in browser. In **hosted production** (especially serverless), several of those assumptions break. This file lists the main limits so expectations stay aligned with how the code actually works.

---

## 1. CLI tools are not npm dependencies

Analysis and download run **`yt-dlp`** and **`ffmpeg`** (and **`ffprobe`**) as subprocesses (`lib/download.ts`, `lib/frames.ts`). They must exist on **`$PATH`** on the server.

- **Local:** `brew install yt-dlp ffmpeg` (see README).
- **Typical Node/serverless hosts:** Those binaries are **not** installed by `npm install`. Deploying to Vercel/AWS Lambda/etc. requires a **custom install** (build image, layer, Dockerfile, or full VM) unless you change the architecture to call a remote worker that already has the stack.

If production “can’t find yt-dlp/ffmpeg,” this is the first place to look.

---

## 2. Instagram (Reels) and browser cookies

For Instagram URLs, `downloadVideo` uses **`yt-dlp --cookies-from-browser chrome`** then **`safari`** (`lib/download.ts`).

- That only works where **Chrome or Safari exists** and the **same OS user** is **logged into Instagram**.
- On **Vercel (and most serverless VMs)** there is **no** user browser session. The cookie path **does not apply**. Downloads that depend on it will **fail or be flaky** unless you switch to another strategy (e.g. **`--cookies` / cookies file** from a secret, a dedicated account, or a proxy/capture service).

Separately, Meta often **rate-limits or blocks datacenter IPs** more aggressively than residential IPs—so even a correct cookie setup can still fail from cloud regions.

---

## 3. Long-running API routes vs host limits

These routes declare **`maxDuration = 300`** (five minutes), e.g.:

- `app/api/analyze/route.ts`
- `app/api/analyze-upload/route.ts`
- `app/api/download/route.ts`
- `app/api/editplan/route.ts`

The platform must **allow** that duration. On **Vercel**, maximum execution time depends on **plan and configuration**; the hosted limit may be **much lower** than 300 seconds. If analyze often stops with timeouts or abrupt failures in production but works locally, compare:

- Declared `maxDuration` in code
- **Actual** function timeout for your **project tier** and region ([Vercel limits](https://vercel.com/docs/functions/serverless-functions/runtimes#maxduration))

A route that needs several minutes for download + ffmpeg + vision API can exceed Hobby-tier ceilings quickly.

---

## 4. Ephemeral disk (`/tmp`)

Work happens under **`/tmp`** (e.g. `vc-{uuid}`). That matches common Linux serverless behavior, but:

- Space and **inode** limits exist per invocation.
- **Concurrent** analyzes multiply temp usage.

Very large merges or many parallel requests can hit disk limits on some hosts.

---

## 5. External APIs

- **Anthropic Messages API:** Network, quotas, and key validity. Failures surface as analyze/edit-plan errors after download/frames may have already succeeded.
- **ACRCloud:** Optional for music; missing keys yield `music: null` but the rest of the pipeline can still run.

---

## 6. Codec / client playback (download path)

Client-side “save MP4” flows may **transcode** for compatibility (`lib/transcodeDownload.ts`). That’s a separate concern from “can the server fetch the reel?” but can affect whether a downloaded file plays on QuickTime / certain devices.

---

## 7. Operational drift (old deploy vs new repo)

A project still wired to an **old Git repo** or an **old production branch** will keep shipping outdated `yt-dlp` behavior, env vars, and timeouts. Pointing **Vercel (or any host)** at the **current** repository and redeploying is required for fixes to reach production.

---

## Summary table

| Area | Local dev | Typical serverless (e.g. Vercel) |
|------|-----------|----------------------------------|
| `yt-dlp` / `ffmpeg` on PATH | Install via brew | Must be added explicitly |
| Instagram + `--cookies-from-browser` | Works if logged in locally | **Not equivalent** to local; needs another cookie/auth approach |
| `maxDuration = 300` | Often fine on long-lived Node | May exceed host cap |
| Egress / Meta blocking | Usually milder | Datacenter IPs can be blocked or throttled |

Use this doc when debugging “works on my machine, broken in production”—especially **Instagram Reels** and **timeouts**.

---

**See also:** [techstack/README.md](./techstack/README.md) for the full pipeline and API map (helps separate *host limits* from *application logic*).
