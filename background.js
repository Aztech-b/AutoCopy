let creatingOffscreenDocument = null;

async function ensureOffscreenDocument() {
  const offscreenUrl = chrome.runtime.getURL("offscreen.html");

  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
    documentUrls: [offscreenUrl],
  });

  if (existingContexts.length > 0) {
    return;
  }

  if (creatingOffscreenDocument) {
    await creatingOffscreenDocument;
    return;
  }

  creatingOffscreenDocument = chrome.offscreen.createDocument({
    url: "offscreen.html",
    reasons: ["CLIPBOARD"],
    justification: "Write extracted webpage text to the system clipboard.",
  });

  try {
    await creatingOffscreenDocument;
  } finally {
    creatingOffscreenDocument = null;
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Ignore messages intended for the offscreen document.
  if (message.target === "offscreen") {
    return;
  }

  if (message.type !== "COPY_PAGE_TEXT") {
    return;
  }

  (async () => {
    await ensureOffscreenDocument();

    const response = await chrome.runtime.sendMessage({
      target: "offscreen",
      type: "WRITE_CLIPBOARD",
      text: message.text,
    });

    sendResponse(response);
  })().catch(error => {
    console.error("[Auto Page Copy]", error);

    sendResponse({
      success: false,
      error: error.message,
    });
  });

  return true;
});
