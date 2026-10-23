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

These are the brand, and a later design pass has to keep them. Allowed patterns: near-black ground, paper type and score fills, serif wordmark and headlines, mono uppercase UI with wide tracking, grain, hairline borders, square corners. No gradient meshes, glass panels, or rounded cards.

Motion stays in CSS (Tailwind keyframes). No GSAP or Motion unless a specific effect cannot be done natively, and only after an explicit yes. On arrival, the judgment develops and the source facts sit still: score meters and palette swatches ease out in sequence, then the “why it works” cards. Prose blocks do not animate. `prefers-reduced-motion` skips the entrance and shows the finished layout, with meters already at their scores.

[Genjutsu](https://github.com/AThevon/genjutsu) is an agent skill for that kind of pass (`cast` on one screen). It is not an app dependency. A `cast` has to name the allowed patterns above before it writes code. `paint` only if the brand itself is being reopened. `bunshin` is the wrong size for this app.

## Critique voice

One speaker, in `lib/dialogue.ts`, composed into the video critique, the music critique, and the edit plan. Prose names a move, says what it does to the person watching or listening, and in a how-to gives one thing to try.

Video craft treats the clip as a scene: a want, something in the way, where the eye goes, and a cut that lands for a reason. Music craft talks arrangement and mix: what enters, what leaves, and which sound yields when two fight. `STILL_CRAFT` sits in the same file and is not sent until a still route exists. Each analyze stays one model call.

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

### Still pictures

A third mode, **STILL**, for a photograph or a piece of artwork. Same product shape as video and music: ingest, structured critique, results. Not built yet.

| | Still |
|---|---|
| In | One uploaded JPEG, PNG, or WebP. No URL paste in the first version. |
| Facts | `node-vibrant` palette, same six swatches as video. EXIF (focal length, aperture, shutter, ISO) only when the file actually contains the tag. |
| Critique | New JSON-only prompt, sibling of `lib/claude.ts` and `lib/claude-music.ts`. |
| Screen | Reuse `MeterFill`, `ColorPalette`, and `WhyItWorks`. |

Skip yt-dlp, ffmpeg, ACRCloud, and `/api/editplan`. Artwork uses the same path; medium (photo, painting, print) is a tag, not its own mode.

Five scores, so the existing meters still work: composition, light, color harmony, subject, overall vibe. Sections: framing, light, color, exactly four “why it works” points, exactly four “how to shoot like this” steps. The prompt may use photography rules when the picture supports them, and must skip a rule when it does not: thirds and power points, leading lines, frame within a frame, negative space, symmetry against tension, horizon, foreground / midground / background, light direction and quality, contrast, color temperature, what the eye hits first, isolation, gesture. The model does not guess a lens or a camera. Missing EXIF stays missing.

First slice when this starts: types, prompt, one upload route, one results screen, a STILL label on the home toggle. No gallery and no accounts. README and the home-page one-liner change when that toggle ships.

---

## Domain & ops

- **whyitslaps.com** (Porkbun).
- **ACRCloud** — Identify quotas on the **video** path.
- **Spotify** — developer app + client-credentials for **music** mode.
- **Anthropic** — vision, music prose, edit plan; monitor usage dashboard.
