# Experimental: separate “Post this breakdown” share section

**Status:** Removed from live result screens (Sep 2025). Code and demo remain for design review.

**Why it was removed:** Production already ships **inline share cards** (`ShareCardPanel` + nav “share card” / “SHARE CARD” buttons — merged from PR #3). Running both flows duplicated PNG export UX and confused the results page.

**Where to preview the parked idea:**

| Location | Purpose |
|----------|---------|
| [`/demo/share-graphics`](/demo/share-graphics) | Static previews + live `ShareGraphicsSection` on fixture data |
| `components/share-graphics/` | Section, studio modal, card variants (story / square / overlay) |
| `lib/share-graphics-fixtures.ts` | Demo analysis payloads |
| `scripts/capture-share-graphics-screenshots.mjs` | Playwright helper for the demo page |

**Original PR:** [#6 — Explore social graphics](https://github.com/akabbas/WhyItSlaps/pull/6) (`ammr/share-graphics-explore-6a12`).

---

## Problem we were exploring

Text **share** (clipboard) is great for DMs; **image** share is better for Stories and feeds (Strava stats stickers, workout overlays). Two product questions:

1. **Where** should image export live in the UI?
2. **How many** templates (full card vs transparent overlay)?

---

## Two directions (we picked one for prod)

### A. Inline share card (shipped)

- **Entry:** “Share card” in the results nav (music) or “SHARE CARD” button (video).
- **UX:** Modal studio, story vs square, download PNG / Web Share API.
- **Code:** `components/ShareCardPanel.tsx`, `components/share-cards/*`.

### B. Separate section at bottom of results (this experiment — not shipped)

- **Entry:** Dashed-border block labeled **Social graphics · experimental** — “Post this breakdown”.
- **UX:** Three template tiles → `ShareGraphicsStudio` modal (story card, square card, clip overlay).
- **Rationale in PR #6:** Keeps heavy social/export UI **out of the main reading flow**; text share stays untouched above the fold.
- **Why we paused it:** Same job as (A) with a second visual system (`components/share-graphics/cards/*` parallel to `components/share-cards/*`). Prefer one path until we know which placement wins user testing.

---

## Templates in the experimental branch

| Template | Use case |
|----------|----------|
| **Story card** | Full 9:16 branded graphic |
| **Square card** | 1:1 feed post |
| **Clip overlay** | Transparent stats sticker over user video (video only) |

Overlay cards use transparent PNG export (`exportElementToPng` options overload in `lib/share-image.ts`).

---

## If we revive this

1. **User test** inline (A) vs bottom section (B) — or hybrid: overlay-only in section, cards inline.
2. **Consolidate components** — merge `share-cards/` and `share-graphics/cards/` to one card library.
3. **Re-enable** by importing `ShareGraphicsSection` at the bottom of `ResultsScreen` / `MusicResultsScreen` (see git history before Sep 2025 removal).
4. Update this doc’s status line when shipped or deleted.

---

## Related docs

- [`docs/draft-history-social.md`](./draft-history-social.md) — history tab / social library prototypes (`/draft/*`).
