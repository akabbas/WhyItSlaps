const STORAGE_KEY_PREFIX = "video_";
const DEFAULT_ANALYZE_UPLOAD_URL = "http://localhost:3000/api/analyze-upload";

/** Instagram/CDN often rejects extension fetches without a page referer (network error → "Failed to fetch"). */
const INSTAGRAM_PAGE_HEADERS = {
  Referer: "https://www.instagram.com/",
  "User-Agent":
    typeof navigator !== "undefined" && navigator.userAgent
      ? navigator.userAgent
      : "Mozilla/5.0 (compatible; WhyItSlaps/1.0)",
};

function resolveAnalyzeUploadUrl(message) {
  const raw = message?.analyzeUploadUrl;
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
  }
  return DEFAULT_ANALYZE_UPLOAD_URL;
}

function looksLikeVideoRequest(url) {
  return (
    url.includes(".mp4") ||
    url.includes("video_dashinit") ||
    url.includes("bytestart=0")
  );
}

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (details.tabId == null || details.tabId < 0) return;
    if (!looksLikeVideoRequest(details.url)) return;
    chrome.storage.session.set({
      [`${STORAGE_KEY_PREFIX}${details.tabId}`]: details.url,
    });
  },
  { urls: ["*://*.cdninstagram.com/*"] },
);

function resolveTabId(message, sender) {
  return message.tabId != null ? message.tabId : sender.tab?.id ?? null;
}

function videoStorageKey(tabId) {
  return `${STORAGE_KEY_PREFIX}${tabId}`;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "GET_VIDEO_URL") {
    const tabId = resolveTabId(message, sender);
    const key =
      tabId != null && tabId >= 0 ? videoStorageKey(tabId) : null;

    if (!key) {
      sendResponse({ url: null });
      return;
    }

    chrome.storage.session.get(key).then((records) => {
      sendResponse({ url: records[key] ?? null });
    });
    return true;
  }

  if (message?.type === "FETCH_AND_UPLOAD") {
    const tabId = resolveTabId(message, sender);
    if (tabId == null || tabId < 0) {
      sendResponse({ ok: false, error: "No tab context." });
      return;
    }

    const key = videoStorageKey(tabId);
    chrome.storage.session.get(key).then(async (records) => {
      const videoUrl = records[key] ?? null;
      if (!videoUrl) {
        sendResponse({
          ok: false,
          error:
            "No video URL captured yet. Scroll past the reel or wait a moment, then try again.",
        });
        return;
      }

      const uploadUrl = resolveAnalyzeUploadUrl(message);

      try {
        let videoRes;
        try {
          videoRes = await fetch(videoUrl, { headers: INSTAGRAM_PAGE_HEADERS });
        } catch (err) {
          const hint = err instanceof Error ? err.message : String(err);
          sendResponse({
            ok: false,
            error: `Video download failed (${hint}). If this keeps happening, reload the reel so a fresh URL is captured.`,
          });
          return;
        }

        if (!videoRes.ok) {
          sendResponse({
            ok: false,
            error: `Could not download video (${videoRes.status}).`,
          });
          return;
        }

        const blob = await videoRes.blob();
        const form = new FormData();
        form.append("video", blob, "source.mp4");

        let analyzeRes;
        try {
          analyzeRes = await fetch(uploadUrl, {
            method: "POST",
            body: form,
          });
        } catch (err) {
          const hint = err instanceof Error ? err.message : String(err);
          sendResponse({
            ok: false,
            error: `Upload to WhyItSlaps failed (${hint}). If you are developing locally, run \`npm run dev\` in this repo (port 3000) and reload the extension; otherwise set WHYITSLAPS_ORIGIN_OVERRIDE in extension/content.js or check your network.`,
          });
          return;
        }

        const text = await analyzeRes.text();
        let data;
        try {
          data = text ? JSON.parse(text) : null;
        } catch {
          sendResponse({
            ok: false,
            error: "Unexpected response from WhyItSlaps.",
          });
          return;
        }

        if (!analyzeRes.ok) {
          const msg =
            data && typeof data.error === "string"
              ? data.error
              : `Upload failed (${analyzeRes.status}).`;
          sendResponse({ ok: false, error: msg });
          return;
        }

        sendResponse({ ok: true, data });
      } catch (err) {
        sendResponse({
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    });
    return true;
  }
});
