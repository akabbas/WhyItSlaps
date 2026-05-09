(() => {
  const BTN_READY = "WhyItSlaps ↗";

  /**
   * This repo is configured for local dev: origin points at http://localhost:3000 (run `npm run dev` here,
   * reload the extension after changes). Set to "" only if you want the extension to use production
   * https://whyitslaps.com instead.
   */
  const WHYITSLAPS_ORIGIN_OVERRIDE = "http://localhost:3000";

  const whyitslapsOrigin = (
    WHYITSLAPS_ORIGIN_OVERRIDE.trim() || "https://whyitslaps.com"
  ).replace(/\/$/, "");
  const analyzeUploadUrl = `${whyitslapsOrigin}/api/analyze-upload`;

  const host = document.createElement("div");
  host.setAttribute("data-whyitslaps-ui", "1");
  host.style.cssText =
    "position:fixed;bottom:16px;right:16px;z-index:9999;display:flex;flex-direction:column;align-items:flex-end;gap:6px;font-family:system-ui,sans-serif;";

  const btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = BTN_READY;
  btn.style.cssText =
    "background:#111;color:#fff;border:none;border-radius:8px;padding:8px 12px;font-size:12px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.35);";

  const errEl = document.createElement("div");
  errEl.style.cssText =
    "display:none;max-width:260px;padding:8px 10px;font-size:11px;line-height:1.35;color:#fecaca;background:#450a0a;border-radius:8px;white-space:pre-wrap;word-break:break-word;";

  host.appendChild(btn);
  host.appendChild(errEl);

  function setError(msg) {
    if (!msg) {
      errEl.style.display = "none";
      errEl.textContent = "";
      return;
    }
    errEl.textContent = msg;
    errEl.style.display = "block";
  }

  function setLoading(on) {
    btn.disabled = on;
    btn.style.opacity = on ? "0.75" : "1";
    btn.textContent = on ? "WhyItSlaps…" : BTN_READY;
    btn.style.cursor = on ? "wait" : "pointer";
  }

  async function run() {
    setError("");
    setLoading(true);

    try {
      const result = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          {
            type: "FETCH_AND_UPLOAD",
            tabId: null,
            analyzeUploadUrl,
          },
          (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
              return;
            }
            resolve(response);
          },
        );
      });

      if (!result || !result.ok) {
        throw new Error(
          result && typeof result.error === "string"
            ? result.error
            : "Upload failed.",
        );
      }

      await chrome.storage.session.set({
        pending_result: JSON.stringify(result.data),
      });
      window.open(`${whyitslapsOrigin}/`, "_blank", "noopener,noreferrer");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  btn.addEventListener("click", () => {
    if (btn.disabled) return;
    void run();
  });

  document.documentElement.appendChild(host);
})();
