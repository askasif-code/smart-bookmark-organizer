// Smart Bookmark Organizer - Popup Script
console.log('Smart Bookmarks: Popup initialized');

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOM loaded, initializing...');
  
  // Get current tab information
  await loadCurrentPage();
  
  // Load saved bookmarks
  await loadBookmarks();
  
  // Setup event listeners
  setupEventListeners();
  
  // Load custom folders
  await loadFolders();
  
  console.log('Initialization complete!');
});

// Load current page info
async function loadCurrentPage() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab) {
      // Update page title
      const pageTitle = document.getElementById('page-title');
      pageTitle.textContent = tab.title || 'Untitled Page';
      pageTitle.title = tab.title; // Tooltip for long titles
      
      // Update page URL
      const pageUrl = document.getElementById('page-url');
      pageUrl.textContent = tab.url || '';
      pageUrl.title = tab.url; // Tooltip
      
      // Detect and display category
      const category = detectCategory(tab.url);
      updateCategoryBadge(category);
      
      // Auto-select category in dropdown
      document.getElementById('category-select').value = category;
      
      console.log('Current page loaded:', {
        title: tab.title,
        url: tab.url,
        category: category
      });
    }
  } catch (error) {
    console.error('Error loading current page:', error);
  }
}

// Detect content category from URL
function detectCategory(url) {
  if (!url) return 'text';
  
  // Video patterns
  const videoPatterns = [
    /youtube\.com\/watch/i,
    /youtu\.be\//i,
    /vimeo\.com/i,
    /tiktok\.com/i,
    /instagram\.com\/reel/i,
    /instagram\.com\/tv/i,
    /facebook\.com\/watch/i,
    /dailymotion\.com/i,
    /twitch\.tv/i
  ];
  
  // Audio patterns
  const audioPatterns = [
    /spotify\.com\/track/i,
    /spotify\.com\/episode/i,
    /soundcloud\.com/i,
    /apple\.com.*podcast/i,
    /anchor\.fm/i
  ];
  
  // Image patterns
  const imagePatterns = [
    /pinterest\.com/i,
    /unsplash\.com/i,
    /pexels\.com/i,
    /flickr\.com/i,
    /instagram\.com\/p\//i,
    /behance\.net/i
  ];
  
  // Check video
  for (const pattern of videoPatterns) {
    if (pattern.test(url)) return 'video';
  }
  
  // Check audio
  for (const pattern of audioPatterns) {
    if (pattern.test(url)) return 'audio';
  }
  
  // Check image
  for (const pattern of imagePatterns) {
    if (pattern.test(url)) return 'image';
  }
  
  // Default to text
  return 'text';
}

// Update category badge
function updateCategoryBadge(category) {
  const badge = document.getElementById('category-badge');
  
  const categoryInfo = {
    video: { text: '🎥 Video', color: '#e53e3e' },
    audio: { text: '🎵 Audio', color: '#38b2ac' },
    image: { text: '🖼️ Image', color: '#ed8936' },
    text: { text: '📝 Text', color: '#4299e1' }
  };
  
  const info = categoryInfo[category] || categoryInfo.text;
  badge.textContent = info.text;
  badge.style.background = info.color;
}

// Setup all event listeners
function setupEventListeners() {
  // Save bookmark button
  document.getElementById('save-btn').addEventListener('click', saveBookmark);
  
  // Settings button
  document.getElementById('settings-btn').addEventListener('click', () => {
    alert('⚙️ Settings feature coming soon!\n\n- Theme customization\n- Sync settings\n- Pro upgrade');
  });
  
  // Add folder button
  document.getElementById('add-folder-btn').addEventListener('click', addNewFolder);
  
  // Search functionality
  document.getElementById('search-box').addEventListener('input', (e) => {
    searchBookmarks(e.target.value);
  });
  
  // Category selector change
  document.getElementById('category-select').addEventListener('change', (e) => {
    updateCategoryBadge(e.target.value === 'auto' ? detectCategory(window.currentUrl) : e.target.value);
  });
  
  console.log('Event listeners attached');
}

// Save bookmark function
async function saveBookmark() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      showNotification('❌ No active tab found', 'error');
      return;
    }
    
    // Get form values
    const categorySelect = document.getElementById('category-select').value;
    const folder = document.getElementById('folder-select').value;
    const tagsInput = document.getElementById('tags-input').value;
    
    // Detect category if auto
    const finalCategory = categorySelect === 'auto' ? detectCategory(tab.url) : categorySelect;
    
    // Parse tags
    const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(t => t) : [];
    
    // Create bookmark object
    const bookmark = {
      id: `bm-${Date.now()}`,
      url: tab.url,
      title: tab.title,
      category: finalCategory,
      folder: folder,
      tags: tags,
      timestamp: Date.now(),
      favicon: tab.favIconUrl || '',
      platform: getPlatform(tab.url)
    };
    
    // Get existing bookmarks
    const result = await chrome.storage.local.get(['bookmarks']);
    const bookmarks = result.bookmarks || [];
    
    // Add new bookmark
    bookmarks.unshift(bookmark);
    
    // Save to storage
    await chrome.storage.local.set({ bookmarks: bookmarks });
    
    // Update UI
    await loadBookmarks();
    
    // Clear tags input
    document.getElementById('tags-input').value = '';
    
    // Show success notification
    showNotification('✅ Bookmark saved successfully!', 'success');
    
    console.log('Bookmark saved:', bookmark);
    
  } catch (error) {
    console.error('Error saving bookmark:', error);
    showNotification('❌ Error saving bookmark', 'error');
  }
}

// Get platform name from URL
function getPlatform(url) {
  if (!url) return 'web';
  
  const platforms = {
    'youtube.com': 'YouTube',
    'youtu.be': 'YouTube',
    'instagram.com': 'Instagram',
    'twitter.com': 'Twitter',
    'tiktok.com': 'TikTok',
    'facebook.com': 'Facebook',
    'linkedin.com': 'LinkedIn',
    'reddit.com': 'Reddit',
    'spotify.com': 'Spotify',
    'medium.com': 'Medium'
  };
  
  for (const [domain, name] of Object.entries(platforms)) {
    if (url.includes(domain)) return name;
  }
  
  return 'Web';
}

// Load and display bookmarks
async function loadBookmarks() {
  try {
    const result = await chrome.storage.local.get(['bookmarks']);
    const bookmarks = result.bookmarks || [];
    
    const listContainer = document.getElementById('bookmarks-list');
    
    // Update count
    document.getElementById('total-count').textContent = bookmarks.length;
    
    // Show empty state if no bookmarks
    if (bookmarks.length === 0) {
      listContainer.innerHTML = '<p class="empty-state">No bookmarks yet. Save your first one! 🎉</p>';
      return;
    }
    
    // Display recent bookmarks (last 5)
    const recentBookmarks = bookmarks.slice(0, 5);
    
    listContainer.innerHTML = recentBookmarks.map(bookmark => `
      <div class="bookmark-item" data-url="${bookmark.url}" title="Click to open">
        <div class="bookmark-icon">${getCategoryIcon(bookmark.category)}</div>
        <div class="bookmark-info">
          <div class="bookmark-title">${escapeHtml(bookmark.title)}</div>
          <div class="bookmark-meta">
            ${bookmark.platform} • ${getTimeAgo(bookmark.timestamp)} • ${bookmark.folder}
          </div>
        </div>
      </div>
    `).join('');
    
    // Add click listeners to bookmarks
    listContainer.querySelectorAll('.bookmark-item').forEach(item => {
      item.addEventListener('click', () => {
        chrome.tabs.create({ url: item.dataset.url });
      });
    });
    
    console.log(`Loaded ${bookmarks.length} bookmarks`);
    
  } catch (error) {
    console.error('Error loading bookmarks:', error);
  }
}

// Get category icon
function getCategoryIcon(category) {
  const icons = {
    video: '🎥',
    audio: '🎵',
    image: '🖼️',
    text: '📝'
  };
  return icons[category] || '📄';
}

// Get time ago string
function getTimeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Add new folder
async function addNewFolder() {
  const folderName = prompt('📁 Enter new folder name:');
  
  if (!folderName || !folderName.trim()) return;
  
  const folderEmoji = prompt('🎨 Enter folder emoji (optional):', '📁');
  
  try {
    const result = await chrome.storage.local.get(['folders']);
    const folders = result.folders || [];
    
    const newFolder = {
      id: `folder-${Date.now()}`,
      name: folderName.trim(),
      emoji: folderEmoji || '📁',
      createdAt: Date.now()
    };
    
    folders.push(newFolder);
    await chrome.storage.local.set({ folders: folders });
    
    await loadFolders();
    
    // Select new folder
    document.getElementById('folder-select').value = newFolder.id;
    
    showNotification(`✅ Folder "${folderName}" created!`, 'success');
    
  } catch (error) {
    console.error('Error creating folder:', error);
    showNotification('❌ Error creating folder', 'error');
  }
}

// Load custom folders
async function loadFolders() {
  try {
    const result = await chrome.storage.local.get(['folders']);
    const folders = result.folders || [];
    
    const select = document.getElementById('folder-select');
    const currentValue = select.value;
    
    // Keep default folders
    select.innerHTML = `
      <option value="default">Default</option>
      <option value="videos">📹 Videos</option>
      <option value="stories">📝 Stories</option>
      <option value="novels">📚 Novels</option>
      <option value="tutorials">🎓 Tutorials</option>
      <option value="images">🖼️ Images</option>
      <option value="audio">🎵 Audio</option>
    `;
    
    // Add custom folders
    folders.forEach(folder => {
      const option = document.createElement('option');
      option.value = folder.id;
      option.textContent = `${folder.emoji} ${folder.name}`;
      select.appendChild(option);
    });
    
    // Restore selection
    if (currentValue) select.value = currentValue;
    
  } catch (error) {
    console.error('Error loading folders:', error);
  }
}

// Search bookmarks
async function searchBookmarks(query) {
  if (!query.trim()) {
    await loadBookmarks();
    return;
  }
  
  try {
    const result = await chrome.storage.local.get(['bookmarks']);
    const bookmarks = result.bookmarks || [];
    
    const searchLower = query.toLowerCase();
    const filtered = bookmarks.filter(bm => 
      bm.title.toLowerCase().includes(searchLower) ||
      bm.url.toLowerCase().includes(searchLower) ||
      bm.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
      bm.platform.toLowerCase().includes(searchLower)
    );
    
    const listContainer = document.getElementById('bookmarks-list');
    
    if (filtered.length === 0) {
      listContainer.innerHTML = '<p class="empty-state">No bookmarks found 🔍</p>';
      return;
    }
    
    listContainer.innerHTML = filtered.slice(0, 5).map(bookmark => `
      <div class="bookmark-item" data-url="${bookmark.url}">
        <div class="bookmark-icon">${getCategoryIcon(bookmark.category)}</div>
        <div class="bookmark-info">
          <div class="bookmark-title">${escapeHtml(bookmark.title)}</div>
          <div class="bookmark-meta">
            ${bookmark.platform} • ${getTimeAgo(bookmark.timestamp)} • ${bookmark.folder}
          </div>
        </div>
      </div>
    `).join('');
    
    // Add click listeners
    listContainer.querySelectorAll('.bookmark-item').forEach(item => {
      item.addEventListener('click', () => {
        chrome.tabs.create({ url: item.dataset.url });
      });
    });
    
  } catch (error) {
    console.error('Error searching bookmarks:', error);
  }
}

// Show notification (temporary alert - will be replaced with toast)
function showNotification(message, type = 'info') {
  // For now, using alert (will add toast notifications later)
  alert(message);
}

console.log('popup.js loaded successfully');
