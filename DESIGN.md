# WhyItSlaps — design system (Impeccable)

> Authoritative visual rules for UI agents. Product source: [CONCEPT.md](./CONCEPT.md) § Design system.

## Ground

- Background: **`#0A0A0A`** (near-black), grain via `.grain-screen` + SVG turbulence in root layout.
- Type on dark: white / paper hierarchy; **paper** `#F5F0E8` for primary CTAs and score fills.
- **Browser mark:** cropped eclipse photograph (`app/icon.png`, `app/apple-icon.png`, `app/opengraph-image.jpg`) — near-black field, warm crescent, light grain. Do not hue-shift the crescent to paper; orange is the mark, paper stays UI type.

## Typography

- **Wordmark & display headlines:** DM Serif Display, uppercase with wide tracking on wordmark.
- **UI & body in chrome:** IBM Plex Mono, **uppercase** for labels, tabs, buttons; sentence case only in critique prose blocks.

## Components

- **Corners:** square (no rounded cards as a default pattern).
- **Borders:** hairline `border-white/12`–`/35`; inset cards `bg-black/20`–`/30`.
- **Tabs:** four-up grid on home card; active tab `bg-paper text-black`.
- **Primary CTA:** `bg-paper text-black` full-width or inline; secondary ghost borders.

## Allowed patterns

Near-black ground, paper type and score fills, serif wordmark and headlines, mono uppercase UI with wide tracking, grain, hairline borders, square corners.

## Forbidden patterns (unless CONCEPT reopened)

Gradient meshes, glass/frosted panels, rounded-card UI slop, nested gray-on-gray SaaS cards, Inter-as-everything, purple gradients.

## Motion

Score meters and palette swatches ease in sequence on results; prose blocks static. `prefers-reduced-motion`: skip entrance, show final layout.

## Key files

- Global: `app/globals.css`, `app/layout.tsx`
- Home: `components/InputScreen.tsx`, `components/AnalyzeToolPage.tsx`
- Results: `ResultsScreen`, `MusicResultsScreen`, `StillResultsScreen`
- Loading: `components/LoadingScreen.tsx`

## UI quality baseline

See [`docs/ui-impeccable-grade.md`](./docs/ui-impeccable-grade.md) for per-route Design Health scores and ordered polish lists. Creative UX tickets (meters, share cards, home from results): [`docs/CREATIVE_UX.md`](./docs/CREATIVE_UX.md).
