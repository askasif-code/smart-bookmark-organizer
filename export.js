// Export bookmarks functionality

// Export as JSON
function exportAsJSON() {
  chrome.storage.local.get(['bookmarks'], function(result) {
    const bookmarks = result.bookmarks || [];
    
    if (bookmarks.length === 0) {
      alert('❌ No bookmarks to export');
      return;
    }
    
    const dataStr = JSON.stringify(bookmarks, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'smart-bookmarks-' + Date.now() + '.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('Exported ' + bookmarks.length + ' bookmarks as JSON');
    alert('✅ Exported ' + bookmarks.length + ' bookmarks!');
  });
}

// Export as CSV
function exportAsCSV() {
  chrome.storage.local.get(['bookmarks'], function(result) {
    const bookmarks = result.bookmarks || [];
    
    if (bookmarks.length === 0) {
      alert('❌ No bookmarks to export');
      return;
    }
    
    // CSV headers
    let csv = 'Title,URL,Category,Platform,Folder,Tags,Date\n';
    
    // Add data rows
    bookmarks.forEach(bm => {
      const date = new Date(bm.timestamp).toLocaleString();
      const tags = bm.tags ? bm.tags.join('; ') : '';
      
      csv += `"${bm.title}","${bm.url}","${bm.category}","${bm.platform}","${bm.folder}","${tags}","${date}"\n`;
    });
    
    const dataBlob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'smart-bookmarks-' + Date.now() + '.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('Exported ' + bookmarks.length + ' bookmarks as CSV');
    alert('✅ Exported ' + bookmarks.length + ' bookmarks to CSV!');
  });
}

// Make functions available globally
window.exportAsJSON = exportAsJSON;
window.exportAsCSV = exportAsCSV;

console.log('Export module loaded');
