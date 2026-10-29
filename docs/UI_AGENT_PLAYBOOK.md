# UI agent playbook

How Cloud Agents and local Cursor runs should improve WhyItSlaps UI **without redesigning the brand**. Baseline scores live in [`ui-impeccable-grade.md`](./ui-impeccable-grade.md). Brand rules live in [`CONCEPT.md`](../CONCEPT.md).

## Tool stack (repo)

| Tool | Purpose |
|------|---------|
| [Impeccable](https://github.com/pbakaus/impeccable) | Design critique, `/impeccable polish`, `typeset`, `adapt`, detector on UI files |
| [Ponytail](https://github.com/DietrichGebert/ponytail) | Minimal diffs; never cut validation, security, or **accessibility** |
| `PRODUCT.md` / `DESIGN.md` | Impeccable context (derived from CONCEPT) |

After clone, install the Impeccable engine (not committed — ~21MB binary):

```bash
npm run agent:setup
```

Ponytail skills ship under `.cursor/skills/ponytail*` and `.agents/skills/ponytail*`.

## Sprint order

Work in this order so each PR is reviewable and scores move on the grade doc:

| Sprint | Target (from grade doc) | Impeccable focus |
|--------|-------------------------|------------------|
| **1** | Home (Video tab) polish items 1–4 | `typeset`, `clarify`, `adapt`, `harden` |
| **2** | Home (Music tab) items 1–4 | `layout`, `clarify`, `typeset`, `onboard` |
| **3** | Video `ResultsScreen` items 1–4 | `adapt`, `layout`, `clarify`, `typeset` |
| **4** | Cross-site fixes (grade doc bottom) | `typeset`, `layout`, `clarify`, `harden`, `onboard`, `document` |
| **5** | Music results, still results, loading | Per-page lists in grade doc |

Re-run `/impeccable critique` on touched routes when done; optionally append scores to `.impeccable/critique/` (tracked when present).

## Copy-paste agent prompt (one sprint)

Replace `[page]` and the item numbers with the section from `docs/ui-impeccable-grade.md`.

```text
Implement polish items 1–3 from docs/ui-impeccable-grade.md for [page]. Follow CONCEPT.md and DESIGN.md (near-black ground, paper type, serif wordmark, mono uppercase UI, grain, sharp corners — no gradient meshes, glass panels, or rounded cards).

Use the Impeccable commands named in those items (e.g. typeset, layout, clarify, adapt, harden). Apply ponytail: minimal diff, reuse existing components, no new dependencies, don’t cut a11y.

Do not change still critique voice, EXIF exposure facts, or lib/dialogue.ts. Do not merge voice-transcription draft work.

After changes: run npm run lint if available, verify on npm run dev, commit on branch ammr/ui-polish-<short-name>-7f1b, open PR to main with before/after notes.
```

### Example: Sprint 1 (Home — Video tab)

```text
Implement polish items 1–4 from docs/ui-impeccable-grade.md for `/` — Home (Video tab). Follow CONCEPT.md and DESIGN.md. Use Impeccable commands named there. Apply ponytail: minimal diff, don’t cut a11y. No redesign beyond contrast, copy, and mobile Analyze/Download layout.
```

## Commands reference

**Impeccable** (in agent chat after `npm run agent:setup`):

- `/impeccable critique the home page`
- `/impeccable polish components/InputScreen.tsx`
- `/impeccable typeset` / `layout` / `adapt` / `clarify` / `harden` — name a target

**Detector** (terminal):

```bash
npx impeccable detect components/ app/
npx impeccable detect http://127.0.0.1:3000/
```

**Ponytail** (skill or message):

- `@ponytail` or message: `/ponytail full`
- `@ponytail-review` before opening a UI polish PR

## Out of scope for UI agents

- Voice-transcription draft branch
- Re-litigating still prompt, EXIF, or `lib/dialogue.ts` voice
- `/demo/share-graphics` except `noindex` + flat demo chrome (grade doc)
- Full social/draft product — mocks stay mocks
- Inventing public share URLs or a query-string per analysis (see [`CREATIVE_UX.md`](./CREATIVE_UX.md) T10/T12)

Product tickets for meters, share-card polish, and History-as-library: [`CREATIVE_UX.md`](./CREATIVE_UX.md). One ticket id per agent.
