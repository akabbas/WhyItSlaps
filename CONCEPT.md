# Current app summary

WhyItSlaps analyzes video URLs and explains why they look good — color grade, edit style, cinematography, music, and a shot-by-shot recreation guide. Built with Next.js 14, TypeScript, Tailwind, Anthropic’s Messages API (vision), yt-dlp, ffmpeg, ACRCloud, and node-vibrant.

Design system: dark editorial aesthetic, `#0A0A0A` background, `paper` (#F5F0E8) accent, DM Serif Display + IBM Plex Mono fonts, sharp corners everywhere, no pills, no gradients.

## What is already built and working

- Video analysis via `/api/analyze`
- Edit plan generation via `/api/editplan`
- Full results UI in `ResultsScreen.tsx`
- Edit My Footage panel in `EditMyFootagePanel.tsx`
- Music/Video mode toggle placeholder in `InputScreen.tsx`

# WhyItSlaps — Concept & Roadmap

## What It Is

WhyItSlaps is an aesthetic analysis tool for curious artists and casual enthusiasts. You paste a video URL and the app tells you **why it slaps** — not the metadata, not the view count, but the actual creative and cinematic elements that make it feel infectious, chic, or tasteful. It teaches you how to edit like the video you just analyzed.

The goal is to decode taste in a way that's friendly and accessible — not academic, not intimidating. Some videos have no captions, no text, no explanation — and they're just *sick*. WhyItSlaps tells you why.

---

## Core Features (Built)

### 1. Video Aesthetic Analysis

- Paste any URL from YouTube, Instagram, TikTok, or Twitter/X
- App downloads the video via yt-dlp, extracts keyframes via ffmpeg
- Sends keyframes to a vision model (Anthropic Messages API) for structured visual analysis
- Returns:
  - Vibe summary (written like a creative director, not a robot)
  - Aesthetic tags + target audience
  - Cinematography breakdown (shot types, camera movement, framing, depth of field)
  - Color grade breakdown (shadows, highlights, saturation, signature color, film stock comparison)
  - Edit style (pacing, cut pattern, transitions)
  - "Why It Works" — specific elements and why each one makes the video feel good
  - "How To Recreate It" — actionable step-by-step tips
  - Aesthetic scores out of 10 (color harmony, edit pacing, motion feel, subject framing, overall vibe)
  - Dominant color palette (6 swatches from node-vibrant)
  - Music identification via ACRCloud (title, artist, BPM, genres, Spotify link)

### 2. Edit My Footage Like This

- After analysis, user can enter their own clips (label, duration, description)
- Set a target duration and optional notes
- App generates a shot-by-shot edit plan tailored to match the reference video's aesthetic
- Returns:
  - Edit overview
  - Full sequence with per-clip instructions (in point, hold duration, transitions, color grade, texture overlay)
  - Global color grade settings
  - Music direction (BPM, genre, search terms, sync notes)
  - Software-specific setup steps for both Premiere Pro and DaVinci Resolve
  - Pro tips for nailing the aesthetic

### 3. Mode Toggle (Placeholder)

- VIDEO mode (active, fully functional)
- MUSIC mode (UI placeholder, coming soon)

---

## Tech Stack

| Layer | Tool |
|-------|------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Models | Anthropic Messages API (vision-capable) |
| Video download | yt-dlp (CLI) |
| Frame extraction | ffmpeg (CLI) |
| Music ID | ACRCloud HTTP API |
| Color extraction | node-vibrant |
| Fonts | DM Serif Display + IBM Plex Mono |

---

## Design System

- Background: `#0A0A0A` with film grain overlay
- Accent color: `paper` = `#F5F0E8`
- Typography: DM Serif Display for display/quotes, IBM Plex Mono for everything else
- Cards: `border border-white/12`, `bg-black/20–55`
- Accent rails: `border-l-2 border-paper pl-4`
- Buttons: sharp corners, no pills, mono uppercase tracking
- Dark editorial aesthetic — think film zine, not SaaS dashboard

---

## Planned Features

### Music Analysis Mode (Next Major Feature)

Same concept as video analysis but for songs. User pastes a Spotify, SoundCloud, or YouTube link and gets:

- Song structure breakdown (why the arrangement works)
- Production style analysis (what makes the mix feel expensive or intimate)
- Sonic texture description (layers, space, specific sounds)
- Emotional arc (how energy builds and releases)
- Genre-bending elements (what makes it feel fresh)
- Why it's infectious (the specific hook or moment)
- Target listener / niche audience
- "How to produce like this" — DAW-specific tips

**Additional data source to add:** Spotify Audio Features API (energy, danceability, valence, acousticness, key, tempo) for quantitative layer on top of qualitative visual analysis.

**Stack additions needed:**

- Spotify Audio Features API (free with Spotify developer account)
- Audio waveform visualization on frontend
- New API route: `/api/analyze-music`
- New types: `types/music-analysis.ts`
- New component: `components/MusicResultsScreen.tsx`

---

### Generative video prompt export

After a WhyItSlaps analysis, add a "Generate" section that auto-writes optimized prompts for:

- **Runway Gen-4** — cinematic, moody, film-grain style
- **Kling 2.0** — slow cinematic shots, strong motion
- Prompt is built directly from the analysis (color grade, motion style, aesthetic tags)
- Include the dominant color palette keyframe as a reference image suggestion

---

### Share / Export

- Share results as a formatted text summary (partially built)
- Export full analysis as a PDF one-pager
- Shareable URL with result stored in sessionStorage

---

## Domain

- Registered: `whyitslaps.com`
- Registrar: Porkbun
- Works for both video AND music — no need to change when music mode launches

---

## Future Product Ideas

- **WhyItSlaps for Music** — standalone or second mode in same app
- **Chrome Extension** — analyze any video you're watching without leaving the tab
- **"Slap Library"** — save and tag your analyzed videos into a personal inspiration board
- **Batch analysis** — drop 10 videos, get a report on shared aesthetic patterns across them

---

## Notes

- ACRCloud free tier: 100 recognitions/day — sufficient for MVP/personal use
- Vision API usage: modest per-request cost — fine for personal/MVP scale (see your Anthropic usage dashboard)
- yt-dlp + ffmpeg: fully free, no API cost
- Music mode should NOT be built until video mode is fully stable and deployed
