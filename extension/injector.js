(function () {
  if (typeof chrome === "undefined" || !chrome.storage?.session) return;

  chrome.storage.session.get("pending_result").then((records) => {
    const raw = records?.pending_result;
    if (typeof raw !== "string" || !raw.trim()) return;
    try {
      sessionStorage.setItem("whyitslaps_result", raw);
    } catch {
      return;
    }
    chrome.storage.session.remove("pending_result");
  });
})();
