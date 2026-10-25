# WhyItSlaps — product summary & roadmap

## One-liner

**Three modes, one site:** analyze **short video** (why the clip slaps), a **Spotify track** (why the song slaps), or a **still picture** (why the photograph, artwork, or other still slaps).

For setup, see **[README.md](./README.md)**. For architecture, **[techstack/README.md](./techstack/README.md)**. For deployment limits, **[BOTTLENECKS.md](./BOTTLENECKS.md)**.

---

## How it works (short)

| Mode | Input | Main outputs |
|------|--------|----------------|
| **VIDEO** | YT / IG / TikTok / X URL, file upload, or extension-captured MP4 | Vision critique JSON, palette, scores (0–100), optional **ACRCloud** track match on the **clip audio**, share text, MP4 download (URL flow), **Edit my footage** |
| **MUSIC** | `open.spotify.com/track/...` | Spotify metadata + **audio features**, structured sonic critique (`MusicResultsScreen`) |
| **STILL** | One uploaded JPEG, PNG, WebP, or GIF (8 MB) | Vision critique, palette, five scores. No URL paste. Focal length, aperture, shutter, and ISO only when the file contains that tag. |

Toggle **VIDEO** / **MUSIC** / **STILL** on the home page (`InputScreen`).

**Note:** “Music” on the **video** results page (MusicCard) is **fingerprint ID** from the video’s soundtrack, not the same as **MUSIC** mode (Spotify-first pipeline).

---

## Design system

Dark editorial **`#0A0A0A`**, **`paper`** `#F5F0E8`, **DM Serif Display** + **IBM Plex Mono**, grain overlay, sharp corners, mono uppercase UI type.

These are the brand, and a later design pass has to keep them. Allowed patterns: near-black ground, paper type and score fills, serif wordmark and headlines, mono uppercase UI with wide tracking, grain, hairline borders, square corners. No gradient meshes, glass panels, or rounded cards.

Motion stays in CSS (Tailwind keyframes). No GSAP or Motion unless a specific effect cannot be done natively, and only after an explicit yes. On arrival, the judgment develops and the source facts sit still: score meters and palette swatches ease out in sequence, then the “why it works” cards. Prose blocks do not animate. `prefers-reduced-motion` skips the entrance and shows the finished layout, with meters already at their scores.

[Genjutsu](https://github.com/AThevon/genjutsu) is an agent skill for that kind of pass (`cast` on one screen). It is not an app dependency. A `cast` has to name the allowed patterns above before it writes code. `paint` only if the brand itself is being reopened. `bunshin` is the wrong size for this app.

## Critique voice

One speaker, in `lib/dialogue.ts`, composed into the video critique, the music critique, and the edit plan. Prose names a move, says what it does to the person watching or listening, and in a how-to gives one thing to try.

Video names a hold, a cut, or where the eye goes, then what that does to the person watching, in the same sentence. Music names what enters, what leaves, or which sound yields, then what that does to the person listening, in the same sentence. Still names where the eye lands, what the light is doing, or whether the frame gives the subject room, then what that does to the person looking, in the same sentence. `STILL_CRAFT` is sent by `/api/analyze-still`. Each analyze stays one model call. The still route passes focal length, aperture, shutter, and ISO only when the file contains that tag, and the prompt is told which of those were present. The model does not guess a lens or a camera.

---

## Built feature list

- **VIDEO:** `/api/analyze`, `/api/analyze-upload`, `/api/download`, `/api/editplan`; `ResultsScreen`; session cache `whyitslaps:last-result`.
- **MUSIC:** `/api/analyze-music`; `MusicResultsScreen`; `lib/spotify.ts`, `lib/claude-music.ts`, `types/music-analysis.ts`.
- **STILL:** `/api/analyze-still`; `StillResultsScreen`; `lib/claude-still.ts`, `types/still-analysis.ts`. Palette via `node-vibrant`. EXIF focal length, aperture, shutter, and ISO only when the file has the tag.
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
| Still exposure tags | exifr. Focal length, aperture, shutter, and ISO only when that tag is in the file. |

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

A third mode, **STILL**, for a photograph, a painting, a print, or another still, including a screenshot or a low-quality copy. Same product shape as video and music: ingest, structured critique, results. The upload path is live. Focal length, aperture, shutter, and ISO are read only when the file contains that tag.

| | Still |
|---|---|
| In | One uploaded JPEG, PNG, or WebP. No URL paste in the first version. |
| Facts | `node-vibrant` palette, same six swatches as video. EXIF (focal length, aperture, shutter, ISO) only when the file actually contains the tag. |
| Critique | New JSON-only prompt, sibling of `lib/claude.ts` and `lib/claude-music.ts`. |
| Screen | Reuse `MeterFill`, `ColorPalette`, and `WhyItWorks`. |

Skip yt-dlp, ffmpeg, ACRCloud, and `/api/editplan`. Artwork uses the same path; medium (photo, painting, print, other) is a tag, not its own mode. A screenshot or a crushed copy is other unless the picture itself is clearly a photo, painting, or print. A low-quality photo stays a photo.

Five scores, so the existing meters still work: composition, light, color harmony, subject, overall vibe. Sections: framing, light, color, exactly four “why it works” points, exactly four how-to steps. A photograph can say how to shoot. A painting or print says how to make one. A screenshot or other degraded copy says how to make the picture you can see. The prompt may use photography rules when the picture supports them, and must skip a rule when it does not: thirds and power points, leading lines, frame within a frame, negative space, symmetry against tension, horizon, foreground / midground / background, light direction and quality, contrast, color temperature, what the eye hits first, isolation, gesture. The model does not guess a lens or a camera. Missing EXIF stays missing. Softness, compression, pixelation, and screen chrome are visible facts, not a lens or a missing exposure setting.

Shipped: types, prompt, one upload route, one results screen, a STILL label on the home toggle. No gallery, no accounts, no URL paste. Focal length, aperture, shutter, and ISO go into the prompt only when the file contains that tag. Camera and lens are not read.

---

## Domain & ops

- **whyitslaps.com** (Porkbun).
- **ACRCloud** — Identify quotas on the **video** path.
- **Spotify** — developer app + client-credentials for **music** mode.
- **Anthropic** — vision, music prose, edit plan; monitor usage dashboard.
