// Smart Bookmark Organizer - Content Script
console.log('Content script loaded on:', window.location.href);

// Extract page metadata
function extractMetadata() {
  const metadata = {
    title: document.title,
    url: window.location.href,
    description: getMetaContent('description') || getMetaContent('og:description'),
    image: getMetaContent('og:image') || getMetaContent('twitter:image'),
    author: getMetaContent('author') || getMetaContent('article:author'),
    publishDate: getMetaContent('article:published_time'),
    siteName: getMetaContent('og:site_name'),
    keywords: getMetaContent('keywords')
  };
  
  // Get YouTube specific data
  if (window.location.hostname.includes('youtube.com')) {
    metadata.duration = getYouTubeDuration();
    metadata.views = getYouTubeViews();
    metadata.channel = getYouTubeChannel();
  }
  
  // Get Instagram specific data
  if (window.location.hostname.includes('instagram.com')) {
    metadata.instagramType = getInstagramType();
    metadata.likes = getInstagramLikes();
  }
  
  return metadata;
}

// Get meta tag content
function getMetaContent(name) {
  const meta = document.querySelector(
    `meta[name="${name}"], meta[property="${name}"]`
  );
  return meta ? meta.getAttribute('content') : null;
}

// Get YouTube video duration
function getYouTubeDuration() {
  try {
    const durationElement = document.querySelector('.ytp-time-duration');
    return durationElement ? durationElement.textContent : null;
  } catch (error) {
    return null;
  }
}

// Get YouTube views
function getYouTubeViews() {
  try {
    const viewsElement = document.querySelector('span.view-count, span.short-view-count');
    return viewsElement ? viewsElement.textContent : null;
  } catch (error) {
    return null;
  }
}

// Get YouTube channel name
function getYouTubeChannel() {
  try {
    const channelElement = document.querySelector('ytd-channel-name a, #channel-name a');
    return channelElement ? channelElement.textContent.trim() : null;
  } catch (error) {
    return null;
  }
}

// Detect Instagram content type
function getInstagramType() {
  const url = window.location.pathname;
  if (url.includes('/reel/')) return 'reel';
  if (url.includes('/tv/')) return 'igtv';
  if (url.includes('/p/')) return 'post';
  if (url.includes('/stories/')) return 'story';
  return 'unknown';
}

// Get Instagram likes (approximate)
function getInstagramLikes() {
  try {
    const likesElement = document.querySelector('section button span');
    return likesElement ? likesElement.textContent : null;
  } catch (error) {
    return null;
  }
}

// Listen for messages from popup or background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received message:', request);
  
  if (request.action === 'getMetadata') {
    const metadata = extractMetadata();
    sendResponse({ metadata: metadata });
  }
  
  if (request.action === 'getPageInfo') {
    sendResponse({
      title: document.title,
      url: window.location.href,
      metadata: extractMetadata()
    });
  }
  
  return true; // Keep channel open for async response
});

// Optional: Auto-detect when page loads
window.addEventListener('load', () => {
  console.log('Page loaded, metadata extracted');
  const metadata = extractMetadata();
  console.log('Metadata:', metadata);
});

console.log('Content script initialized');
