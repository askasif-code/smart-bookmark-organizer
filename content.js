// Content Script - Enhanced Metadata Extraction
console.log('Content script loaded on:', window.location.href);

// Listen for metadata requests
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getMetadata') {
    const metadata = extractMetadata();
    sendResponse({ metadata: metadata });
  }
  return true;
});

// Extract metadata from current page
function extractMetadata() {
  const url = window.location.href;
  const metadata = {
    url: url,
    title: document.title,
    description: getMetaContent('description'),
    category: detectCategoryFromPage()
  };

  // Platform-specific extraction
  if (url.includes('instagram.com')) {
    metadata.platform = 'Instagram';
    metadata.username = extractInstagramUsername();
    
    if (url.includes('/reel/') || url.includes('/tv/')) {
      metadata.category = 'video';
      metadata.title = extractInstagramTitle() || 'Instagram Reel';
    } else if (url.includes('/p/')) {
      metadata.category = 'image';
      metadata.title = extractInstagramTitle() || 'Instagram Post';
    }
  } 
  else if (url.includes('youtube.com') || url.includes('youtu.be')) {
    metadata.platform = 'YouTube';
    metadata.category = 'video';
    metadata.title = extractYouTubeTitle();
    metadata.channel = extractYouTubeChannel();
    metadata.duration = extractYouTubeDuration();
  }
  else if (url.includes('tiktok.com')) {
    metadata.platform = 'TikTok';
    metadata.category = 'video';
    metadata.title = extractTikTokTitle();
    metadata.username = extractTikTokUsername();
  }
  else if (url.includes('twitter.com') || url.includes('x.com')) {
    metadata.platform = 'Twitter';
    metadata.username = extractTwitterUsername();
  }
  else if (url.includes('spotify.com')) {
    metadata.platform = 'Spotify';
    metadata.category = 'audio';
  }

  return metadata;
}

// Instagram username
function extractInstagramUsername() {
  const usernameEl = document.querySelector('a[href^="/"][href*="/"]');
  if (usernameEl) {
    const href = usernameEl.getAttribute('href');
    const match = href.match(/^\/([^\/]+)\//);
    if (match) return '@' + match[1];
  }
  return null;
}

// Instagram title
function extractInstagramTitle() {
  const titleEl = document.querySelector('h1');
  if (titleEl) return titleEl.textContent.trim();
  
  const metaTitle = document.querySelector('meta[property="og:title"]');
  if (metaTitle) return metaTitle.getAttribute('content');
  
  return null;
}

// YouTube title
function extractYouTubeTitle() {
  const titleEl = document.querySelector('h1.ytd-video-primary-info-renderer, h1.title');
  if (titleEl) return titleEl.textContent.trim();
  
  const metaTitle = document.querySelector('meta[name="title"]');
  if (metaTitle) return metaTitle.getAttribute('content');
  
  return document.title.replace(' - YouTube', '');
}

// YouTube channel
function extractYouTubeChannel() {
  const channelEl = document.querySelector('ytd-channel-name a, .ytd-video-owner-renderer a');
  if (channelEl) return channelEl.textContent.trim();
  return null;
}

// YouTube duration
function extractYouTubeDuration() {
  const durationEl = document.querySelector('.ytp-time-duration');
  if (durationEl) return durationEl.textContent.trim();
  return null;
}

// TikTok title
function extractTikTokTitle() {
  const titleEl = document.querySelector('h1');
  if (titleEl) return titleEl.textContent.trim();
  return 'TikTok Video';
}

// TikTok username
function extractTikTokUsername() {
  const usernameEl = document.querySelector('[data-e2e="browse-username"]');
  if (usernameEl) return usernameEl.textContent.trim();
  return null;
}

// Twitter username
function extractTwitterUsername() {
  const urlParts = window.location.pathname.split('/');
  if (urlParts.length > 1) return '@' + urlParts[1];
  return null;
}

// Get meta content
function getMetaContent(name) {
  const meta = document.querySelector(`meta[name="${name}"], meta[property="og:${name}"]`);
  return meta ? meta.getAttribute('content') : null;
}

// Detect category from page
function detectCategoryFromPage() {
  const url = window.location.href.toLowerCase();
  
  if (url.includes('youtube.com/watch') || url.includes('youtu.be') || 
      url.includes('instagram.com/reel') || url.includes('tiktok.com')) {
    return 'video';
  }
  
  if (url.includes('instagram.com/p/') || url.includes('pinterest.com')) {
    return 'image';
  }
  
  if (url.includes('spotify.com') || url.includes('soundcloud.com')) {
    return 'audio';
  }
  
  return 'text';
}

console.log('Content script ready for metadata extraction');
