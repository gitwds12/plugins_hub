var CAT_BREAK_ROOT_ID = "cat-break-reminder-root";

if (!globalThis.__catBreakReminderListenerAttached) {
  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === "CAT_BREAK_SHOW") {
      showCatBreak(message.payload?.message);
    }
  });

  globalThis.__catBreakReminderListenerAttached = true;
}

function showCatBreak(message = "喵，休息一下吧。") {
  const existing = document.getElementById(CAT_BREAK_ROOT_ID);
  if (existing) {
    existing.remove();
  }

  const root = document.createElement("section");
  root.id = CAT_BREAK_ROOT_ID;
  root.setAttribute("aria-live", "polite");
  root.innerHTML = `
    <div class="cat-break-card" role="dialog" aria-label="休息提醒">
      <button class="cat-break-close" type="button" aria-label="关闭提醒">×</button>
      <div class="cat-break-cat" aria-hidden="true">
        <div class="cat-break-ear cat-break-ear-left"></div>
        <div class="cat-break-ear cat-break-ear-right"></div>
        <div class="cat-break-face">
          <div class="cat-break-eye cat-break-eye-left"></div>
          <div class="cat-break-eye cat-break-eye-right"></div>
          <div class="cat-break-nose"></div>
          <div class="cat-break-mouth"></div>
          <div class="cat-break-whiskers cat-break-whiskers-left"></div>
          <div class="cat-break-whiskers cat-break-whiskers-right"></div>
        </div>
        <div class="cat-break-paw cat-break-paw-left"></div>
        <div class="cat-break-paw cat-break-paw-right"></div>
      </div>
      <div class="cat-break-copy">
        <p class="cat-break-kicker">Cat break</p>
        <p class="cat-break-message">${escapeHtml(message)}</p>
      </div>
      <div class="cat-break-actions">
        <button class="cat-break-button cat-break-primary" type="button" data-action="done">我休息啦</button>
        <button class="cat-break-button cat-break-secondary" type="button" data-action="snooze">稍后提醒</button>
      </div>
    </div>
  `;

  document.documentElement.append(root);

  root.querySelector(".cat-break-close").addEventListener("click", () => dismiss(root));
  root.querySelector('[data-action="done"]').addEventListener("click", () => dismiss(root, true));
  root.querySelector('[data-action="snooze"]').addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "CAT_BREAK_SNOOZE" });
    dismiss(root);
  });

  window.setTimeout(() => {
    if (document.contains(root)) {
      root.classList.add("cat-break-is-waiting");
    }
  }, 8000);
}

function dismiss(root, celebrated = false) {
  if (celebrated) {
    root.classList.add("cat-break-celebrate");
  }

  root.classList.add("cat-break-dismiss");
  window.setTimeout(() => root.remove(), celebrated ? 700 : 250);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
