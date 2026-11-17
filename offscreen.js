chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.target !== "offscreen" || message.type !== "WRITE_CLIPBOARD") {
    return;
  }

  try {
    const textarea = document.getElementById("clipboard-buffer");

    textarea.value = message.text;

    // Selection occurs in the extension's isolated document,
    // NOT in the actual webpage.
    textarea.focus();
    textarea.select();

    const success = document.execCommand("copy");

    textarea.value = "";

    sendResponse({
      success,
    });
  } catch (error) {
    console.error("[Auto Page Copy]", error);

    sendResponse({
      success: false,
      error: error.message,
    });
  }
});
