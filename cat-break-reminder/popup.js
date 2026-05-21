const enabledInput = document.getElementById("enabled");
const statusEl = document.getElementById("status");

init();

async function init() {
  const settings = await loadSettings();
  enabledInput.checked = settings.enabled;

  enabledInput.addEventListener("change", async () => {
    await saveSettings({ ...settings, enabled: enabledInput.checked });
    setStatus(enabledInput.checked ? "提醒已开启。" : "提醒已暂停。");
  });

  document.getElementById("showNow").addEventListener("click", async () => {
    const response = await chrome.runtime.sendMessage({ type: "CAT_BREAK_SHOW_NOW" });
    setStatus(response?.ok ? "猫猫已出动。" : "当前页面可能不支持显示猫猫。");
  });

  document.getElementById("openOptions").addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });
}

async function loadSettings() {
  const { settings } = await chrome.storage.sync.get("settings");
  return {
    enabled: true,
    intervalMinutes: 30,
    snoozeMinutes: 10,
    quietHoursEnabled: false,
    quietStart: "18:00",
    quietEnd: "09:00",
    ...settings
  };
}

async function saveSettings(settings) {
  await chrome.storage.sync.set({ settings });
}

function setStatus(message) {
  statusEl.textContent = message;
}
