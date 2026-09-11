# Draft: History & social explore

**Status:** UI prototype on branch `ammr/history-social-draft-e83e` — not wired to real data.

**Preview routes:**

| Route | What it shows |
|-------|----------------|
| `/draft` | Hub — pros/cons, phased roadmap, links |
| `/draft/history` | Personal history tab (mock local entries) |
| `/draft/explore` | Opt-in public gallery (mock community feed) |

---

## Problem

Today the tool only remembers the **last video** analysis in `sessionStorage`. Music results are not persisted. There is no way to revisit past work or discover what others are analyzing.

---

## Two ideas (different weight)

### A. Personal history

“My past analyses” — private, on-device or account-backed.

| Approach | Pros | Cons |
|----------|------|------|
| **localStorage list** | No auth, no server cost, ships fast | One browser only; ~5MB limit; lost on clear-site-data |
| **Signed-in + DB** | Cross-device, backup, share-link foundation | Auth, storage, privacy policy, retention rules |

**UI sketch:** tab or `/history` — rows with platform glyph, title/vibe line, tags, palette chips, date. Tap → reopen results (video or music).

### B. Social / shared explore

“What’s everyone analyzing?” — discovery, network effects.

| Approach | Pros | Cons |
|----------|------|------|
| **Opt-in publish** (“Add to library”) | User control; safer legally | Needs persistence + moderation surface |
| **Curated gallery** (admin picks) | No spam; editorial voice | Not truly “everyone”; manual work |
| **Full social** (follows, comments) | Real network | Huge scope: abuse, ToS, moderation, notifications |

**Safety defaults we’d want:**

- Default **private** — analyze ≠ publish.
- Publish is explicit per analysis.
- Store critique JSON + metadata, not source video files.
- Rate limits on analyze either way; publish is a separate, cheap action.

---

## Recommendation (light path)

```text
Phase 1 — local history tab (video + music parity)
Phase 2 — optional accounts + cloud history
Phase 3 — private share URLs (/share/abc)
Phase 4 — opt-in “Slap library” gallery (no follows/comments yet)
```

Skip auto-logging all anonymous traffic into a public feed. That’s the line between “cool discovery” and “creepy / legally messy.”

---

## What this branch includes

- Mock UI only — no localStorage wiring, no API, no auth.
- Design exploration for layout, copy, and information hierarchy.

## What this branch does *not* include

- Database, Neon, user accounts
- Real persistence from `AnalyzeToolPage`
- Public share tokens or moderation tools

---

## Open questions

1. History cap — keep last 20? 50? Summaries only in list, full JSON on demand?
2. Music album art in history rows — worth the bytes in localStorage?
3. Explore — show username or anonymous “someone analyzed…”?
4. Publish flow — checkbox on results screen vs separate “library” step?
