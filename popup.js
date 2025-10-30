// Smart Bookmark Organizer - Popup Script (ENHANCED WITH METADATA + IMPORT + BULK)
console.log('Popup script loading...');

// Wait for DOM
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded');
  init();
  setupBulkSelection();
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

// Statistics button
document.getElementById('statsBtn').addEventListener('click', () => {
    window.location.href = 'stats.html';
});

// Export button
document.getElementById('exportBtn').addEventListener('click', exportBookmarks);

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
      <div class="bookmark-item" data-url="${bm.url}">
        <div class="bookmark-content" title="Click to open">
          <div class="bookmark-icon">${getCategoryIcon(bm.category)}</div>
          <div class="bookmark-info">
            <div class="bookmark-title">${escapeHtml(bm.title)}</div>
            <div class="bookmark-meta">${bm.platform} • ${getTimeAgo(bm.timestamp)} • ${bm.folder}</div>          
          </div>
        </div>
        <button class="delete-btn" data-id="${bm.id}" title="Delete bookmark">🗑️</button>
      </div>
    `).join('');
    
    // Add click listeners
    document.querySelectorAll('.bookmark-item').forEach(item => {
      item.addEventListener('click', function(e) {
        // Don't open if clicking delete button
        if (!e.target.classList.contains('delete-btn')) {
          chrome.tabs.create({ url: this.dataset.url });
        }
      });
    });
    
    // Add delete button listeners
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const bookmarkId = this.dataset.id;
        deleteBookmark(bookmarkId);
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
    
    select.innerHTML = '<option value="default">Default</option>';
    
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

// ========================================
// EXPORT FUNCTIONALITY
// ========================================
function exportBookmarks() {
  chrome.storage.local.get(['bookmarks'], function(result) {
    const bookmarks = result.bookmarks || [];
    
    if (bookmarks.length === 0) {
      alert('❌ No bookmarks to export!');
      return;
    }
    
    // Ask format
    const format = confirm('Click OK for JSON, Cancel for CSV');
    
    if (format) {
      // Export as JSON
      const dataStr = JSON.stringify(bookmarks, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = 'bookmarks-' + Date.now() + '.json';
      link.click();
      
      alert('✅ Exported ' + bookmarks.length + ' bookmarks as JSON!');
    } else {
      // Export as CSV
      let csv = 'Title,URL,Category,Platform,Folder,Tags,Date\n';
      
      bookmarks.forEach(bm => {
        const date = new Date(bm.timestamp).toISOString();
        const tags = bm.tags ? bm.tags.join(';') : '';
        csv += `"${bm.title}","${bm.url}","${bm.category}","${bm.platform}","${bm.folder}","${tags}","${date}"\n`;
      });
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = 'bookmarks-' + Date.now() + '.csv';
      link.click();
      
      alert('✅ Exported ' + bookmarks.length + ' bookmarks as CSV!');
    }
  });
}

// ========================================
// IMPORT MODAL FUNCTIONALITY
// ========================================
const importModal = document.getElementById('importModal');
const importBtn = document.getElementById('importBtn');
const closeImportModal = document.getElementById('closeImportModal');
const cancelImportBtn = document.getElementById('cancelImportBtn');
const selectFileBtn = document.getElementById('selectFileBtn');
const importFileInput = document.getElementById('importFileInput');
const selectedFileName = document.getElementById('selectedFileName');
const confirmImportBtn = document.getElementById('confirmImportBtn');

// Open import modal
importBtn.addEventListener('click', () => {
    importModal.classList.add('show');
});

// Close modal
closeImportModal.addEventListener('click', closeModal);
cancelImportBtn.addEventListener('click', closeModal);

function closeModal() {
    importModal.classList.remove('show');
    resetImportForm();
}

// Close on outside click
importModal.addEventListener('click', (e) => {
    if (e.target === importModal) {
        closeModal();
    }
});

// Select file button
selectFileBtn.addEventListener('click', () => {
    importFileInput.click();
});

// File selected
importFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        selectedFileName.textContent = file.name;
        confirmImportBtn.disabled = false;
    } else {
        resetImportForm();
    }
});

// Reset form
function resetImportForm() {
    importFileInput.value = '';
    selectedFileName.textContent = 'No file selected';
    confirmImportBtn.disabled = true;
    document.getElementById('importStatus').style.display = 'none';
}

// Import button - ACTUAL FUNCTIONALITY
confirmImportBtn.addEventListener('click', async () => {
    const file = importFileInput.files[0];
    if (!file) {
        showImportStatus('Please select a file first!', 'error');
        return;
    }
    
    const format = document.querySelector('input[name="importFormat"]:checked').value;
    
    if (format === 'json') {
        await importFromJSON(file);
    } else {
        await importFromCSV(file);
    }
});

// Import from JSON
async function importFromJSON(file) {
    try {
        showImportStatus('Reading JSON file...', 'info');
        
        const text = await file.text();
        let importedData;
        
        try {
            importedData = JSON.parse(text);
        } catch (e) {
            showImportStatus('❌ Invalid JSON file format!', 'error');
            return;
        }
        
        // Validate structure
        if (!Array.isArray(importedData)) {
            showImportStatus('❌ JSON must be an array of bookmarks!', 'error');
            return;
        }
        
        // Get existing bookmarks
        const result = await chrome.storage.local.get(['bookmarks']);
        const existingBookmarks = result.bookmarks || [];
        
        // Validate and clean imported bookmarks
        const validBookmarks = importedData.filter(bm => {
            return bm.url && bm.title && bm.category;
        });
        
        if (validBookmarks.length === 0) {
            showImportStatus('❌ No valid bookmarks found in file!', 'error');
            return;
        }
        
        // Check for duplicates
        const existingUrls = new Set(existingBookmarks.map(bm => bm.url));
        const newBookmarks = validBookmarks.filter(bm => !existingUrls.has(bm.url));
        
        if (newBookmarks.length === 0) {
            showImportStatus('⚠️ All bookmarks already exist! No new bookmarks imported.', 'error');
            return;
        }
        
        // Add unique IDs and timestamps if missing
        newBookmarks.forEach(bm => {
            if (!bm.id) bm.id = 'bm-' + Date.now() + '-' + Math.random();
            if (!bm.timestamp) bm.timestamp = Date.now();
            if (!bm.folder) bm.folder = 'default';
            if (!bm.tags) bm.tags = [];
            if (!bm.platform) bm.platform = 'Web';
        });
        
        // Merge with existing bookmarks
        const mergedBookmarks = [...newBookmarks, ...existingBookmarks];
        
        // Save to storage
        await chrome.storage.local.set({ bookmarks: mergedBookmarks });
        
        showImportStatus(
            `✅ Success! Imported ${newBookmarks.length} new bookmarks!\n` +
            `(${validBookmarks.length - newBookmarks.length} duplicates skipped)`,
            'success'
        );
        
        // Reload bookmarks display
        setTimeout(() => {
            loadBookmarks();
            closeModal();
        }, 2000);
        
    } catch (error) {
        console.error('Import error:', error);
        showImportStatus('❌ Error importing file: ' + error.message, 'error');
    }
}

// Import from CSV
async function importFromCSV(file) {
    try {
        showImportStatus('Reading CSV file...', 'info');
        
        const text = await file.text();
        const bookmarks = parseCSVFile(text);
        
        if (bookmarks.length === 0) {
            showImportStatus('❌ No valid bookmarks found in CSV!', 'error');
            return;
        }
        
        // Get existing bookmarks
        const result = await chrome.storage.local.get(['bookmarks']);
        const existingBookmarks = result.bookmarks || [];
        
        // Check for duplicates
        const existingUrls = new Set(existingBookmarks.map(bm => bm.url));
        const newBookmarks = bookmarks.filter(bm => !existingUrls.has(bm.url));
        
        if (newBookmarks.length === 0) {
            showImportStatus('⚠️ All bookmarks already exist! No new bookmarks imported.', 'error');
            return;
        }
        
        // Merge with existing bookmarks
        const mergedBookmarks = [...newBookmarks, ...existingBookmarks];
        
        // Save to storage
        await chrome.storage.local.set({ bookmarks: mergedBookmarks });
        
        showImportStatus(
            `✅ Success! Imported ${newBookmarks.length} bookmarks from CSV!\n` +
            `(${bookmarks.length - newBookmarks.length} duplicates skipped)`,
            'success'
        );
        
        // Reload bookmarks display
        setTimeout(() => {
            loadBookmarks();
            closeModal();
        }, 2000);
        
    } catch (error) {
        console.error('CSV Import error:', error);
        showImportStatus('❌ Error importing CSV: ' + error.message, 'error');
    }
}

// Show import status message
function showImportStatus(message, type) {
    const statusEl = document.getElementById('importStatus');
    statusEl.textContent = message;
    statusEl.className = 'import-status ' + type;
    statusEl.style.display = 'block';
}

// Delete individual bookmark
function deleteBookmark(bookmarkId) {
  if (!confirm('Are you sure you want to delete this bookmark?')) {
    return;
  }
  
  chrome.storage.local.get(['bookmarks'], function(result) {
    const bookmarks = result.bookmarks || [];
    const filtered = bookmarks.filter(bm => bm.id !== bookmarkId);
    
    chrome.storage.local.set({ bookmarks: filtered }, function() {
      console.log('Bookmark deleted:', bookmarkId);
      alert('✅ Bookmark deleted!');
      loadBookmarks();
    });
  });
}

// ========================================
// CSV PARSER FUNCTIONS
// ========================================
function parseCSVFile(csvText) {
  console.log("CSV parsing shuru...");
  
  try {
    const lines = csvText.trim().split('\n');
    
    if (lines.length < 2) {
      console.error("CSV file khali hai!");
      return [];
    }
    
    // Headers ko parse karo
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    console.log("Headers:", headers);
    
    const bookmarks = [];
    
    // Har line ko process karo
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // CSV columns ko parse karo
      const values = parseCSVLine(line);
      
      if (values.length < 2) continue;
      
      // Headers aur values ko map karo
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      // Bookmark object banao
      const bookmark = {
        id: "bm-" + Date.now() + Math.random(),
        url: row['url'] || row['link'] || '',
        title: row['title'] || row['name'] || 'Untitled',
        category: row['category'] || detectCategory(row['url']),
        platform: row['platform'] || getPlatform(row['url']),
        folder: row['folder'] || 'default',
        tags: row['tags'] ? row['tags'].split(';').map(t => t.trim()).filter(t => t) : [],
        timestamp: Date.now(),
        favicon: '',
        metadata: {}
      };
      
      // Valid URL check karo
      if (bookmark.url && (bookmark.url.startsWith('http://') || bookmark.url.startsWith('https://'))) {
        bookmarks.push(bookmark);
        console.log("Bookmark added:", bookmark.title);
      }
    }
    
    console.log("Total bookmarks parsed:", bookmarks.length);
    return bookmarks;
    
  } catch (error) {
    console.error("CSV parsing error:", error);
    return [];
  }
}

// Helper function: CSV line ko parse karo
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let insideQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

// ========================================
// BULK SELECTION FUNCTIONALITY (DAY 12)
// ========================================

let bulkModeActive = false;
let selectedBookmarks = new Set();

function setupBulkSelection() {
    const bulkModeToggle = document.getElementById('bulkModeToggle');
    const selectAllBtn = document.getElementById('selectAllBtn');
    const deselectAllBtn = document.getElementById('deselectAllBtn');
    const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
    const bulkMoveBtn = document.getElementById('bulkMoveBtn');

    // Toggle bulk mode
    if (bulkModeToggle) {
        bulkModeToggle.addEventListener('click', toggleBulkMode);
    }

    // Select all bookmarks
    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', selectAllBookmarks);
    }

    // Deselect all bookmarks
    if (deselectAllBtn) {
        deselectAllBtn.addEventListener('click', deselectAllBookmarks);
    }

    // Bulk delete
    if (bulkDeleteBtn) {
        bulkDeleteBtn.addEventListener('click', bulkDeleteBookmarks);
    }

    // Bulk move
    if (bulkMoveBtn) {
        bulkMoveBtn.addEventListener('click', bulkMoveBookmarks);
    }
}

// Toggle bulk selection mode
function toggleBulkMode() {
    bulkModeActive = !bulkModeActive;
    const bulkModeToggle = document.getElementById('bulkModeToggle');
    const bulkControls = document.getElementById('bulkControls');
    const bookmarksList = document.getElementById('bookmarks-list');

    if (bulkModeActive) {
        // Activate bulk mode
        bulkModeToggle.classList.add('active');
        bulkModeToggle.innerHTML = '✓ Bulk Mode ON';
        bulkControls.style.display = 'block';
        bookmarksList.classList.add('bulk-mode-active');
        
        // Add checkboxes to all bookmarks
        addCheckboxesToBookmarks();
    } else {
        // Deactivate bulk mode
        bulkModeToggle.classList.remove('active');
        bulkModeToggle.innerHTML = '☑️ Bulk Select Mode';
        bulkControls.style.display = 'none';
        bookmarksList.classList.remove('bulk-mode-active');
        
        // Clear selection
        selectedBookmarks.clear();
        removeCheckboxesFromBookmarks();
        updateSelectedCount();
    }
}

// Add checkboxes to all bookmark items
function addCheckboxesToBookmarks() {
    const bookmarkItems = document.querySelectorAll('.bookmark-item');
    
    bookmarkItems.forEach((item, index) => {
        // Check if checkbox already exists
        if (!item.querySelector('.bookmark-checkbox')) {
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'bookmark-checkbox';
            checkbox.dataset.index = index;
            
           // Add change event listener
            checkbox.addEventListener('change', function(e) {
                e.stopPropagation(); // Prevent opening bookmark
                handleCheckboxChange(index, this.checked);
            });
            
            // Prevent click from opening bookmark
            checkbox.addEventListener('click', function(e) {
                e.stopPropagation();
            });
            
            // Insert checkbox at the beginning
            item.insertBefore(checkbox, item.firstChild);
        }
    });
}

// Remove checkboxes from bookmarks
function removeCheckboxesFromBookmarks() {
    const checkboxes = document.querySelectorAll('.bookmark-checkbox');
    checkboxes.forEach(checkbox => checkbox.remove());
    
    // Remove selected class
    const bookmarkItems = document.querySelectorAll('.bookmark-item');
    bookmarkItems.forEach(item => item.classList.remove('selected'));
}

// Handle checkbox change
function handleCheckboxChange(index, isChecked) {
    const bookmarkItems = document.querySelectorAll('.bookmark-item');
    const item = bookmarkItems[index];
    
    if (isChecked) {
        selectedBookmarks.add(index);
        item.classList.add('selected');
    } else {
        selectedBookmarks.delete(index);
        item.classList.remove('selected');
    }
    
    updateSelectedCount();
}

// Select all bookmarks
function selectAllBookmarks() {
    const checkboxes = document.querySelectorAll('.bookmark-checkbox');
    const bookmarkItems = document.querySelectorAll('.bookmark-item');
    
    selectedBookmarks.clear();
    
    checkboxes.forEach((checkbox, index) => {
        checkbox.checked = true;
        selectedBookmarks.add(index);
        bookmarkItems[index].classList.add('selected');
    });
    
    updateSelectedCount();
}

// Deselect all bookmarks
function deselectAllBookmarks() {
    const checkboxes = document.querySelectorAll('.bookmark-checkbox');
    const bookmarkItems = document.querySelectorAll('.bookmark-item');
    
    checkboxes.forEach((checkbox, index) => {
        checkbox.checked = false;
        bookmarkItems[index].classList.remove('selected');
    });
    
    selectedBookmarks.clear();
    updateSelectedCount();
}

// Update selected count display
function updateSelectedCount() {
    const selectedCountElement = document.getElementById('selectedCount');
    if (selectedCountElement) {
        selectedCountElement.textContent = `Selected: ${selectedBookmarks.size}`;
    }
}

// Bulk delete bookmarks
function bulkDeleteBookmarks() {
    if (selectedBookmarks.size === 0) {
        alert('Please select bookmarks to delete!');
        return;
    }
    
    const confirmDelete = confirm(`Are you sure you want to delete ${selectedBookmarks.size} bookmark(s)?`);
    
    if (!confirmDelete) {
        return;
    }
    
    chrome.storage.local.get(['bookmarks'], function(result) {
        let bookmarks = result.bookmarks || [];
        
        // Get currently displayed bookmarks (first 5)
        const displayedBookmarks = bookmarks.slice(0, 5);
        
        // Get IDs of selected bookmarks
        const selectedIds = Array.from(selectedBookmarks).map(index => {
            return displayedBookmarks[index] ? displayedBookmarks[index].id : null;
        }).filter(id => id !== null);
        
        // Filter out selected bookmarks
        bookmarks = bookmarks.filter(bm => !selectedIds.includes(bm.id));
        
        // Save updated bookmarks
        chrome.storage.local.set({ bookmarks: bookmarks }, function() {
            selectedBookmarks.clear();
            loadBookmarks();
            updateSelectedCount();
            alert(`✅ Deleted ${selectedIds.length} bookmark(s) successfully!`);
        });
    });
}

// Bulk move bookmarks to folder
function bulkMoveBookmarks() {
    if (selectedBookmarks.size === 0) {
        alert('Please select bookmarks to move!');
        return;
    }
    
    // Get available folders
    chrome.storage.local.get(['folders'], function(result) {
        const folders = result.folders || [];
        
        if (folders.length === 0) {
            alert('No custom folders available! Please create a folder first.');
            return;
        }
        
        // Create folder selection prompt
        let folderOptions = 'Select folder:\n\n0. Default\n';
        folders.forEach((folder, index) => {
            folderOptions += `${index + 1}. ${folder.emoji} ${folder.name}\n`;
        });
        
        const folderChoice = prompt(folderOptions + '\nEnter folder number:');
        
        if (!folderChoice) {
            return;
        }
        
        const folderIndex = parseInt(folderChoice);
        let targetFolder;
        
        if (folderIndex === 0) {
            targetFolder = 'default';
        } else if (folderIndex > 0 && folderIndex <= folders.length) {
            targetFolder = folders[folderIndex - 1].id;
        } else {
            alert('Invalid folder selection!');
            return;
        }
        
        // Move bookmarks
        chrome.storage.local.get(['bookmarks'], function(result) {
            let bookmarks = result.bookmarks || [];
            
            // Get currently displayed bookmarks (first 5)
            const displayedBookmarks = bookmarks.slice(0, 5);
            
            // Get IDs of selected bookmarks
            const selectedIds = Array.from(selectedBookmarks).map(index => {
                return displayedBookmarks[index] ? displayedBookmarks[index].id : null;
            }).filter(id => id !== null);
            
            // Update folder for selected bookmarks
            bookmarks.forEach(bm => {
                if (selectedIds.includes(bm.id)) {
                    bm.folder = targetFolder;
                }
            });
            
            // Save updated bookmarks
            chrome.storage.local.set({ bookmarks: bookmarks }, function() {
                selectedBookmarks.clear();
                loadBookmarks();
                updateSelectedCount();
                alert(`✅ Moved ${selectedIds.length} bookmark(s) successfully!`);
            });
        });
    });
}

console.log('Popup script loaded successfully with Bulk Selection!');