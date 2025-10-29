// Background Service Worker
console.log('Background service worker started');

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Smart Bookmark Organizer installed!');
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received in background:', request);
  
  if (request.action === 'ping') {
    sendResponse({ status: 'pong' });
  }
  
  return true;
});

console.log('Background service worker ready');
