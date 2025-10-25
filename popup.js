// Smart Bookmark Organizer - Popup Script (ENHANCED WITH METADATA)
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
// Settings button
document.getElementById('settingsBtn').addEventListener('click', () => {
    window.location.href = 'settings.html';
});

// Load current page info (ENHANCED WITH METADATA)
function loadCurrentPage() {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (tabs && tabs[0]) {
      const tab = tabs[0];
      
      // First set basic info
      document.getElementById('page-title').textContent = tab.title || 'Loading...';
      document.getElementById('page-url').textContent = tab.url || '';
      
      // Detect category
      const category = detectCategory(tab.url);
      updateCategoryBadge(category);
      
      // Try to get enhanced metadata from content script
      chrome.tabs.sendMessage(tab.id, { action: 'getMetadata' }, function(response) {
        if (chrome.runtime.lastError) {
          console.log('Content script not ready yet:', chrome.runtime.lastError.message);
          return;
        }
        
        if (response && response.metadata) {
          const meta = response.metadata;
          console.log('Enhanced metadata received:', meta);
          
          // Update title with better metadata
          if (meta.title && meta.title !== 'Instagram' && meta.title !== 'YouTube') {
            document.getElementById('page-title').textContent = meta.title;
          }
          
          // Add username/channel if available
          if (meta.username) {
            const titleEl = document.getElementById('page-title');
            titleEl.textContent += ' • ' + meta.username;
          } else if (meta.channel) {
            const titleEl = document.getElementById('page-title');
            titleEl.textContent += ' • ' + meta.channel;
          }
          
          // Update category badge if metadata has category
          if (meta.category) {
            updateCategoryBadge(meta.category);
          }
        }
      });
      
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
      u.includes('instagram.com/reel') || u.includes('instagram.com/tv') ||
      u.includes('tiktok.com') || u.includes('facebook.com/watch') ||
      u.includes('vimeo.com') || u.includes('twitch.tv')) {
    return 'video';
  }
  
  // Image
  if (u.includes('instagram.com/p/') || u.includes('pinterest.com') ||
      u.includes('unsplash.com') || u.includes('pexels.com')) {
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
    alert('⚙️ Settings coming soon!\n\n- Theme options\n- Sync settings\n- Export/Import data');
  });
  
  // Add folder
  document.getElementById('add-folder-btn').addEventListener('click', addNewFolder);
  
  // Search
  document.getElementById('search-box').addEventListener('input', function(e) {
    searchBookmarks(e.target.value);
  });
}

// Save bookmark (ENHANCED WITH METADATA)
function saveBookmark() {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (!tabs || !tabs[0]) {
      alert('❌ No active tab found');
      return;
    }
    
    const tab = tabs[0];
    const categorySelect = document.getElementById('category-select').value;
    const folder = document.getElementById('folder-select').value;
    const tags = document.getElementById('tags-input').value;
    
    // Get title from page (may be enhanced by content script)
    const displayTitle = document.getElementById('page-title').textContent;
    
    const bookmark = {
      id: 'bm-' + Date.now(),
      url: tab.url,
      title: displayTitle || tab.title,
      category: categorySelect === 'auto' ? detectCategory(tab.url) : categorySelect,
      folder: folder,
      tags: tags ? tags.split(',').map(t => t.trim()).filter(t => t) : [],
      timestamp: Date.now(),
      platform: getPlatform(tab.url),
      favicon: tab.favIconUrl || ''
    };
    
    // Try to get enhanced metadata
    chrome.tabs.sendMessage(tab.id, { action: 'getMetadata' }, function(response) {
      if (response && response.metadata) {
        // Store additional metadata
        bookmark.metadata = response.metadata;
        
        // Use enhanced title if available
        if (response.metadata.title && response.metadata.title !== 'Instagram') {
          bookmark.title = response.metadata.title;
        }
        
        // Add username/channel
        if (response.metadata.username) {
          bookmark.title += ' • ' + response.metadata.username;
        } else if (response.metadata.channel) {
          bookmark.title += ' • ' + response.metadata.channel;
        }
      }
      
      // Save to storage
      chrome.storage.local.get(['bookmarks'], function(result) {
        const bookmarks = result.bookmarks || [];
        bookmarks.unshift(bookmark);
        
        chrome.storage.local.set({ bookmarks: bookmarks }, function() {
          console.log('Bookmark saved:', bookmark);
          alert('✅ Bookmark saved successfully!');
          loadBookmarks();
          document.getElementById('tags-input').value = '';
        });
      });
    });
  });
}

// Get platform
function getPlatform(url) {
  if (!url) return 'Web';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
  if (url.includes('instagram.com')) return 'Instagram';
  if (url.includes('tiktok.com')) return 'TikTok';
  if (url.includes('twitter.com') || url.includes('x.com')) return 'Twitter';
  if (url.includes('facebook.com')) return 'Facebook';
  if (url.includes('spotify.com')) return 'Spotify';
  if (url.includes('reddit.com')) return 'Reddit';
  if (url.includes('linkedin.com')) return 'LinkedIn';
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
      listContainer.innerHTML = '<p class="empty-state">No bookmarks yet. Save your first one! 🎉</p>';
      return;
    }
    
    // Show recent 5
    const recent = bookmarks.slice(0, 5);
    
    listContainer.innerHTML = recent.map(bm => `
      <div class="bookmark-item" data-url="${bm.url}" title="Click to open">
        <div class="bookmark-icon">${getCategoryIcon(bm.category)}</div>
        <div class="bookmark-info">
          <div class="bookmark-title">${escapeHtml(bm.title)}</div>
          <div class="bookmark-meta">${bm.platform} • ${getTimeAgo(bm.timestamp)} • ${bm.folder}</div>
        </div>
      </div>
    `).join('');
    
    // Add click listeners
    document.querySelectorAll('.bookmark-item').forEach(item => {
      item.addEventListener('click', function() {
        chrome.tabs.create({ url: this.dataset.url });
      });
    });
    
    console.log('Loaded ' + bookmarks.length + ' bookmarks');
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
  const name = prompt('📁 Enter folder name:');
  if (!name) return;
  
  const emoji = prompt('🎨 Enter folder emoji (optional):', '📁');
  
  chrome.storage.local.get(['folders'], function(result) {
    const folders = result.folders || [];
    folders.push({ 
      id: 'f-' + Date.now(), 
      name: name,
      emoji: emoji || '📁'
    });
    
    chrome.storage.local.set({ folders: folders }, function() {
      loadFolders();
      alert('✅ Folder "' + name + '" created!');
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
      <option value="tutorials">🎓 Tutorials</option>
      <option value="images">🖼️ Images</option>
      <option value="audio">🎵 Audio</option>
    `;
    
    folders.forEach(f => {
      const option = document.createElement('option');
      option.value = f.id;
      option.textContent = (f.emoji || '📁') + ' ' + f.name;
      select.appendChild(option);
    });
  });
}

// Search bookmarks
function searchBookmarks(query) {
  if (!query || query.trim() === '') {
    loadBookmarks();
    return;
  }
  
  chrome.storage.local.get(['bookmarks'], function(result) {
    const bookmarks = result.bookmarks || [];
    const q = query.toLowerCase();
    
    const filtered = bookmarks.filter(bm => 
      bm.title.toLowerCase().includes(q) ||
      bm.url.toLowerCase().includes(q) ||
      bm.platform.toLowerCase().includes(q) ||
      (bm.tags && bm.tags.some(tag => tag.toLowerCase().includes(q)))
    );
    
    const listContainer = document.getElementById('bookmarks-list');
    
    if (filtered.length === 0) {
      listContainer.innerHTML = '<p class="empty-state">No results found 🔍</p>';
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
    
    console.log('Search results: ' + filtered.length + ' bookmarks found');
  });
}

console.log('Popup script loaded successfully');
