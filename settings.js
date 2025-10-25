// settings.js - Settings Page Functionality

// Back button
document.getElementById('backBtn').addEventListener('click', () => {
    window.location.href = 'popup.html';
});

// Load settings on page load
document.addEventListener('DOMContentLoaded', async () => {
    await loadSettings();
    await loadFolders();
});

// Load saved settings
async function loadSettings() {
    const result = await chrome.storage.local.get(['settings']);
    const settings = result.settings || {
        theme: 'light',
        autoDetect: true,
        defaultFolder: 'default',
        notifications: true
    };

    // Apply theme
    if (settings.theme === 'dark') {
        document.body.classList.add('dark');
        document.getElementById('themeToggle').checked = true;
        document.getElementById('themeLabel').textContent = 'Dark';
    }

    // Apply other settings
    document.getElementById('autoDetect').checked = settings.autoDetect;
    document.getElementById('defaultFolder').value = settings.defaultFolder;
    document.getElementById('notifications').checked = settings.notifications;
}

// Load folders for dropdown
async function loadFolders() {
    const result = await chrome.storage.local.get(['folders']);
    const folders = result.folders || [];
    const select = document.getElementById('defaultFolder');
    
    // Add custom folders
    folders.forEach(folder => {
        const option = document.createElement('option');
        option.value = folder.id;
        option.textContent = `${folder.emoji || '📁'} ${folder.name}`;
        select.appendChild(option);
    });
}

// Save settings
async function saveSettings() {
    const settings = {
        theme: document.getElementById('themeToggle').checked ? 'dark' : 'light',
        autoDetect: document.getElementById('autoDetect').checked,
        defaultFolder: document.getElementById('defaultFolder').value,
        notifications: document.getElementById('notifications').checked
    };

    await chrome.storage.local.set({ settings });
}

// Theme toggle
document.getElementById('themeToggle').addEventListener('change', function() {
    if (this.checked) {
        document.body.classList.add('dark');
        document.getElementById('themeLabel').textContent = 'Dark';
    } else {
        document.body.classList.remove('dark');
        document.getElementById('themeLabel').textContent = 'Light';
    }
    saveSettings();
});

// Auto-detect toggle
document.getElementById('autoDetect').addEventListener('change', saveSettings);

// Default folder change
document.getElementById('defaultFolder').addEventListener('change', saveSettings);

// Notifications toggle
document.getElementById('notifications').addEventListener('change', saveSettings);

// Reset all data
document.getElementById('resetBtn').addEventListener('click', async () => {
    const confirmed = confirm('⚠️ Are you sure? This will delete ALL bookmarks, folders, and settings. This action cannot be undone!');
    
    if (confirmed) {
        const doubleConfirm = confirm('🚨 FINAL WARNING: All your data will be lost forever. Are you absolutely sure?');
        
        if (doubleConfirm) {
            await chrome.storage.local.clear();
            alert('✅ All data has been reset!');
            window.location.href = 'popup.html';
        }
    }
});
