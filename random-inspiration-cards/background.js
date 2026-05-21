importScripts("words.js");

const SETTINGS_KEY = "wordSparkSettings";
const DEFAULT_SETTINGS = {
  enabled: true,
  intervalMinutes: 10
};
const ALARM_NAME = "wordSparkReminder";

chrome.runtime.onInstalled.addListener(async () => {
  const settings = await getSettings();
  await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
  await scheduleReminder(settings);
});

chrome.runtime.onStartup.addListener(async () => {
  await scheduleReminder(await getSettings());
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALARM_NAME) return;

  const settings = await getSettings();
  if (!settings.enabled) return;

  await showWordsOnActiveTab();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message).then(sendResponse);
  return true;
});

async function handleMessage(message) {
  if (message?.type === "WORD_SPARK_GET_SETTINGS") {
    return { settings: await getSettings() };
  }

  if (message?.type === "WORD_SPARK_SAVE_SETTINGS") {
    const settings = normalizeSettings(message.settings);
    await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
    await scheduleReminder(settings);
    return { settings };
  }

  if (message?.type === "WORD_SPARK_SHOW_NOW") {
    await showWordsOnActiveTab();
    return { ok: true };
  }

  return { ok: false };
}

async function getSettings() {
  const stored = await chrome.storage.local.get(SETTINGS_KEY);
  return normalizeSettings(stored[SETTINGS_KEY] || DEFAULT_SETTINGS);
}

function normalizeSettings(value) {
  const interval = Number(value?.intervalMinutes);

  return {
    enabled: value?.enabled !== false,
    intervalMinutes: Number.isFinite(interval) ? clamp(Math.round(interval), 1, 180) : DEFAULT_SETTINGS.intervalMinutes
  };
}

async function scheduleReminder(settings) {
  await chrome.alarms.clear(ALARM_NAME);

  if (!settings.enabled) {
    return;
  }

  chrome.alarms.create(ALARM_NAME, {
    delayInMinutes: settings.intervalMinutes,
    periodInMinutes: settings.intervalMinutes
  });
}

async function showWordsOnActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab?.id || !tab.url || !/^https?:\/\//.test(tab.url)) {
    return;
  }

  const words = pickWords(5);

  try {
    await sendWords(tab.id, words);
  } catch {
    await chrome.scripting.insertCSS({
      target: { tabId: tab.id },
      files: ["word-card.css"]
    });
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["contentScript.js"]
    });
    await sendWords(tab.id, words);
  }
}

function sendWords(tabId, words) {
  return chrome.tabs.sendMessage(tabId, {
    type: "WORD_SPARK_SHOW_CARD",
    words
  });
}

function pickWords(count) {
  return WORD_SPARK_WORDS
    .map((word) => ({ word, sort: crypto.getRandomValues(new Uint32Array(1))[0] }))
    .sort((a, b) => a.sort - b.sort)
    .slice(0, count)
    .map((item) => item.word);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
