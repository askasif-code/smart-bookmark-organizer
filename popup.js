// Smart Bookmark Organizer - Popup Script (FIXED VERSION)
console.log('Popup script loading...');

// Wait for DOM
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded');
  init();
});

// Initialize
function init() {
  loadCurrentPage();
  loadBookmarks();
  setupEventListeners();
  loadFolders();
}

// Load current page info
function loadCurrentPage() {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (tabs && tabs[0]) {
      const tab = tabs[0];
      
      // Update title
      document.getElementById('page-title').textContent = tab.title || 'Untitled';
      
      // Update URL
      document.getElementById('page-url').textContent = tab.url || '';
      
      // Detect category
      const category = detectCategory(tab.url);
      updateCategoryBadge(category);
      
      console.log('Page loaded:', tab.title, category);
    }
  });
}

// Detect category - SIMPLE VERSION
function detectCategory(url) {
  if (!url) return 'text';
  
  const u = url.toLowerCase();
  
  // Video
  if (u.includes('youtube.com/watch') || u.includes('youtu.be') || 
      u.includes('instagram.com/reel') || u.includes('tiktok.com')) {
    return 'video';
  }
  
  // Image
  if (u.includes('instagram.com/p/') || u.includes('pinterest.com')) {
    return 'image';
  }
  
  // Audio
  if (u.includes('spotify.com') || u.includes('soundcloud.com')) {
    return 'audio';
  }
  
  return 'text';
}

// Update badge
function updateCategoryBadge(category) {
  const badge = document.getElementById('category-badge');
  
  if (category === 'video') {
    badge.textContent = '🎥 Video';
    badge.style.background = '#e53e3e';
  } else if (category === 'image') {
    badge.textContent = '🖼️ Image';
    badge.style.background = '#ed8936';
  } else if (category === 'audio') {
    badge.textContent = '🎵 Audio';
    badge.style.background = '#38b2ac';
  } else {
    badge.textContent = '📝 Text';
    badge.style.background = '#4299e1';
  }
}

// Setup event listeners
function setupEventListeners() {
  // Save button
  document.getElementById('save-btn').addEventListener('click', saveBookmark);
  
  // Settings
  document.getElementById('settings-btn').addEventListener('click', function() {
    alert('Settings coming soon!');
  });
  
  // Add folder
  document.getElementById('add-folder-btn').addEventListener('click', addNewFolder);
  
  // Search
  document.getElementById('search-box').addEventListener('input', function(e) {
    searchBookmarks(e.target.value);
  });
}

// Save bookmark
function saveBookmark() {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (!tabs || !tabs[0]) return;
    
    const tab = tabs[0];
    const category = document.getElementById('category-select').value;
    const folder = document.getElementById('folder-select').value;
    const tags = document.getElementById('tags-input').value;
    
    const bookmark = {
      id: 'bm-' + Date.now(),
      url: tab.url,
      title: tab.title,
      category: category === 'auto' ? detectCategory(tab.url) : category,
      folder: folder,
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      timestamp: Date.now(),
      platform: getPlatform(tab.url)
    };
    
    // Get existing bookmarks
    chrome.storage.local.get(['bookmarks'], function(result) {
      const bookmarks = result.bookmarks || [];
      bookmarks.unshift(bookmark);
      
      // Save
      chrome.storage.local.set({ bookmarks: bookmarks }, function() {
        alert('✅ Bookmark saved!');
        loadBookmarks();
        document.getElementById('tags-input').value = '';
      });
    });
  });
}

// Get platform
function getPlatform(url) {
  if (!url) return 'Web';
  if (url.includes('youtube.com')) return 'YouTube';
  if (url.includes('instagram.com')) return 'Instagram';
  if (url.includes('tiktok.com')) return 'TikTok';
  if (url.includes('twitter.com')) return 'Twitter';
  if (url.includes('spotify.com')) return 'Spotify';
  return 'Web';
}

// Load bookmarks
function loadBookmarks() {
  chrome.storage.local.get(['bookmarks'], function(result) {
    const bookmarks = result.bookmarks || [];
    const listContainer = document.getElementById('bookmarks-list');
    
    // Update count
    document.getElementById('total-count').textContent = bookmarks.length;
    
    if (bookmarks.length === 0) {
      listContainer.innerHTML = '<p class="empty-state">No bookmarks yet 🎉</p>';
      return;
    }
    
    // Show recent 5
    const recent = bookmarks.slice(0, 5);
    
    listContainer.innerHTML = recent.map(bm => `
      <div class="bookmark-item" data-url="${bm.url}">
        <div class="bookmark-icon">${getCategoryIcon(bm.category)}</div>
        <div class="bookmark-info">
          <div class="bookmark-title">${escapeHtml(bm.title)}</div>
          <div class="bookmark-meta">${bm.platform} • ${getTimeAgo(bm.timestamp)}</div>
        </div>
      </div>
    `).join('');
    
    // Add click listeners
    document.querySelectorAll('.bookmark-item').forEach(item => {
      item.addEventListener('click', function() {
        chrome.tabs.create({ url: this.dataset.url });
      });
    });
  });
}

// Get category icon
function getCategoryIcon(category) {
  if (category === 'video') return '🎥';
  if (category === 'image') return '🖼️';
  if (category === 'audio') return '🎵';
  return '📝';
}

// Time ago
function getTimeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
  if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
  return Math.floor(seconds / 86400) + 'd ago';
}

// Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Add new folder
function addNewFolder() {
  const name = prompt('Enter folder name:');
  if (!name) return;
  
  chrome.storage.local.get(['folders'], function(result) {
    const folders = result.folders || [];
    folders.push({ id: 'f-' + Date.now(), name: name });
    chrome.storage.local.set({ folders: folders }, function() {
      loadFolders();
      alert('Folder created!');
    });
  });
}

// Load folders
function loadFolders() {
  chrome.storage.local.get(['folders'], function(result) {
    const folders = result.folders || [];
    const select = document.getElementById('folder-select');
    
    select.innerHTML = `
      <option value="default">Default</option>
      <option value="videos">📹 Videos</option>
      <option value="stories">📝 Stories</option>
      <option value="novels">📚 Novels</option>
    `;
    
    folders.forEach(f => {
      const option = document.createElement('option');
      option.value = f.id;
      option.textContent = f.name;
      select.appendChild(option);
    });
  });
}

// Search bookmarks
function searchBookmarks(query) {
  if (!query) {
    loadBookmarks();
    return;
  }
  
  chrome.storage.local.get(['bookmarks'], function(result) {
    const bookmarks = result.bookmarks || [];
    const filtered = bookmarks.filter(bm => 
      bm.title.toLowerCase().includes(query.toLowerCase()) ||
      bm.url.toLowerCase().includes(query.toLowerCase())
    );
    
    const listContainer = document.getElementById('bookmarks-list');
    
    if (filtered.length === 0) {
      listContainer.innerHTML = '<p class="empty-state">No results</p>';
      return;
    }
    
    listContainer.innerHTML = filtered.slice(0, 5).map(bm => `
      <div class="bookmark-item" data-url="${bm.url}">
        <div class="bookmark-icon">${getCategoryIcon(bm.category)}</div>
        <div class="bookmark-info">
          <div class="bookmark-title">${escapeHtml(bm.title)}</div>
          <div class="bookmark-meta">${bm.platform} • ${getTimeAgo(bm.timestamp)}</div>
        </div>
      </div>
    `).join('');
    
    document.querySelectorAll('.bookmark-item').forEach(item => {
      item.addEventListener('click', function() {
        chrome.tabs.create({ url: this.dataset.url });
      });
    });
  });
}

console.log('Popup script loaded successfully');
