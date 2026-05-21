chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id || !tab.url || !/^https?:\/\//.test(tab.url)) {
    return;
  }

  try {
    await sendArmMessage(tab.id);
    await chrome.action.setBadgeText({ tabId: tab.id, text: "+" });
    await chrome.action.setBadgeBackgroundColor({ tabId: tab.id, color: "#2563eb" });

    setTimeout(() => {
      chrome.action.setBadgeText({ tabId: tab.id, text: "" }).catch(() => {});
    }, 1800);
  } catch {
    await chrome.action.setBadgeText({ tabId: tab.id, text: "!" });
    await chrome.action.setBadgeBackgroundColor({ tabId: tab.id, color: "#dc2626" });
  }
});

async function sendArmMessage(tabId) {
  try {
    await chrome.tabs.sendMessage(tabId, { type: "WEB_STICKY_NOTES_ARM" });
  } catch {
    await chrome.scripting.insertCSS({
      target: { tabId },
      files: ["sticky.css"]
    });
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["contentScript.js"]
    });
    await chrome.tabs.sendMessage(tabId, { type: "WEB_STICKY_NOTES_ARM" });
  }
}
