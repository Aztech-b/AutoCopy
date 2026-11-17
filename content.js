(() => {
  "use strict";

  let observer = null;
  let debounceTimer = null;

  let lastCopiedText = "";
  let isCopying = false;

  const DEBOUNCE_DELAY = 800;

  function extractPageText() {
    if (!document.body) {
      return "";
    }

    // innerText extracts rendered text rather than HTML markup.
    // It does not select anything or dispatch copy events.
    return document.body.innerText
      .replace(/\u00a0/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  async function copyPageText() {
    if (isCopying) {
      return;
    }

    const text = extractPageText();

    if (!text || text === lastCopiedText) {
      return;
    }

    isCopying = true;

    try {
      const response = await chrome.runtime.sendMessage({
        type: "COPY_PAGE_TEXT",
        text,
      });

      if (response?.success) {
        lastCopiedText = text;
      } else {
        console.warn("[Auto Page Copy] Clipboard write failed.");
      }
    } catch (error) {
      console.error("[Auto Page Copy]", error);
    } finally {
      isCopying = false;
    }
  }

  function scheduleCopy() {
    clearTimeout(debounceTimer);

    debounceTimer = setTimeout(() => {
      copyPageText();
    }, DEBOUNCE_DELAY);
  }

  function startObserver() {
    if (!document.body) {
      return;
    }

    observer = new MutationObserver(() => {
      scheduleCopy();
    });

    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["class", "style", "hidden", "aria-hidden"],
    });

    // Copy initial page content.
    scheduleCopy();
  }

  if (document.body) {
    startObserver();
  } else {
    document.addEventListener("DOMContentLoaded", startObserver, {
      once: true,
    });
  }
})();
