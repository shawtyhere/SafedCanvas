// Prompt Shield — Background Service Worker

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    enabled: true,
    blockCount: 0,
    warnCount: 0
  });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'UPDATE_COUNTS') {
    // Persist updated counts
    chrome.storage.sync.set({
      blockCount: msg.blockCount,
      warnCount: msg.warnCount
    });
  }
});
