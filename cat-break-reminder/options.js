const DEFAULT_SETTINGS = {
  enabled: true,
  intervalMinutes: 30,
  snoozeMinutes: 10,
  quietHoursEnabled: false,
  quietStart: "18:00",
  quietEnd: "09:00"
};

const form = document.getElementById("settingsForm");
const statusEl = document.getElementById("status");
const fields = {
  enabled: document.getElementById("enabled"),
  intervalMinutes: document.getElementById("intervalMinutes"),
  snoozeMinutes: document.getElementById("snoozeMinutes"),
  quietHoursEnabled: document.getElementById("quietHoursEnabled"),
  quietStart: document.getElementById("quietStart"),
  quietEnd: document.getElementById("quietEnd")
};

init();

async function init() {
  const settings = await loadSettings();
  render(settings);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const nextSettings = {
      enabled: fields.enabled.checked,
      intervalMinutes: clampNumber(fields.intervalMinutes.value, 1, 240, DEFAULT_SETTINGS.intervalMinutes),
      snoozeMinutes: clampNumber(fields.snoozeMinutes.value, 1, 120, DEFAULT_SETTINGS.snoozeMinutes),
      quietHoursEnabled: fields.quietHoursEnabled.checked,
      quietStart: fields.quietStart.value || DEFAULT_SETTINGS.quietStart,
      quietEnd: fields.quietEnd.value || DEFAULT_SETTINGS.quietEnd
    };

    await chrome.storage.sync.set({ settings: nextSettings });
    render(nextSettings);
    setStatus("设置已保存，下一轮提醒会按新节奏执行。");
  });
}

async function loadSettings() {
  const { settings } = await chrome.storage.sync.get("settings");
  return { ...DEFAULT_SETTINGS, ...settings };
}

function render(settings) {
  fields.enabled.checked = settings.enabled;
  fields.intervalMinutes.value = settings.intervalMinutes;
  fields.snoozeMinutes.value = settings.snoozeMinutes;
  fields.quietHoursEnabled.checked = settings.quietHoursEnabled;
  fields.quietStart.value = settings.quietStart;
  fields.quietEnd.value = settings.quietEnd;
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.round(number)));
}

function setStatus(message) {
  statusEl.textContent = message;
}
