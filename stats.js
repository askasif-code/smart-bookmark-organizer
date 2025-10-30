// stats.js - Statistics Dashboard Functionality

// Back button functionality
document.getElementById('backBtn').addEventListener('click', () => {
    window.location.href = 'popup.html';
});

// Load and display statistics
async function loadStatistics() {
    try {
        // Get all bookmarks from storage
        const result = await chrome.storage.local.get(['bookmarks', 'folders']);
        const bookmarks = result.bookmarks || [];
        const folders = result.folders || [];

        // Calculate total bookmarks
        const totalBookmarks = bookmarks.length;
        document.getElementById('totalBookmarks').textContent = totalBookmarks;

        // Calculate category counts
        const videoCount = bookmarks.filter(b => b.category === 'video').length;
        const imageCount = bookmarks.filter(b => b.category === 'image').length;
        const audioCount = bookmarks.filter(b => b.category === 'audio').length;
        const textCount = bookmarks.filter(b => b.category === 'text').length;

        document.getElementById('videoCount').textContent = videoCount;
        document.getElementById('imageCount').textContent = imageCount;
        document.getElementById('audioCount').textContent = audioCount;
        document.getElementById('textCount').textContent = textCount;

        // Calculate percentages for progress bars
        if (totalBookmarks > 0) {
            document.querySelector('.video-progress').style.width = ((videoCount / totalBookmarks) * 100) + '%';
            document.querySelector('.image-progress').style.width = ((imageCount / totalBookmarks) * 100) + '%';
            document.querySelector('.audio-progress').style.width = ((audioCount / totalBookmarks) * 100) + '%';
            document.querySelector('.text-progress').style.width = ((textCount / totalBookmarks) * 100) + '%';
        }

        // Calculate folder count (including default)
        const folderCount = folders.length + 1; // +1 for default folder
        document.getElementById('folderCount').textContent = folderCount;

        // Calculate unique tags count
        const allTags = new Set();
        bookmarks.forEach(bm => {
            if (bm.tags) bm.tags.forEach(tag => allTags.add(tag));
        });
        document.getElementById('tagCount').textContent = allTags.size;

        // Display platform breakdown
        displayPlatformBreakdown(bookmarks);

        // Display top tags
        displayTopTags(bookmarks);

        // Display recent activity
        displayRecentActivity(bookmarks);

    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

// Display platform breakdown
function displayPlatformBreakdown(bookmarks) {
    const platformList = document.getElementById('platformList');
    
    // Count bookmarks by platform
    const platformCounts = {};
    bookmarks.forEach(bookmark => {
        const platform = bookmark.platform || 'Unknown';
        platformCounts[platform] = (platformCounts[platform] || 0) + 1;
    });

    // Sort platforms by count (highest first)
    const sortedPlatforms = Object.entries(platformCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8); // Top 8 platforms

    // Display platforms
    if (sortedPlatforms.length === 0) {
        platformList.innerHTML = '<div class="empty-state">No platforms yet 📌</div>';
        return;
    }

    platformList.innerHTML = sortedPlatforms.map(([platform, count]) => `
        <div class="platform-item">
            <span class="platform-name">${platform}</span>
            <span class="platform-count">${count}</span>
        </div>
    `).join('');
}

// Display top tags
function displayTopTags(bookmarks) {
    const tagList = document.getElementById('tagList');
    
    // Count all tags
    const tagCounts = {};
    bookmarks.forEach(bookmark => {
        if (bookmark.tags && bookmark.tags.length > 0) {
            bookmark.tags.forEach(tag => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
        }
    });

    // Sort tags by count (highest first)
    const sortedTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15); // Top 15 tags

    // Display tags
    if (sortedTags.length === 0) {
        tagList.innerHTML = '<div class="empty-state">No tags yet. Add tags to your bookmarks! 🏷️</div>';
        return;
    }

    tagList.innerHTML = sortedTags.map(([tag, count]) => `
        <div class="tag-item">
            <span>${tag}</span>
            <span class="tag-count">${count}</span>
        </div>
    `).join('');
}

// Display recent activity (last 7 days)
function displayRecentActivity(bookmarks) {
    const activityChart = document.getElementById('activityChart');
    
    if (bookmarks.length === 0) {
        activityChart.innerHTML = '<div class="empty-state">No activity yet 📊</div>';
        return;
    }

    // Get last 7 days
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        days.push({
            date: date,
            label: formatDate(date, i),
            count: 0
        });
    }

    // Count bookmarks for each day
    bookmarks.forEach(bookmark => {
        const bookmarkDate = new Date(bookmark.timestamp);
        days.forEach(day => {
            if (isSameDay(bookmarkDate, day.date)) {
                day.count++;
            }
        });
    });

    // Find max count for bar width calculation
    const maxCount = Math.max(...days.map(d => d.count), 1);

    // Display activity bars
    activityChart.innerHTML = days.map(day => {
        const percentage = (day.count / maxCount) * 100;
        return `
            <div class="activity-day">
                <span class="activity-date">${day.label}</span>
                <div class="activity-bar-container">
                    <div class="activity-bar-fill" style="width: ${percentage}%"></div>
                </div>
                <span class="activity-count">${day.count}</span>
            </div>
        `;
    }).join('');
}

// Helper: Format date
function formatDate(date, daysAgo) {
    if (daysAgo === 0) return 'Today';
    if (daysAgo === 1) return 'Yesterday';
    
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
}

// Helper: Check if same day
function isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
}

// Load statistics when page loads
document.addEventListener('DOMContentLoaded', loadStatistics);
