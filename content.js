// Smart Bookmark Organizer - Content Script (ENHANCED METADATA EXTRACTION)
console.log('Content script loaded on:', window.location.href);

// Extract page metadata
function extractMetadata() {
  const metadata = {
    title: document.title,
    url: window.location.href,
    description: getMetaContent('description') || getMetaContent('og:description'),
    image: getMetaContent('og:image') || getMetaContent('twitter:image'),
    author: getMetaContent('author'),
    siteName: getMetaContent('og:site_name')
  };
  
  // Enhanced Instagram detection
  if (window.location.hostname.includes('instagram.com')) {
    const instaData = extractInstagramData();
    if (instaData) {
      Object.assign(metadata, instaData);
    }
  }
  
  // Enhanced YouTube detection
  if (window.location.hostname.includes('youtube.com')) {
    const ytData = extractYouTubeData();
    if (ytData) {
      Object.assign(metadata, ytData);
    }
  }
  
  // TikTok detection
  if (window.location.hostname.includes('tiktok.com')) {
    const ttData = extractTikTokData();
    if (ttData) {
      Object.assign(metadata, ttData);
    }
  }
  
  console.log('Metadata extracted:', metadata);
  return metadata;
}

// Get meta tag content
function getMetaContent(name) {
  const meta = document.querySelector(
    `meta[name="${name}"], meta[property="${name}"]`
  );
  return meta ? meta.getAttribute('content') : null;
}

// Extract Instagram specific data
function extractInstagramData() {
  try {
    const data = {};
    
    // Get title from og:title meta tag
    const ogTitle = getMetaContent('og:title');
    if (ogTitle) {
      data.title = ogTitle;
    }
    
    // Get description
    const ogDescription = getMetaContent('og:description');
    if (ogDescription) {
      data.description = ogDescription;
    }
    
    // Detect content type
    const pathname = window.location.pathname;
    if (pathname.includes('/reel/')) {
      data.instagramType = 'Reel';
      data.category = 'video';
    } else if (pathname.includes('/p/')) {
      data.instagramType = 'Post';
      data.category = 'image';
    } else if (pathname.includes('/tv/')) {
      data.instagramType = 'IGTV';
      data.category = 'video';
    }
    
    // Try to get username from URL
    const urlParts = pathname.split('/').filter(p => p);
    if (urlParts.length > 0 && !['p', 'reel', 'tv'].includes(urlParts[0])) {
      data.username = '@' + urlParts[0];
    }
    
    // Get thumbnail
    const ogImage = getMetaContent('og:image');
    if (ogImage) {
      data.thumbnail = ogImage;
    }
    
    console.log('Instagram data extracted:', data);
    return data;
    
  } catch (error) {
    console.error('Error extracting Instagram data:', error);
    return null;
  }
}

// Extract YouTube specific data
function extractYouTubeData() {
  try {
    const data = {};
    
    // Get video title from multiple possible selectors
    let ytTitle = document.querySelector('h1.ytd-video-primary-info-renderer');
    if (!ytTitle) {
      ytTitle = document.querySelector('h1 yt-formatted-string');
    }
    if (!ytTitle) {
      ytTitle = document.querySelector('h1.title');
    }
    
    if (ytTitle) {
      data.title = ytTitle.textContent.trim();
    }
    
    // Get channel name
    const channelName = document.querySelector('#channel-name a, ytd-channel-name a, #owner-name a');
    if (channelName) {
      data.channel = channelName.textContent.trim();
    }
    
    // Get video duration
    const duration = document.querySelector('.ytp-time-duration');
    if (duration) {
      data.duration = duration.textContent;
    }
    
    // Get view count
    const viewCount = document.querySelector('span.view-count, .view-count-renderer');
    if (viewCount) {
      data.views = viewCount.textContent.trim();
    }
    
    data.category = 'video';
    
    console.log('YouTube data extracted:', data);
    return data;
    
  } catch (error) {
    console.error('Error extracting YouTube data:', error);
    return null;
  }
}

// Extract TikTok data
function extractTikTokData() {
  try {
    const data = {};
    
    // Get title from meta tags
    const ttTitle = getMetaContent('og:title') || getMetaContent('twitter:title');
    if (ttTitle) {
      data.title = ttTitle;
    }
    
    // Get description
    const ttDescription = getMetaContent('og:description');
    if (ttDescription) {
      data.description = ttDescription;
    }
    
    // TikTok is always video
    data.category = 'video';
    data.tiktokType = 'Video';
    
    // Try to extract username from URL
    const pathname = window.location.pathname;
    const match = pathname.match(/@([\w.-]+)/);
    if (match) {
      data.username = '@' + match[1];
    }
    
    console.log('TikTok data extracted:', data);
    return data;
    
  } catch (error) {
    console.error('Error extracting TikTok data:', error);
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

// Auto-extract on page load
window.addEventListener('load', () => {
  console.log('Page fully loaded, extracting metadata...');
  const metadata = extractMetadata();
  
  // Send to background script (optional)
  chrome.runtime.sendMessage({
    action: 'pageMetadataExtracted',
    metadata: metadata,
    url: window.location.href
  }).catch(err => {
    console.log('Background script not listening:', err);
  });
});

console.log('Content script initialized successfully');
