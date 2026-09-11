# Music detect — test run log

Branch: `ammr/music-detect-scan-f408` · spec: `docs/music-detect-scan.md`

| Case | Result | Notes |
|------|--------|--------|
| T1 Config missing | **PASS** | `503`, `stage: config` |
| T2 Bad upload | **SKIP (local)** | Route checks ACR config before body validation when env missing |
| T3 Home scan UI | **PASS** | Manual UI — Music tab + Scan upload |
| T4 Happy path scan | **BLOCKED** | Needs `ACRCLOUD_*` + `SPOTIFY_*` + `ANTHROPIC_API_KEY` on test host |
| T5 No match | **BLOCKED** | Needs ACR |
| T6 No Spotify id | **BLOCKED** | Needs ACR |
| T7 Deep link auto-analyze | **PASS** | URL cleaned; analyze attempted (Spotify error without env) |
| T8 Deep link opt-out | **PASS** | `analyze=0` prefills only |
| T9 Draft page | **BLOCKED** | Same as T4 |
| T10 Video regression | **PASS** | Video tab shows Upload clip, not Scan upload |

**Merge gate:** Re-run **T4, T5, T6, T9** on Railway (or `.env.local` with prod keys) then merge PR #14 to `main`.
