# WhyItSlaps — MIR mapping

How music **meters** relate to Spotify catalog signals and to Music Information Retrieval (MIR) vocabulary. Product answers live in [`WORK_ORDER.md`](./WORK_ORDER.md) and [`CREATIVE_UX.md`](./CREATIVE_UX.md). This file is the coordinate system so later agents do not retune DSP, scrape the web, or vendor AGPL code by accident.

**Meters are character of this piece, not a rank.** Same rule as CREATIVE_UX: 0–100 is not “better song,” and Spotify **energy × valence** is a **mood-plane coordinate**, not a leaderboard.

---

## Three layers (do not collapse them)

| Layer | Source | What the UI is | Time span |
|-------|--------|----------------|-----------|
| **Sonic meters** | `lib/sonic-scores.ts` → `hook_strength`, `production_density`, `emotional_range`, `impact`, `mix_clarity`, `overall_vibe` | 0–100 character meters | **On `main` today:** ~30s preview PCM. **After [PR #41](https://github.com/akabbas/WhyItSlaps/pull/41):** catalog-first; preview is mix / fallback only |
| **Spotify dashboards** | `GET /v1/audio-features/{id}` (`lib/spotify.ts`) | 0–1 bars: energy, danceability, valence, acousticness | Full **catalog** recording |
| **Form / energy arc** | `GET /v1/audio-analysis/{id}` sections (`lib/spotify-analysis.ts`) | Claude `energy_arc` + arrangement facts | Full catalog recording (fail-open if 403/empty) |

Claude does **not** listen to audio. It writes from title + features + meter facts + compact section rows. Do not treat the essay as a third measurement.

---

## Energy × valence are coordinates, not ranks

Spotify’s own audio-feature dashboards (and every energy/valence scatter built on them) plot a track as a **point**:

- **X — valence** (0–1): musical positivity / affect. Sad or tense sitting left; bright or cheerful sitting right.
- **Y — energy** (0–1): perceptual intensity / arousal. A Bach prelude sits low; death metal sits high. Spotify’s definition is loudness, timbre, onset rate, and entropy — not “how good.”

That plane is Russell’s valence–arousal circumplex, not a ranking. A track at `(valence 0.2, energy 0.9)` is **located** (dark, intense). It did not “win” energy. Our FeatureBars are the same two axes shown as separate sliders; if a later UI draws a quadrant, it must stay a **map**, not a scoreboard.

Danceability and acousticness are further catalog coordinates (rhythm regularity; acoustic vs produced). They sit next to energy/valence on results. They are **not** sonic meters and must not be averaged into `overall_vibe`.

Docs: [Get Track's Audio Features](https://developer.spotify.com/documentation/web-api/reference/get-audio-features), [Get Track's Audio Analysis](https://developer.spotify.com/documentation/web-api/reference/get-audio-analysis).

---

## 30s preview policy

Spotify/iTunes **preview** is a ~30s MP3 the label allowed. We never rip the full master (WORK_ORDER out of scope). Save/download still uses that clip.

| When | What the preview is for |
|------|-------------------------|
| **`main` now** (through **#36** audio-analysis) | **All six** sonic meters from `scoreFromPcm` on the clip. Catalog features are the separate dashboard. Analysis sections ground the essay / energy arc only. |
| **After [PR #41](https://github.com/akabbas/WhyItSlaps/pull/41)** (`scoreFromCatalogSignals` + `blendSonicScores`) | **Mix clarity** when we decoded a clip. **Fallback for every meter** only if audio-features **and** usable analysis sections are missing. Hook / density / range / impact come from the catalog. |

Clip DSP can oversell or undersell a hook when the preview is a verse (or the opposite). That is why #41 moves shape meters off the clip. Do not put preview autocorrelation back in the default path after that lands.

---

## Meter map

`overall_vibe` is always the weighted blend (hook 0.3, density 0.2, range 0.15, impact 0.15, mix 0.2). It is **not** a MIR descriptor.

**Essentia** names below are **analogs** — research vocabulary from [MTG/essentia](https://github.com/mtg/essentia) (see license). We do not run those algorithms in-app today.

| WhyItSlaps meter | Spotify audio-features | Audio-analysis sections | Preview DSP (`scoreFromPcm`) | Closest Essentia-style descriptors |
|------------------|------------------------|-------------------------|------------------------------|------------------------------------|
| **Hook strength** | Fallback after #41: `danceability` when fewer than 2 sections | After #41: chorus-like **loudness lift** (peak section − median section) / 12 dB | Autocorrelation of the RMS envelope, lags ~0.25–4 s | `rhythm.danceability`, `rhythm.onset_rate`, `rhythm.beats_loudness` contrast |
| **Production density** | After #41: `0.55 × (1 − acousticness) + 0.45 × energy` | — | Band occupancy (low/mid/high within 14 dB) + integrated loudness “presence” | `lowlevel.spectral_complexity`, `lowlevel.spectral_energyband_*`, inverse `barkbands_flatness_db` |
| **Emotional range** | Fallback after #41: `\|valence − 0.5\| × 2` (distance from neutral, **not** “happier = higher”) | After #41: (max − min section loudness) / 18 dB | Clip loudness P95 − P10, / 20 LU | `lowlevel.dynamic_complexity`, `loudness_ebu128` range |
| **Impact** | After #41: **`energy`** (0–1 → 0–100) | — | How far the loudest 10% of windows sit above the clip’s typical RMS (/ 12 dB) | `lowlevel.spectral_energy`, `lowlevel.average_loudness`, `rhythm.onset_rate` |
| **Mix clarity** | After #41 catalog fallback: integrated `loudness` as headroom heuristic `(-loudness − 5) / 14` | Track-level `loudness` if features missing | **Preferred after #41:** crest factor near ~12 dB + low/mid/high balance | `loudness_ebu128`, `lowlevel.average_loudness` (dynamic range), `spectral_energyband_*` balance |
| **Overall vibe** | — (do not map) | — | Blend of the five | None. Do not treat as mood, genre, or popularity. |

**Spotify dashboards (not meters):** `energy`, `danceability`, `valence`, `acousticness`, plus unused-in-UI `instrumentalness`, `speechiness`, `loudness`, `tempo`, `key`, `time_signature`. Tempo/key already show as facts on the music card.

**Energy arc** is not a meter. Claude labels 4–6 sections (`low` / `mid` / `high` / `peak`) from the compact analysis rows (start, duration, loudness, tempo; max 12 sections). After #41 those same section loudnesses also feed hook and range. If analysis 403s, do not invent a section map.

---

## Essentia: cite, do not vendor

- Source: [https://github.com/mtg/essentia](https://github.com/mtg/essentia) (Music Technology Group, UPF). Extractor notes: [Music extractor](https://essentia.upf.edu/streaming_extractor_music.html).
- License: **AGPL-3.0**. **Do not copy Essentia into this repo**, do not git-submodule it into the Next.js app, do not paste algorithm source into `lib/`. WhyItSlaps stays its own application code plus Spotify’s API contract.
- Allowed: this mapping; linking the repo; describing descriptor names as we do above.
- If product later wants real Essentia (danceability DFA, HPCP key, EBU R128): run it as a **separate AGPL service** with its own compliance story, never as a vendored `node_modules` tree. Not v1.

Our clip DSP (biquads, RMS windows, autocorrelation) is a small original heuristic. It is **inspired by** the same MIR ideas, not an Essentia port.

---

## Do not scrape Last.fm / Genius as v1

A citation engine that searches Last.fm, Genius, Reddit, interviews, then quotes them is a **behemoth** (crawlers, licenses, stale pages, prompt injection). WORK_ORDER already deferred it.

**Do not** as v1:

- Scrape Last.fm tags, scrobbles, or similar-artist graphs
- Scrape Genius (or any lyrics host) for lyrics or annotations
- Live-search the public web to “ground” the critique

Claude may already know famous songs from training — that is **not** a source, and we do not pretend it is. Later, if we want “people”: licensed lyrics API, quotes the user pastes, or a curated editorial note.

Already legal and in use: Spotify track metadata, audio-features, audio-analysis (fail-open), preview/iTunes for DSP + Save. Still unused on purpose: popularity, related artists, unofficial lyric crawlers.

---

## Agent guardrails

- **Copy vs math:** meter *labels* are CREATIVE_UX T1. Catalog-first *math* is PR #41. Do not mix them in one PR, and do not retune `OVERALL_WEIGHTS` without a fixture set.
- **Do not** merge voice STT **#17**. Do not download the full Spotify file.
- **Do not** collapse energy/valence FeatureBars into sonic meters, or sort History by `overall_vibe`.
- When #41 merges, update the “on `main` today” row in this file’s preview table — not before.

*Source: MIR mapping pass (Oct 2026). Companion to WORK_ORDER engine tickets and CREATIVE_UX meter-as-character.*
