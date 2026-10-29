# WhyItSlaps — Impeccable UI grade (main)

**Rubric:** [Impeccable](https://github.com/pbakaus/impeccable) `critique` command — Nielsen’s 10 usability heuristics (0–4 each), **Design Health Score** total with rating band, **design specificity** (product-authored vs interchangeable), **cognitive load** checklist (0–1 = low, 2–3 = moderate, 4+ = high), and issue severity **P0–P3**. See [Heuristics Scoring Guide](https://github.com/pbakaus/impeccable/blob/main/.cursor/skills/impeccable/reference/critique.md#heuristics-scoring-guide) and [Score Summary bands](https://github.com/pbakaus/impeccable/blob/main/.cursor/skills/impeccable/reference/critique.md#score-summary).

**Brand guardrail (from [CONCEPT.md](../CONCEPT.md)):** near-black ground, paper type, serif wordmark, mono uppercase UI, grain, sharp corners — no gradient meshes, glass panels, or rounded cards in recommendations.

**Scope:** `origin/main` user-facing surfaces only. **Not graded for rework:** still-mode critique content, EXIF exposure facts, or shared critique voice in `lib/dialogue.ts` (already shipped). **Out of scope:** voice-transcription draft branch (do not merge). **Next steps:** [`UI_AGENT_PLAYBOOK.md`](./UI_AGENT_PLAYBOOK.md) · [`DEAD_ENDS.md`](./DEAD_ENDS.md) (routes, persistence, mocks).

**Method:** Local dev server (`npm run dev`) + [whyitslaps.com](https://whyitslaps.com) where noted. `npx impeccable detect` on `app/` and `components/` returned **0** pattern findings. Pages marked **source-only** were not fully rendered in this pass (redirects, error boundary, or state-only UI).

---

## Route inventory

| Route / screen | Reachable on main | How it appears |
|----------------|-------------------|----------------|
| `/` | Yes | Home input; mode tabs Video / Music / Still / History |
| `/` (state) | Yes | Video, music, or still **results** replace home after analyze |
| Loading overlay | Yes | Full-screen while analyze / download / scan |
| Home inline errors | Yes | Border-left message under form |
| `app/error.tsx` | Yes (on render crash) | Global “Something broke…” |
| `/?mode=history` | Yes | History tab (localStorage log) |
| `/welcome`, `/analyze` | Redirect | → `/` ([next.config.mjs](../next.config.mjs)) |
| `/draft` | Yes | Product draft hub |
| `/draft/explore` | Yes | Mock slap library |
| `/draft/history` | **Redirect** | → `/?mode=history` (source at `app/draft/history/page.tsx` is **source-only**) |
| `/draft/detect` | **Redirect** | → `/?mode=music` (source at `app/draft/detect/page.tsx` is **source-only**) |
| `/demo/share-graphics` | Yes | Archived share-graphics experiment |

---

## Grading key (per page)

Each page lists:

- **Design Health** — heuristic total / applicable max and Impeccable band
- **Specificity** — Strong / Mixed / Weak (category-interchangeable tells)
- **Cognitive load** — failed checklist items (of 8), if any
- **Unfinished** — product polish gaps (not feature requests)
- **Polish** — ordered, small diffs aligned with `/impeccable polish`, `typeset`, `layout`, `harden`, `clarify`, `adapt`, `onboard`

Heuristics **7** (flexibility) and **10** (help/docs) are **`n/a`** on pure marketing/draft explainer pages; tool surfaces score all ten unless noted.

---

## `/` — Home (Video tab)

**What you do:** Paste a short-video URL, upload a clip, or switch modes; run **Analyze** or **Download**.

| # | Heuristic | Score | Note |
|---|-----------|-------|------|
| 1 | Visibility of system status | 3 | Disabled Analyze/Download when URL invalid; platform glyph updates |
| 2 | Match system / real world | 3 | Creator-native copy; IG workaround called out |
| 3 | User control | 3 | Four clear tabs; no trap |
| 4 | Consistency | 3 | Matches results chrome |
| 5 | Error prevention | 3 | IG hint before failure |
| 6 | Recognition | 3 | Labeled tabs and CTAs |
| 7 | Flexibility | 2 | No keyboard shortcuts; upload alternate path only |
| 8 | Aesthetic / minimal | 3 | Focused card; helper line dense |
| 9 | Error recovery | 3 | Retry analysis when API suggests |
| 10 | Help | 2 | Hints in mono footnotes only |

**Design Health:** **28/40 — Good**  
**Specificity:** **Strong** — serif wordmark, grain, bordered card, mono tabs read as WhyItSlaps, not generic SaaS.  
**Cognitive load:** **2 failures** — four mode tabs at once; Analyze + Download pair needs a beat to parse.

**Unfinished:** Placeholder and footnote text (`text-white/28`–`/35`) read faint on grain; Analyze vs Download hierarchy is subtle when both enabled.

**Polish (ordered):**

1. `/impeccable typeset` — bump helper/placeholder contrast toward paper/50 without loudening the card.
2. `/impeccable clarify` — one line under the URL field: Analyze = breakdown, Download = file only.
3. `/impeccable adapt` — verify stacked Analyze/Download row at ~320px width (no cramped tap targets).
4. `/impeccable harden` — associate inline errors with `aria-describedby` on the URL input.

---

## `/` — Home (Music tab)

**What you do:** Paste Spotify track URL, **Scan upload**, or download preview MP3.

| # | Heuristic | Score | Note |
|---|-----------|-------|------|
| 1 | Status | 3 | Scan uses same loading overlay as analyze |
| 2 | Match | 3 | Spotify-first language |
| 3 | Control | 3 | Tab switch clears URL |
| 4 | Consistency | 3 | Same shell as video |
| 5 | Prevention | 2 | Scan accepts broad file types; failures happen late |
| 6 | Recognition | 3 | Scan upload is visible |
| 7 | Flexibility | 2 | No mic capture (known roadmap) |
| 8 | Minimal | 2 | Footnotes + scan + URL in one card |
| 9 | Recovery | 3 | Errors with hints from API |
| 10 | Help | 2 | Preview length explained in small type |

**Design Health:** **26/40 — Acceptable** (borderline **Good**)  
**Specificity:** **Strong** on shell; scan CTA is still generic “upload” pattern.  
**Cognitive load:** **3 failures** — URL path vs scan path vs download; three parallel actions.

**Unfinished:** Music tab subcopy is long; scan limits differ from video upload limits in separate micro-lines.

**Polish (ordered):**

1. `/impeccable layout` — group “Have a link” vs “Don’t know the track?” with hairline dividers.
2. `/impeccable clarify` — align MB/duration copy between scan footnote and `docs/music-detect-scan.md` user-facing one-liner.
3. `/impeccable typeset` — raise scan secondary button label above `text-[10px]` footnotes only.
4. `/impeccable onboard` — empty-state nudge after failed scan: paste URL if match lacks Spotify id.

---

## `/` — Home (Still tab)

**What you do:** Upload one image (JPEG/PNG/WebP/GIF, 8 MB); no URL paste.

| # | Heuristic | Score | Note |
|---|-----------|-------|------|
| 1 | Status | 3 | Loading phase `still` |
| 2 | Match | 3 | “Upload a picture” is plain |
| 3 | Control | 3 | Single primary action |
| 4 | Consistency | 3 | Same card frame |
| 5 | Prevention | 3 | Accept list + size in footnote |
| 6 | Recognition | 4 | One obvious CTA |
| 7 | Flexibility | 2 | Upload only |
| 8 | Minimal | 4 | Simplest mode |
| 9 | Recovery | 3 | Upload errors inline |
| 10 | Help | 2 | Format list only |

**Design Health:** **30/40 — Good**  
**Specificity:** **Strong** — minimal still funnel fits editorial brand.  
**Cognitive load:** **0–1 failures** — single focus.

**Unfinished:** No thumbnail preview before upload (user commits blind); error block appears only after attempt.

**Polish (ordered):**

1. `/impeccable harden` — optional client-side size/type rejection before POST with same copy as server.
2. `/impeccable animate` — show selected filename under button (no redesign; mono one-liner).
3. `/impeccable typeset` — match still footnote contrast to video tab helpers after global pass.

*Content/voice/EXIF behavior on results intentionally not re-litigated here.*

---

## `/` — Home (History tab)

**What you do:** Browse local analyses; reopen video/music rows; delete or clear all.

| # | Heuristic | Score | Note |
|---|-----------|-------|------|
| 1 | Status | 2 | No “reopened from history” toast |
| 2 | Match | 3 | “Chat log on this device” |
| 3 | Control | 3 | Clear all confirms; per-row del |
| 4 | Consistency | 2 | Still analyses not in history ([CONCEPT.md](../CONCEPT.md) lists video + music only) |
| 5 | Prevention | 3 | Confirm on clear all |
| 6 | Recognition | 3 | Thumbnails / platform chips |
| 7 | Flexibility | 2 | No search/filter |
| 8 | Minimal | 3 | Scroll list in card |
| 9 | Recovery | 3 | Empty state explains next step |
| 10 | Help | 2 | Privacy scope in empty copy |

**Design Health:** **26/40 — Acceptable**  
**Specificity:** **Mixed** — list pattern is familiar; palette chips add character.  
**Cognitive load:** **2 failures** — four tabs + list scroll inside card.

**Unfinished:** Empty-state body text is low contrast; still mode not logged feels like a bug to users who only shoot photos.

**Polish (ordered):**

1. `/impeccable clarify` — empty state: “Video and music only (still coming)” or log still when product-ready — pick copy, not both.
2. `/impeccable typeset` — empty state paragraph to `white/65` minimum.
3. `/impeccable layout` — sticky “clear all” / count row on long lists.
4. `/impeccable harden` — focus trap not needed; ensure row buttons are full-width hit targets on mobile.

---

## `/` — Video results (`ResultsScreen`)

**What you do:** Read breakdown; toggle Brief/Full; copy text; share card; download source; optional edit plan (full mode).

**Rendered:** Yes (sessionStorage fixture + live brief/full toggle).

| # | Heuristic | Score | Note |
|---|-----------|-------|------|
| 1 | Status | 3 | Copy label feedback; download busy states |
| 2 | Match | 4 | Editor/creator vocabulary |
| 3 | Control | 4 | ← new video; brief/full |
| 4 | Consistency | 3 | Nav matches music/still |
| 5 | Prevention | 3 | Brief mode hides heavy panels |
| 6 | Recognition | 3 | Brief defaults well |
| 7 | Flexibility | 3 | Brief vs full + share |
| 8 | Minimal | 2 | Full mode is long (intentional) |
| 9 | Recovery | 3 | Download errors surface at top |
| 10 | Help | n/a | In-flow tool |

**Design Health:** **31/36 → 31/40 — Good** (H10 n/a)  
**Specificity:** **Strong** — score meters, palette, edit deck, mono section rails.  
**Cognitive load:** **3 failures** — full mode sections; nav actions (download, share, copy) cluster top-right.

**Unfinished:** Edit style deck three-up columns tight on narrow viewports; share actions at bottom compete with long scroll; music card on video page still confuses “music mode” vs soundtrack ID.

**Polish (ordered):**

1. `/impeccable adapt` — stack edit deck cells under ~480px.
2. `/impeccable layout` — pin a slim action bar (share / copy) after headline on mobile.
3. `/impeccable clarify` — music card kicker: “Soundtrack match (not Spotify mode)”.
4. `/impeccable typeset` — HYPER badge and 8px labels in deck — minimum readable size in full mode.

---

## `/` — Music results (`MusicResultsScreen`)

**What you do:** Read sonic breakdown; DAW tabs; produce steps; share; open Spotify.

**Rendered:** **Source-only** (fixture-driven structure review; not re-scored for critique voice).

| # | Heuristic | Score | Note |
|---|-----------|-------|------|
| 1 | Status | 3 | DAW tab loading skeleton |
| 2 | Match | 4 | Production vocabulary |
| 3 | Control | 4 | Reset + tab state |
| 4 | Consistency | 2 | Nav link style differs from video (text links vs buttons) |
| 5 | Prevention | 3 | DAW fetch errors with retry |
| 6 | Recognition | 2 | Many sections; brief helps |
| 7 | Flexibility | 4 | DAW switch + brief/full |
| 8 | Minimal | 2 | Full mode is dense |
| 9 | Recovery | 3 | `dawError` panel |
| 10 | Help | n/a | |

**Design Health:** **30/36 — Good**  
**Specificity:** **Strong** — sonic scores, energy arc, Spotify green CTA is intentional third-party accent.  
**Cognitive load:** **4+ failures** in full mode — hero + scores + features + arc + textures + arrangement + DAW.

**Unfinished:** Italic serif quote block differs from video/still headline pattern; `rounded-full` on Spotify status dot is off-brand micro-detail; 8px energy-arc labels.

**Polish (ordered):**

1. `/impeccable typeset` — unify headline treatment with video/still (blockquote serif, non-italic default).
2. `/impeccable layout` — brief mode as default landing (already) — add “expand sections” jump links in full mode.
3. `/impeccable distill` — collapse sonic textures behind brief/full (full only).
4. `/impeccable adapt` — DAW tab row wrap + min tap width on phone.

---

## `/` — Still results (`StillResultsScreen`)

**What you do:** View image + critique, scores, palette, framing/light/color, why-it-works, how-to.

**Rendered:** **Source-only** (upload requires API; layout verified in code + shared components with video).

| # | Heuristic | Score | Note |
|---|-----------|-------|------|
| 1 | Status | 3 | MeterFill entrance (respects reduced motion) |
| 2 | Match | 4 | Medium label + photography copy |
| 3 | Control | 3 | ← new picture |
| 4 | Consistency | 4 | Shares palette, meters, WhyItWorks |
| 5 | Prevention | n/a | Read-only |
| 6 | Recognition | 3 | Image + headline |
| 7 | Flexibility | 2 | No brief/full toggle |
| 8 | Minimal | 3 | No share card yet |
| 9 | Recovery | n/a | |
| 10 | Help | n/a | |

**Design Health:** **29/32 — Good** (H5, H9, H10 n/a)  
**Specificity:** **Strong** — picture-first grid matches CONCEPT motion rule (facts still, meters animate).  
**Cognitive load:** **2 failures** — five scores then three columns then lists.

**Unfinished:** Empty preview placeholder if blob URL missing; no share/copy actions unlike video/music.

**Polish (ordered):**

1. `/impeccable polish` — add share/copy parity with video (reuse ShareCard when ready — product, not voice).
2. `/impeccable layout` — on mobile, image above headline stack already OK — add `alt` from medium + first tag for a11y.
3. `/impeccable typeset` — section labels match video “motion read” tracking for rhythm.

*Exposure EXIF lines and still prompt behavior excluded per scope.*

---

## Loading overlay (`LoadingScreen`)

**What you do:** Wait during analyze, still, music, scan, or download.

**Rendered:** **Source-only** (transient; structure reviewed in code).

| # | Heuristic | Score | Note |
|---|-----------|-------|------|
| 1 | Status | 4 | `aria-busy`, rotating messages, pseudo-progress |
| 2 | Match | 3 | Phase-specific copy |
| 3 | Control | 1 | No cancel |
| 4 | Consistency | 4 | Same overlay all flows |
| 5 | Prevention | n/a | |
| 6 | Recognition | 3 | Message changes every 2s |
| 7 | Flexibility | 1 | Cannot background |
| 8 | Minimal | 3 | Decorative spin rings |
| 9 | Recovery | 2 | User waits for timeout errors |
| 10 | Help | n/a | |

**Design Health:** **25/32 — Good** (H5, H10 n/a)  
**Specificity:** **Mixed** — dashed **rounded** spin rings conflict with sharp-corner brand; otherwise on-palette.  
**Cognitive load:** **1 failure** — percent bar is message-index fake progress, not real job percent.

**Unfinished:** Misleading `%` when work is non-linear; no cancel on long video analyze.

**Polish (ordered):**

1. `/impeccable clarify` — rename percent to “step” or remove number; keep message rotation.
2. `/impeccable layout` — square ring accents instead of `rounded-full` dashed orbit (brand alignment).
3. `/impeccable harden` — optional cancel for download-only phases only (lower risk than mid-analyze).

---

## Home / API inline errors (`InputScreen` + results nav)

**What you do:** Read failure after analyze, download, or scan.

**Rendered:** Partial (error styling seen in flow).

| # | Heuristic | Score | Note |
|---|-----------|-------|------|
| 9 | Error recovery | 3 | Hints + retry on video |
| 2 | Match | 3 | Plain language, network tips |

**Design Health (errors only):** **7/8 — Good** for recovery copy; global boundary separate below.

**Unfinished:** Long server messages wrap hard in narrow card; retry link easy to miss below fold.

**Polish (ordered):**

1. `/impeccable layout` — error block above fold on mobile after failed submit.
2. `/impeccable harden` — `role="alert"` on error container.

---

## Global error boundary (`app/error.tsx`)

**What you do:** Recover from client render crash; try `?fresh=1`.

**Rendered:** **Source-only**

| # | Heuristic | Score | Note |
|---|-----------|-------|------|
| 9 | Error recovery | 3 | Reset + fresh tip |
| 1 | Status | 2 | Digest optional |

**Design Health:** **12/16 — Good** (partial surface)  
**Specificity:** **Strong** — mono, bordered button matches brand.  
**Cognitive load:** **0 failures**

**Unfinished:** No link home; only reset.

**Polish (ordered):**

1. `/impeccable harden` — add “Back to home” link beside Try again.
2. `/impeccable clarify` — explain still vs video cache in one line.

---

## `/draft` — Product draft hub

**What you do:** Choose history (live), explore mock, or music scan (live).

**Rendered:** Yes

| # | Heuristic | Score | Note |
|---|-----------|-------|------|
| 1 | Status | 3 | Banner states mock vs live |
| 2 | Match | 3 | Internal product language |
| 3 | Control | 3 | Clear links out |
| 4 | Consistency | 2 | Amber banner departs from `#0A0A0A` editorial palette |
| 8 | Minimal | 3 | Table is useful, long |
| 7 | Flexibility | n/a | Explainer |
| 10 | Help | n/a | Spec links |

**Design Health:** **24/28 — Good** (H7, H10 n/a)  
**Specificity:** **Mixed** — hub reads internal; amber prototype banner is correct but not on-brand for public accidentally landing here.  
**Cognitive load:** **2 failures** — decision table + three cards.

**Unfinished:** Public discoverability of `/draft` without noindex; banner color system unlike rest of site.

**Polish (ordered):**

1. `/impeccable quieter` — draft banner: paper/black mono strip instead of amber if this URL stays public.
2. `/impeccable document` — robots/noindex or move hub to docs-only route when social ships.
3. `/impeccable layout` — card grid already sharp — tighten table padding on mobile.

---

## `/draft/explore` — Slap library mock

**What you do:** Preview future public feed; toggle mock publish.

**Rendered:** Yes

| # | Heuristic | Score | Note |
|---|-----------|-------|------|
| 1 | Status | 3 | Mock labels honest |
| 2 | Match | 3 | Social product copy |
| 4 | Consistency | 2 | Entry cards align; mock stats noisy |
| 8 | Minimal | 2 | Many mock signifiers |
| 6 | Recognition | 3 | EntryCard pattern clear |

**Design Health:** **22/28 — Acceptable** (H7, H10 n/a)  
**Specificity:** **Mixed** — feed cards fit brand; palette chips on mock entries are fine (flat swatches).  
**Cognitive load:** **3 failures** — publish mock + stats + list.

**Unfinished:** “Publish this analysis” mock CTA width on narrow screens; history link in header goes to redirect target (live history), not mock history page.

**Polish (ordered):**

1. `/impeccable adapt` — shorten mock publish button label on small breakpoints.
2. `/impeccable clarify` — header link copy: “Live history” vs mock explore.
3. `/impeccable layout` — reduce mock aggregate stats row to one line.

---

## `/draft/history` & `/draft/detect` (source-only)

**Reachable:** **No** — Next.js redirects to `/?mode=history` and `/?mode=music`. Files remain for design reference and branch rebases.

**Draft history mock:** Would show mock `EntryCard` grid + modal “would reopen results.” **Grade (source):** **26/32 Good** — on-brand layout; modal uses `shadow-2xl` and fixed overlay (acceptable). **Polish:** keep redirect; delete or gate route when mocks move to Storybook/docs.

**Draft detect prototype:** Live scan UI duplicated before home **Scan upload** shipped. **Grade (source):** **27/32 Good** — simpler than home music tab. **Polish:** do not resurrect route; keep spec in `docs/music-detect-scan.md`.

---

## `/demo/share-graphics`

**What you do:** Preview deprecated story cards and overlay concepts.

**Rendered:** Yes

| # | Heuristic | Score | Note |
|---|-----------|-------|------|
| 4 | Consistency | 1 | Gradient mesh demo background violates CONCEPT |
| 8 | Minimal | 2 | Intentionally busy archive |
| 2 | Match | 3 | README-style disclaimer at top |

**Design Health:** **18/28 — Poor** (H7, H10 n/a) — **expected** for an archived experiment page.  
**Specificity:** **Weak on demo chrome** — concept gradient and checkerboard are anti-patterns per brand doc; card components themselves score **Strong**.

**Unfinished:** Page is reachable in production without strong “internal only” gate.

**Polish (ordered):**

1. `/impeccable distill` — replace concept gradient block with flat `#0A0A0A` + caption (demo only).
2. `/impeccable document` — link from page header to `docs/share-graphics-experimental.md` (already partial).
3. `/impeccable harden` — `noindex` meta on `/demo/*`.

---

## Redirect-only routes

| Route | Behavior | Grade note |
|-------|----------|------------|
| `/analyze` | 308 → `/` | No UI |
| `/welcome` | 308 → `/` | No UI |

---

## Cross-site fixes (highest leverage)

These raise **every** shipped surface without redesign:

1. **`/impeccable typeset` (global)** — Raise mono helper text from `white/28`–`/35` to at least `white/50` on `#0A0A0A` for WCAG-ish body/helper parity; keep grain unchanged.
2. **`/impeccable layout` (results family)** — Align nav actions (video button row vs music text links); one pattern for reset + share + download.
3. **`/impeccable clarify` (modes)** — Disambiguate video soundtrack **MusicCard** vs **Music mode** in one repeated kicker line.
4. **`/impeccable adapt` (dense grids)** — Stack 3-column result decks (video edit style, still framing row, music DAW) under one shared breakpoint.
5. **`/impeccable harden` (a11y)** — Focus styles on tab buttons; `role="alert"` on errors; meaningful `alt` on still preview and history thumbs.
6. **`/impeccable onboard` (history)** — Clarify device-local scope and which modes are logged (video/music today).
7. **`/impeccable document` (draft/demo)** — `noindex` on `/draft/*` and `/demo/*`; keep live tool as only SEO target.

**Performance:** No P0/P1 UI perf issues observed in static review. Long analyzes are server-bound; do not add lazy-loading hero assets until real LCP traces show palette or album art dominating (not seen in this pass).

---

## Suggested Impeccable follow-ups (commands)

| Priority | Command | Target |
|----------|---------|--------|
| P1 | `/impeccable typeset` | Home helpers + history empty state |
| P1 | `/impeccable adapt` | Video edit deck + music DAW tabs |
| P2 | `/impeccable clarify` | Music tab paths; video MusicCard kicker |
| P2 | `/impeccable layout` | Results nav action parity |
| P2 | `/impeccable harden` | Errors, focus, demo/draft noindex |
| P3 | `/impeccable polish` | Loading overlay square rings + step label |
| P3 | `/impeccable quieter` | Draft amber banner |

Re-run [`/impeccable critique`](https://github.com/pbakaus/impeccable/blob/main/.cursor/skills/impeccable/reference/critique.md) on individual routes after fixes to track Design Health trend.

---

*Generated against `origin/main` for documentation PR; not a merge of product UI changes.*
