# WhyItSlaps — product context (Impeccable)

> Durable product truth for design agents. Full roadmap: [CONCEPT.md](./CONCEPT.md).

## Platform

Web — Next.js 14 App Router, TypeScript, Tailwind. Primary surface: **whyitslaps.com**.

## Primary user

Creators and curious listeners who paste a **short video link**, a **Spotify track**, or upload a **still picture** and want a structured “why it slaps” breakdown (scores, palette where applicable, actionable how-to), not a generic chat reply.

## Job to be done

1. **VIDEO** — Ingest URL or upload → vision critique, palette, scores, optional soundtrack ID, share/export, optional edit plan.
2. **MUSIC** — Spotify track URL or audio scan → features + sonic critique, DAW-oriented produce steps.
3. **IMAGE** — Single image upload → vision critique, palette, scores (EXIF exposure facts only when present in file). Code path is still `still`. Photo is a result medium, not the tab.
4. **History** — Local device log of past video/music analyses; reopen without re-analyze.

## Positioning

One site, three modes, one editorial voice (`lib/dialogue.ts`). Anonymous-first; no accounts required for core analyze flows.

## Constraints agents must preserve

- Brand: near-black `#0A0A0A`, paper `#F5F0E8`, DM Serif Display + IBM Plex Mono, grain overlay, **sharp corners**, mono uppercase UI.
- **Do not** recommend or ship gradient meshes, glass panels, or rounded-card redesigns unless CONCEPT is explicitly reopened.
- Motion: CSS keyframes only; respect `prefers-reduced-motion`.
- Still: do not guess lens/camera; exposure tags only from file metadata.

## Open decisions

- Still analyses in History tab (not logged today).
- Share/copy parity on still results vs video/music.
- Public indexing of `/draft/*` and `/demo/*`.
- Scores stay **character meters** for this piece, not competitive rank; durable `/s/:id` share URLs wait on a persistence backend. Tracker: [`docs/CREATIVE_UX.md`](./docs/CREATIVE_UX.md).

## Stack

See [README.md](./README.md) and [techstack/README.md](./techstack/README.md). Video: yt-dlp, ffmpeg, Anthropic, ACRCloud. Music: Spotify Web API, Anthropic. Still: Anthropic, node-vibrant, exifr.
