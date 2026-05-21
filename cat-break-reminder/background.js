const DEFAULT_SETTINGS = {
  enabled: true,
  intervalMinutes: 30,
  snoozeMinutes: 10,
  quietHoursEnabled: false,
  quietStart: "18:00",
  quietEnd: "09:00"
};

const PERIODIC_ALARM = "cat-break-periodic";
const SNOOZE_ALARM = "cat-break-snooze";

chrome.runtime.onInstalled.addListener(async () => {
  const settings = await getSettings();
  await saveSettings(settings);
  await schedulePeriodicAlarm(settings);
});

chrome.runtime.onStartup.addListener(async () => {
  await schedulePeriodicAlarm(await getSettings());
});

chrome.storage.onChanged.addListener(async (changes, areaName) => {
  if (areaName !== "sync" || !changes.settings) {
    return;
  }

  await schedulePeriodicAlarm(changes.settings.newValue);
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== PERIODIC_ALARM && alarm.name !== SNOOZE_ALARM) {
    return;
  }

  const settings = await getSettings();
  if (!settings.enabled || isInsideQuietHours(settings)) {
    return;
  }

  await showCatOnTabs();
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "CAT_BREAK_SNOOZE") {
    getSettings()
      .then((settings) => chrome.alarms.create(SNOOZE_ALARM, {
        delayInMinutes: settings.snoozeMinutes
      }))
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));

    return true;
  }

  if (message?.type === "CAT_BREAK_SHOW_NOW") {
    showCatOnTabs()
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));

    return true;
  }

  return false;
});

async function getSettings() {
  const stored = await chrome.storage.sync.get("settings");
  return { ...DEFAULT_SETTINGS, ...stored.settings };
}

async function saveSettings(settings) {
  await chrome.storage.sync.set({ settings });
}

async function schedulePeriodicAlarm(settings) {
  await chrome.alarms.clear(PERIODIC_ALARM);

  if (!settings.enabled) {
    return;
  }

  const interval = Math.max(1, Number(settings.intervalMinutes) || DEFAULT_SETTINGS.intervalMinutes);
  await chrome.alarms.create(PERIODIC_ALARM, {
    delayInMinutes: interval,
    periodInMinutes: interval
  });
}

async function showCatOnTabs() {
  const tabs = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  await Promise.allSettled(
    tabs
      .filter((tab) => tab.id && tab.url && /^https?:\/\//.test(tab.url))
      .map((tab) => sendShowMessage(tab.id, pickMessage()))
  );
}

async function sendShowMessage(tabId, message) {
  try {
    await chrome.tabs.sendMessage(tabId, {
      type: "CAT_BREAK_SHOW",
      payload: { message }
    });
  } catch (_error) {
    await chrome.scripting.insertCSS({
      target: { tabId },
      files: ["cat.css"]
    });
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["contentScript.js"]
    });
    await chrome.tabs.sendMessage(tabId, {
      type: "CAT_BREAK_SHOW",
      payload: { message }
    });
  }
}

function pickMessage() {
  const messages = [
    "喵，起来伸个懒腰吧。",
    "眼睛辛苦啦，看看远处 20 秒。",
    "喝口水，猫猫认真监督你。",
    "肩膀放松一下，别和键盘融为一体。",
    "休息一下也算认真工作的一部分。"
  ];

  return messages[Math.floor(Math.random() * messages.length)];
}

function isInsideQuietHours(settings) {
  if (!settings.quietHoursEnabled) {
    return false;
  }

  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  const start = parseTime(settings.quietStart);
  const end = parseTime(settings.quietEnd);

  if (start === end) {
    return false;
  }

  if (start < end) {
    return current >= start && current < end;
  }

  return current >= start || current < end;
}

function parseTime(value) {
  const [hours, minutes] = String(value).split(":").map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}
