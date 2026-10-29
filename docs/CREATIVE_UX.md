# WhyItSlaps — creative UX tracker

Living product answers plus **numbered, independently spawnable** agent tickets. Brand stays [`CONCEPT.md`](../CONCEPT.md) / [`DESIGN.md`](../DESIGN.md). Route walls live in [`DEAD_ENDS.md`](./DEAD_ENDS.md). UI grades live in [`ui-impeccable-grade.md`](./ui-impeccable-grade.md). History / share-URL phases live in [`draft-history-social.md`](./draft-history-social.md).

**Baseline:** `origin/main` @ `86edbbc` (Sprint 4 polish **#23–#28** merged). Update this file when a ticket ships.

**Out of scope here:** Voice STT (**PR #17** — skip). Full-song download (music save is a ~30s Spotify or iTunes **preview** only).

**Ranked engine / loading / share work order:** [`WORK_ORDER.md`](./WORK_ORDER.md).

---

## How later agents should use this

Pick **one ticket id** (T1–T13). Do not bundle unrelated tickets. Ponytail: small diffs; no gradient meshes, glass, or rounded-card redesign. Copy-paste prompt at the bottom of each ticket.

| Status | Meaning |
|--------|---------|
| **Open** | Spawn when ready |
| **Shipped** | Done on a branch/PR; leave the row for history |
| **Deferred** | Needs product/backend that does not exist yet |

---

## 1. Numbering / sonic scores

### Decision

Keep the 0–100 numbers. They are **character meters for this piece**, not a leaderboard, not “this song is better than that song,” and not a competition unless product later asks for votes.

Taste stays in the critique prose. Rank-shaped UI (giant **overall vibe** on the share card, unlabeled history chip) is what makes a meter look like a scoreboard — fix labels and hierarchy, not the math.

Do **not** add user-vote / head-to-head scoring.

### Current truth

| Surface | What the number is |
|---------|-------------------|
| **Video** meters | Model-assigned 0–100 on five axes (`color_harmony`, `edit_pacing`, `motion_feel`, `subject_framing`, `overall_vibe`) from vision JSON (`lib/claude.ts`). |
| **Music** sonic scores | DSP on **this track’s preview clip** (`lib/score-track-audio.ts` → `lib/sonic-scores.ts`). `overall_vibe` is a **weighted blend** of the other five (hook 0.3, density 0.2, range 0.15, impact 0.15, mix 0.2). Unreadable audio → `scores: null`, copy `SONIC_SCORE_MISSING`. Separate from Spotify audio-feature bars (energy, danceability, …). |
| **Still** meters | Model-assigned 0–100 (`composition`, `light`, `color_harmony`, `subject`, `overall_vibe`). |
| **Share cards** | Live cards (**T2**, this branch) hide the giant overall-vibe hero. Quote, tags, and secondary meters fill the card. Filename for video export still uses the number (`video-${overall_vibe}`). |
| **History** | Each row shows `entry.score` = `overall_vibe` as a bare paper numeral ([`HistoryPanel.tsx`](../components/HistoryPanel.tsx)) — reads as a ranking chip. |
| **Copy text** | `lib/share.ts` lists “Scores: … /100” including overall vibe. |

Open PR **#32** (`ammr/music-coherence-copy-7f1b`) clarifies preview-download labels and sonic-vs-Spotify provenance on music results. Do not fight that copy; extend the meter framing after it merges.

### Tickets

#### T1 — Meter copy: character, not rank

- **Status:** Open
- **Files:** [`components/ScoreBars.tsx`](../components/ScoreBars.tsx), [`components/MusicResultsScreen.tsx`](../components/MusicResultsScreen.tsx) (sonic scores kicker), [`components/StillResultsScreen.tsx`](../components/StillResultsScreen.tsx), optionally [`lib/sonic-scores.ts`](../lib/sonic-scores.ts) labels, [`lib/share.ts`](../lib/share.ts)
- **Do:** One mono kicker above the meters (“this clip’s meters” / “this track’s meters” / “this picture’s meters”). Keep axis names. Do not rename `overall_vibe` in JSON. Optional: “OVERALL VIBE” → “OVERALL VIBE · this piece” on the last row only.
- **Don’t:** Change DSP or model score math. Add `/100` noise on every row unless contrast requires it. Touch share-card layout (that’s T2/T7).
- **Prompt:**

```text
Implement docs/CREATIVE_UX.md ticket T1 only. Follow CONCEPT.md / DESIGN.md. Ponytail: small copy/typeset diff. Add a one-line meter kicker on video, music, and still results so 0–100 reads as character meters for this piece, not a ranking. Do not change scoring code, share cards, or history chips.
```

#### T2 — Share card: de-emphasize or hide overall vibe

- **Status:** **Shipped** on `ammr/ux-share-cards-wave-7f1b`
- **Files:** [`components/share-cards/MusicShareCard.tsx`](../components/share-cards/MusicShareCard.tsx), [`components/share-cards/VideoShareCard.tsx`](../components/share-cards/VideoShareCard.tsx)
- **Do:** Default **hide** the giant overall-vibe hero **or** shrink it to the same size as HOOK/PACING cells, with kicker “this piece · not a ranking”. Prefer hide if the quote + tags + secondary meters still fill the card. Do not edit `share-graphics/` (archived).
- **Don’t:** Full template redesign. Add a user toggle unless copy alone can’t land.
- **Prompt:**

```text
Implement docs/CREATIVE_UX.md ticket T2 only. On live share-cards (not share-graphics), stop treating overall vibe as a leaderboard hero. Hide it or match secondary meter size, with character-meter framing. Keep CONCEPT: #0A0A0A, paper, serif wordmark, mono uppercase, sharp corners. No new gradients.
```

#### T3 — History chip is not a rank

- **Status:** Open
- **Files:** [`components/HistoryPanel.tsx`](../components/HistoryPanel.tsx)
- **Do:** Drop the bare `overall_vibe` numeral **or** label it (`vibe 74` / hide). Keep title, subtitle, palette, timestamp.
- **Don’t:** Change `lib/analysis-history.ts` schema unless you must. Don’t add sort-by-score.
- **Prompt:**

```text
Implement docs/CREATIVE_UX.md ticket T3 only. History rows must not look like a leaderboard. Remove or label the overall-vibe chip. CONCEPT/DESIGN. Ponytail. No schema migration unless required.
```

---

## 2. Share card UI

### Decision

No full redesign. Live path stays **inline studio**: nav/button → [`ShareCardPanel`](../components/ShareCardPanel.tsx) → [`components/share-cards/`](../components/share-cards/). The parked “Post this breakdown” **section** at the bottom of results is experimental only ([`share-graphics-experimental.md`](./share-graphics-experimental.md), `/demo/share-graphics`). Still results have **no** share card yet (grade doc + T13).

### Current truth (UI check vs CONCEPT)

Checked: `ShareCardPanel`, `share-cards/MusicShareCard.tsx`, `share-cards/VideoShareCard.tsx`, music/video results share entry, vs CONCEPT (near-black, paper, DM Serif + IBM Plex Mono, grain, sharp corners; **no** gradient meshes, glass, rounded cards).

**What already fits:** `#0A0A0A` field, paper type, serif wordmark + vibe quote, mono uppercase kickers, hairline borders, square tag chips, story 9:16 / square 1:1, download PNG + Web Share.

**Concrete polish (not a new system):**

1. **Copy / voice** — **T4** shipped: panel headline is “Card for Stories” / “Export a still”; helper type ≥ `text-white/50`; footer is format size, not “Drop it over your clip…”.
2. **Hierarchy** — **T2** shipped: giant overall vibe hidden on live cards. Quote, tags, and secondary meters remain. Remaining hierarchy (quote as middle, meters as footer strip) is **T7**.
3. **Typeset** — Wordmark 34px / 0.38em tracking is on-brand. Live-card helper type bumped to paper/50+ with T2/T6. Remaining quote-over-meters typeset is **T7**.
4. **Composition (panel)** — **T5** shipped: scaled story/square preview is centered and clipped to the card bounds; preview well is sharp-cornered. Export stays 1080×1920 / 1080×1080 on the off-screen node.
5. **Composition (card)** — **T6** shipped: live cards are flat `#0A0A0A` + paper hairline (no radial meshes, no Spotify green). Music BPM/KEY/HOOK grid columns match the number of cells.
6. **Inconsistent entry** — Video: uppercase **SHARE CARD** (mobile under headline, desktop after long scroll). Music: lowercase **share card** in the top nav with download/copy/new. Still: nothing. Grade already wanted one results-nav pattern (#28 helped; share label still splits).
7. **Tags** — Video share prefixes `#`; music share does not. Results screens also disagree.
8. **Two codepaths** — `share-cards/` (live) vs `share-graphics/cards/` (demo). Do not polish the demo except `noindex` / flat chrome already in the grade doc.

### Tickets

#### T4 — Share panel copy + typeset

- **Status:** **Shipped** on `ammr/ux-share-cards-wave-7f1b`
- **Files:** [`components/ShareCardPanel.tsx`](../components/ShareCardPanel.tsx)
- **Do:** Replace “Post your breakdown”. Keep mono uppercase chrome. Raise helper contrast to ≥ `text-white/50`. Optional CTA pair: primary “download png”, secondary “share image” (already close).
- **Don’t:** Restyle the modal as glass. Don’t revive `ShareGraphicsSection` on results.
- **Prompt:**

```text
Implement docs/CREATIVE_UX.md ticket T4 only. ShareCardPanel copy/typeset: editorial headline instead of “Post your breakdown”; helper contrast ≥ white/50; CONCEPT sharp corners on the preview well if you touch the well class. No card-template redesign.
```

#### T5 — Share preview composition

- **Status:** **Shipped** on `ammr/ux-share-cards-wave-7f1b`
- **Files:** [`components/ShareCardPanel.tsx`](../components/ShareCardPanel.tsx)
- **Do:** Center the scaled story/square preview; drop `rounded-sm`; reduce empty black. Keep export at 1080×1920 / 1080×1080 via the off-screen node (don’t scale the export node).
- **Prompt:**

```text
Implement docs/CREATIVE_UX.md ticket T5 only. Fix ShareCardPanel preview composition (center/crop scaled card, square corners). Do not change PNG export dimensions or html-to-image options unless broken.
```

#### T6 — Flatten share-card fills

- **Status:** **Shipped** on `ammr/ux-share-cards-wave-7f1b`
- **Files:** [`components/share-cards/MusicShareCard.tsx`](../components/share-cards/MusicShareCard.tsx), [`components/share-cards/VideoShareCard.tsx`](../components/share-cards/VideoShareCard.tsx)
- **Do:** Remove radial-gradient overlays (including Spotify green wash). Flat `#0A0A0A` + paper hairline. If the 3-col music stats row has one cell, don’t leave a hole (span or stack).
- **Don’t:** Add grain SVG into the PNG unless it still exports cleanly; grain is a page overlay today.
- **Prompt:**

```text
Implement docs/CREATIVE_UX.md ticket T6 only. Flatten live share-card backgrounds to CONCEPT (no radial meshes, no Spotify green wash). Fix music BPM/KEY/HOOK grid when features are missing. Do not redesign typography hierarchy (T7) unless required for the hole.
```

#### T7 — Share card hierarchy (quote over number)

- **Status:** Open
- **Depends:** Prefer after T2 (hide/shrink vibe) and T6 (flat fill).
- **Files:** both live `share-cards/*`
- **Do:** Quote + tags (+ palette on video, album row on music) as the middle; meters as a footer strip; wordmark stays top. Align tag `#` treatment with results. Bump faint kickers.
- **Don’t:** New templates, overlay stickers, or merging `share-graphics/`.
- **Prompt:**

```text
Implement docs/CREATIVE_UX.md ticket T7 only. Live share-cards: make vibe quote and tags the middle of the card; meters as a footer strip; CONCEPT type. Assume overall-vibe hero is already gone or small (T2). No new card formats.
```

#### T8 — Share CTA label parity

- **Status:** Open
- **Files:** [`components/ResultsScreen.tsx`](../components/ResultsScreen.tsx), [`components/MusicResultsScreen.tsx`](../components/MusicResultsScreen.tsx)
- **Do:** One label casing (“share card” **or** “SHARE CARD”) and one placement pattern consistent with #28 nav parity. Don’t move music share out of the nav if that regresses the clustered actions — match video’s mobile under-headline row **or** music’s nav, not both dialects.
- **Prompt:**

```text
Implement docs/CREATIVE_UX.md ticket T8 only. One share-card CTA pattern on video and music results. CONCEPT/DESIGN. No still-share (T13). No panel/card visual redesign.
```

---

## 3. After scan — back to homepage

### Decision

Scan is not a new route. After a successful scan the user is on **music results** on `/`. They need a clear control back to the WhyItSlaps **input card** (home), matching video/still “new …” reset.

### Current truth

Trace in [`AnalyzeToolPage.tsx`](../components/AnalyzeToolPage.tsx):

1. Music tab **Scan upload** → `runMusicScan` → `POST /api/identify-audio`.
2. If ACR returns `spotify_url` → `runMusicAnalyze` → `setMusicResult`.
3. UI swaps to [`MusicResultsScreen`](../components/MusicResultsScreen.tsx). **`window.location` stays `/`** (query `?mode=` / `?url=` are consumed and stripped on load; scan never writes a URL).
4. `handleReset` clears video/music/still state + video `sessionStorage` and shows [`InputScreen`](../components/InputScreen.tsx) again. **Mode stays music** after a scan (correct: home Music tab, not a forced Video tab).

| Mode | Reset control (already shipped) |
|------|----------------------------------|
| Video | `← new video` |
| Music (paste **or** scan) | `← new track` |
| Still | `← new picture` |

Wordmark was a dead `<span>` — not a home control. **This PR** makes **WHYITSLAPS** a button (`ResultsWordmark`, `aria-label="Back to WhyItSlaps home"`) on all three results screens, same `onReset` as “new …”.

If scan **fails** or has no Spotify id, the user never leaves the home Music tab (error inline). No extra home button needed there.

### Tickets

#### T9 — Results wordmark home

- **Status:** **Shipped** on this branch (`components/ResultsWordmark.tsx` + video/music/still nav)
- **Follow-up (optional, only if users still miss it):** add a literal `home` text control next to “new track”. Do not add a second reset that forces Video tab.

#### T10 — Do not invent scan-specific routes

- **Status:** Deferred as a “don’t”
- **Do:** Keep scan → music results on `/`. Deep link `/?mode=music&url=` may auto-analyze then strip. No `/scan` page, no `/draft/detect` resurrection.

---

## 4. Unique URLs vs library

### Decision

**Do not** give every live analysis a new public URL. Others **cannot** see your current result. “Every noise at once” is a **feed / library** job, not query-string chaos.

Keep **`/`** for the live session. Revisit past work via **History** (this browser) now; optional later **`/s/:id`** (or `/share/abc` as in the draft spec) **only after** a persistence backend. Do not mint share URLs that 404 or that only work in one tab.

### Current truth

| Mechanism | Who sees it | Survives refresh? |
|-----------|-------------|-------------------|
| Live UI on `/` (React state) | This tab only | **Video:** yes, `sessionStorage` key `whyitslaps:last-result`. **Music / still:** no — refresh returns home. |
| `?mode=` `?url=` `?analyze=` | Consumed then **stripped** | Not a shareable analysis URL. |
| History tab | This **browser** (`localStorage` `whyitslaps:analysis-history:v1`, max 40). Video + music only. Still not logged. | Yes on this device. Open row rehydrates results in-memory. |
| Cloud / `/s/:id` / `/share/abc` | **None.** Phase 2–3 in [`draft-history-social.md`](./draft-history-social.md). | — |
| `/draft/explore` | Mock community feed | Not real data |

So: send a friend `whyitslaps.com` and they get the **empty home card**, not your breakdown. Video refresh in the **same tab** can restore the last video. Music scan results vanish on refresh unless History saved them (scan→analyze does call music history push when analyze succeeds).

### Tickets

#### T11 — Treat History as the personal library (UX, not URLs)

- **Status:** Open
- **Files:** [`components/HistoryPanel.tsx`](../components/HistoryPanel.tsx), [`components/InputScreen.tsx`](../components/InputScreen.tsx) (history tab copy)
- **Do:** Copy that History is “your analyses on this device” (already close). After T3, rows should feel like a library, not scores. Optional: after reset from results, don’t force the History tab.
- **Don’t:** Query-string ids. Don’t log still until product says yes (DEAD_ENDS gap 3).
- **Prompt:**

```text
Implement docs/CREATIVE_UX.md ticket T11 only. History tab copy/layout so it reads as a personal library of analyses, not a ranked feed. No new routes. Still stays unlogged unless a separate product ticket says otherwise.
```

#### T12 — Private share URLs (backend gate)

- **Status:** Deferred
- **When:** Accounts + stored analyses exist (draft spec Phase 2–3).
- **Do then:** Opaque `/s/:id` or `/share/:id`, explicit publish, default private. One agent for spec+API+rehydrate; not a fake client-only router.
- **Don’t:** Encode the full analysis in the query string. Don’t ship URLs before storage.

#### T13 — Still share/copy parity

- **Status:** Open (also grade-doc still results polish item 1)
- **Files:** [`components/StillResultsScreen.tsx`](../components/StillResultsScreen.tsx); reuse `ShareCardPanel` + a still card **only if** T2/T6 rules apply (no vibe leaderboard hero).
- **Don’t:** Invent `/still/:id`.
- **Prompt:**

```text
Implement docs/CREATIVE_UX.md ticket T13 only. Still results share/copy parity with video/music using ShareCardPanel. CONCEPT. No overall-vibe leaderboard hero (see T2). No history logging unless explicitly in scope.
```

---

## Ticket index

| Id | Theme | Status | Spawnable now? |
|----|--------|--------|----------------|
| T1 | Meter copy | Open | Yes |
| T2 | Share: hide/shrink overall vibe | **Shipped** | No |
| T3 | History chip | Open | Yes |
| T4 | Share panel copy | **Shipped** | No |
| T5 | Share preview composition | **Shipped** | No |
| T6 | Flatten share-card fills | **Shipped** | No |
| T7 | Share hierarchy | Open | After T2 (and T6 if touching fills) |
| T8 | Share CTA parity | Open | Yes |
| T9 | Wordmark home | **Shipped** | No |
| T10 | No scan routes | Deferred (guardrail) | No |
| T11 | History as library | Open | Yes (after or with T3) |
| T12 | `/s/:id` share URLs | Deferred | No — needs backend |
| T13 | Still share | Open | Yes (respect T2) |

**Suggested first wave (parallel, one ticket per agent):** T1, T3, T8 (T2/T4/T5/T6 shipped on `ammr/ux-share-cards-wave-7f1b`). Then T7. T13 when still share is wanted. T11 anytime. Never T12 without storage. Never merge **#17**.

---

*Source: cloud agent creative-UX pass (Oct 2026). User themes: numbering, share-card look, after-scan home, unique URLs, living backlog.*
