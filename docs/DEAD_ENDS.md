# WhyItSlaps — dead-ends audit

Living inventory of routes, features, and docs where users or devs hit walls, mocks, or misleading paths. **UI polish is real but not the top gap** — see ranked list below and [`ui-impeccable-grade.md`](./ui-impeccable-grade.md).

**Baseline:** `origin/main` @ `507a637` (Oct 2026). Update this doc when merging persistence, ingest, or draft-route changes.

**Live:** [whyitslaps.com](https://whyitslaps.com)

---

## Top product gaps (ranked)

| Rank | Gap | Why it’s a wall |
|------|-----|-----------------|
| 1 | **Video ingest in production** | Instagram URL paste needs `yt-dlp --cookies-from-browser` ([`BOTTLENECKS.md`](../BOTTLENECKS.md)); Railway has no logged-in browser. Upload is the documented workaround ([`DEPLOY.md`](../DEPLOY.md)). |
| 2 | **Session persistence mismatch** | **Video** rehydrates from `sessionStorage` (`whyitslaps:last-result`). **Music** and **still** are React-only — refresh returns home. See [`CONCEPT.md`](../CONCEPT.md) share/export notes. |
| 3 | **History + scan holes** | History logs **video + music only** ([`lib/analysis-history.ts`](../lib/analysis-history.ts)). Still not logged. Scan without ACR `spotify_id` → paste URL ([`AnalyzeToolPage.tsx`](../components/AnalyzeToolPage.tsx)); Spotify search fallback not built ([`music-detect-scan.md`](./music-detect-scan.md)). |
| 4 | **Still results parity** | No share/copy/history on [`StillResultsScreen.tsx`](../components/StillResultsScreen.tsx) — analyze-only. |
| 5 | **Draft / demo look like product** | [`/draft/explore`](./draft-history-social.md) mock library; [`/demo/share-graphics`](./share-graphics-experimental.md) archived experiment. **`noindex`** lands with open PR **#26** (not on `main` until merged). |

Lower severity: mono contrast, nav pattern mismatch, mobile grids — open polish **#26–#28**.

---

## Routes

Redirects ([`next.config.mjs`](../next.config.mjs)):

| Source | → | Notes |
|--------|---|--------|
| `/welcome` | `/` | permanent |
| `/draft/history` | `/?mode=history` | live History tab |
| `/draft/detect` | `/?mode=music` | scan lives on home Music tab |

Also: [`app/analyze/page.tsx`](../app/analyze/page.tsx) redirects `/analyze` → `/` (not in `next.config`).

| Route | On `main` | Experience |
|-------|-----------|------------|
| `/` | Yes | Four modes; results replace home; only video cached in session |
| `/draft` | Yes | Hub; mix of live links + mock explore |
| `/draft/explore` | Yes | **Mock** feed only ([`lib/draft/mock-feed.ts`](../lib/draft/mock-feed.ts)) |
| `/draft/history`, `/draft/detect` | **Redirect** | Source pages exist for design/rebases only — **never rendered in prod** |
| `/demo/share-graphics` | Yes | Fixture demo; not live share path |

---

## Feature dead ends

| Feature | Status |
|---------|--------|
| Share-graphics stack | Removed from live results; demo + [`share-graphics-experimental.md`](./share-graphics-experimental.md) |
| Slap library / social | Mock on `/draft/explore`; spec [`draft-history-social.md`](./draft-history-social.md) |
| Voice STT | **PR #17** draft — do not merge; not on `main` |
| Music scan Spotify fallback | Roadmap Phase 4 |
| Mic capture | Roadmap |
| Chrome extension | In [`extension/`](../extension/); README says website-only launch — stance inconsistent with CONCEPT built list |
| Cloud history / share URLs | Phase 2+ in draft spec |

**Edit my footage:** shipped; empty default row, long `/api/editplan` timeout — see [`EditMyFootagePanel.tsx`](../components/EditMyFootagePanel.tsx).

---

## Docs / code mismatches

- Grade doc / techstack cite `/analyze` in `next.config` — only `/welcome` is there; `/analyze` is App Router redirect.
- README footnote still mentions `/draft/detect`; canonical path is `/?mode=music`.
- [`draft-history-social.md`](./draft-history-social.md) “third tab” — home has **four** modes + History.
- README GitHub About blurb omits **STILL**.
- [`CODE_CLEANUP_BACKLOG.md`](./CODE_CLEANUP_BACKLOG.md) partially stale post–PR #18.
- `/draft/explore` link to `/draft/history` sends users to **live** history, not mock.

---

## Open PRs (Sprint 4 + experiments)

| PR | Role | Merge status (last check) |
|----|------|---------------------------|
| [#26](https://github.com/akabbas/WhyItSlaps/pull/26) | a11y, history copy, draft/demo **noindex** | MERGEABLE |
| [#27](https://github.com/akabbas/WhyItSlaps/pull/27) | Helper contrast | MERGEABLE |
| [#28](https://github.com/akabbas/WhyItSlaps/pull/28) | Music nav + 480px grids | MERGEABLE (rebased on main) |
| [#17](https://github.com/akabbas/WhyItSlaps/pull/17) | Voice STT experiment | Skip unless product decision |

Merged UI on `main`: **#21–#25** (grade, tooling, home, video results, history/loading).

---

## Recommended fix order (audit → action)

1. **Production truth matrix** — DEPLOY + BOTTLENECKS + home copy: what works on whyitslaps.com (IG, scan, timeouts).
2. **Persistence contract** — refresh/history behavior for all three modes; still in history?
3. **Music scan** — no-`spotify_id` path; retire `/draft/detect` from docs.
4. **Still parity** — share/copy; nav consistency (#28).
5. **Fence non-product routes** — merge #26; gate or delete redirect-only draft pages + demo.
6. **Docs sweep** — redirects, About blurb, extension stance.
7. **Merge #26 → #27 → #28** and redeploy.
8. **Close or rebase #17** until voice product is real.

---

## Agent playbook

UI-only work: [`UI_AGENT_PLAYBOOK.md`](./UI_AGENT_PLAYBOOK.md). Do not treat mock draft routes as shipped product when grading or polishing.

Creative UX (numbers as meters, share-card polish, after-scan home, unique URLs) and spawnable tickets: [`CREATIVE_UX.md`](./CREATIVE_UX.md).

*Source: cloud agent dead-ends inventory (Oct 2026).*
