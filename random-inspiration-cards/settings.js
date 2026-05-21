const enabledInput = document.querySelector("#enabled");
const intervalInput = document.querySelector("#intervalMinutes");
const saveButton = document.querySelector("#saveButton");
const showNowButton = document.querySelector("#showNowButton");
const statusEl = document.querySelector("#status");

init();

async function init() {
  const { settings } = await chrome.runtime.sendMessage({ type: "WORD_SPARK_GET_SETTINGS" });
  enabledInput.checked = settings.enabled;
  intervalInput.value = settings.intervalMinutes;

  saveButton.addEventListener("click", saveSettings);
  showNowButton.addEventListener("click", showNow);
}

async function saveSettings() {
  const interval = Number(intervalInput.value);
  const settings = {
    enabled: enabledInput.checked,
    intervalMinutes: Number.isFinite(interval) ? interval : 10
  };

  const response = await chrome.runtime.sendMessage({
    type: "WORD_SPARK_SAVE_SETTINGS",
    settings
  });

  intervalInput.value = response.settings.intervalMinutes;
  setStatus(response.settings.enabled ? `Saved. Next card every ${response.settings.intervalMinutes} minutes.` : "Saved. Reminders are paused.");
}

async function showNow() {
  await chrome.runtime.sendMessage({ type: "WORD_SPARK_SHOW_NOW" });
  setStatus("Card sent to the active tab.");
}

function setStatus(text) {
  statusEl.textContent = text;
  setTimeout(() => {
    if (statusEl.textContent === text) {
      statusEl.textContent = "";
    }
  }, 2200);
}
