# Draft: History & social explore

**Status:** Phase 1 **shipped on home** — personal History tab uses `localStorage` (video + music). Community explore remains mock-only under `/draft/explore`.

**Live UI:** `/` → **History** tab (chat-log of past analyses on this browser).

**Preview / draft routes (explore still mock):**

| Route | What it shows |
|-------|----------------|
| `/` History tab | Real personal log (localStorage) |
| `/draft` | Hub — pros/cons, phased roadmap |
| `/draft/history` | Older mock layout (superseded by home History tab) |
| `/draft/explore` | Opt-in public gallery (mock community feed) |

---

## Problem

Previously the tool only remembered the **last video** analysis in `sessionStorage`. Music results were not persisted. There was no way to revisit past work.

---

## Two ideas (different weight)

### A. Personal history — Phase 1 done

Private log on this device (no accounts yet).

| Approach | Pros | Cons |
|----------|------|------|
| **localStorage list** ✅ | No auth, no server cost, ships fast | One browser only; ~5MB limit; lost on clear-site-data |
| **Signed-in + DB** | Cross-device, backup, share-link foundation | Auth, storage, privacy policy, retention rules |

**UI:** Video | Music | **History** — rows like a chat log (title, vibe, tags/palette, date). Tap → reopen results without re-analyzing.

**Implementation:** `lib/analysis-history.ts`, `components/HistoryPanel.tsx`, wired from `AnalyzeToolPage` on every successful video/music analyze (incl. upload + scan→analyze).

### B. Social / shared explore — later

Default **private**. Publish must be explicit. Do **not** auto-log everyone’s analyses into a public feed.

---

## Recommendation (light path)

```text
Phase 1 — local history tab (video + music parity) ✅
Phase 2 — optional accounts + cloud history
Phase 3 — private share URLs (/share/abc)
Phase 4 — opt-in “Slap library” gallery (no follows/comments yet)
```

---

## Manual test cases (Phase 1)

| # | Case | Expected |
|---|------|----------|
| H1 | Home shows **History** tab | Third tab next to Video / Music |
| H2 | Empty history | Copy explains private device log |
| H3 | Successful music analyze | Entry appears in History |
| H4 | Successful video analyze / upload | Entry appears in History |
| H5 | Tap history row | Reopens Music or Video results |
| H6 | Delete one / clear all | List updates; localStorage trimmed |
| H7 | Hard refresh | History still present |

Merge to `main` after H1–H7 pass.
