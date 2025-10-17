// Smart Bookmark Organizer - Background Service Worker (Minimal)
console.log('Background service worker started');

// Installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
  
  chrome.storage.local.set({
    bookmarks: [],
    folders: [],
    settings: { autoDetect: true }
  });
});

// Tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    console.log('Tab updated:', changeInfo.url);
  }
});

console.log('Background worker ready');
