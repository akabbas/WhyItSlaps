# Code cleanup backlog (WhyItSlaps)

**Branch:** `ammr/code-cleanup-review-f408`  
**Source:** Full-repo audit (2026-09-22) + [Alibaba Open Code Review](https://github.com/alibaba/open-code-review) setup notes.

Open Code Review’s Mac folder (`~/Downloads/open-code-review-main`) is **not** on the cloud agent VM. Use either:

1. This backlog (already produced), or  
2. Install OCR CLI and scan with your Anthropic/OpenAI key:

```bash
curl -fsSL https://open-codereview.ai/install.sh | sh
ocr config set llm.provider anthropic   # or openai-compatible
ocr config set llm.api_key "$ANTHROPIC_API_KEY"
ocr config set llm.model claude-sonnet-4-6
cd /path/to/WhyItSlaps
ocr scan --path app --path lib --path components
# or review a PR range:
ocr review --from main --to HEAD
```

---

## Status on this branch

Done:

- yt-dlp host allowlist (YouTube, TikTok, Instagram, X).
- In-memory rate limit (8/min/IP) on analyze, upload, download, download-music, identify-audio, analyze-music, daw-steps, and editplan.
- Upload size and type checks on identify-audio and analyze-upload.
- Client `hint`s drop yt-dlp, ffmpeg, paths, and API key text.
- `/draft/history` → `/?mode=history`, `/draft/detect` → `/?mode=music`. Share graphics stay on `/demo/share-graphics`.
- Client fetch timeouts and separate video vs music download loader copy.
- `@distube/ytdl-core` removed. History nested-button a11y. `getAnalysisHistoryEntry` removed.
- Album art on the live music and video cards uses `next/image`. `.env.example` lists `ANTHROPIC_EDITPLAN_MODEL`.

Still before merge: smoke a YouTube URL analyze and a music scan on a server with API keys. This PR stays draft until those pass.

## Priority

### P0 — Security

1. **yt-dlp URL allowlist** — only YT / IG / TikTok / X hosts in `lib/download.ts` + analyze/download routes (SSRF / open proxy risk).
2. **Rate-limit or gate expensive APIs** — analyze, upload, download, identify-audio, editplan, daw-steps (no auth today).
3. **Upload early rejects** — Content-Length + MIME on `identify-audio` / `analyze-upload`; align 50 vs 100 MB docs.
4. **Sanitize client `hint`s** — don’t leak raw yt-dlp / API stderr.

### P1 — Dead code & reliability

5. **Retire or redirect** `/draft/history` (mock) → live home History; thin `/draft/detect` → home Music scan.
6. **Quarantine or delete** `share-graphics` experiment (prod already has `share-cards`).
7. **Client fetch timeouts** + clearer abort copy; split download loader messages (video vs music).
8. **Remove unused** `@distube/ytdl-core`.

### P2 — Docs & polish

9. Sync **CONCEPT.md** / **techstack/README.md** / **music-detect-scan.md** with shipped History + Scan.
10. HistoryPanel nested button a11y; unused `getAnalysisHistoryEntry`; lint `<img>` warnings; `.env.example` completeness.

---

## Suggested PR series on this branch

| Commit group | Scope |
|--------------|--------|
| A | Docs sync + remove unused dep + small a11y |
| B | Host allowlist + upload MIME/Content-Length |
| C | Draft redirects + share-graphics quarantine |
| D | Client timeouts + rate limit middleware |

Do **not** merge until B is smoke-tested on video URL analyze + music scan.
