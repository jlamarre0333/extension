// Popup functionality for Citation Cross-Reference Extension

document.addEventListener('DOMContentLoaded', async () => {
  const statusDiv = document.getElementById('status');
  const statusText = document.getElementById('status-text');
  const toggleBtn = document.getElementById('toggle-btn');
  const settingsBtn = document.getElementById('settings-btn');
  
  // Get current tab to check if extension is active
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const isYouTube = tab.url.includes('youtube.com');
  
  // Update status based on current page
  if (isYouTube) {
    statusDiv.className = 'status active';
    statusText.textContent = 'Active on YouTube';
    toggleBtn.textContent = 'Disable';
    toggleBtn.className = 'secondary';
  } else {
    statusDiv.className = 'status inactive';
    statusText.textContent = 'Only works on YouTube';
    toggleBtn.textContent = 'Visit YouTube';
    toggleBtn.className = 'primary';
  }
  
  // Load and display stats
  loadStats();
  
  // Event listeners
  toggleBtn.addEventListener('click', handleToggle);
  settingsBtn.addEventListener('click', openSettings);
});

async function loadStats() {
  try {
    const result = await chrome.storage.local.get([
      'citationsToday',
      'videosFound',
      'sourcesAccessed'
    ]);
    
    document.getElementById('citations-today').textContent = result.citationsToday || 0;
    document.getElementById('videos-found').textContent = result.videosFound || 0;
    document.getElementById('sources-accessed').textContent = result.sourcesAccessed || 0;
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

async function handleToggle() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (tab.url.includes('youtube.com')) {
    // Toggle extension on/off for current tab
    const result = await chrome.storage.local.get(['extensionEnabled']);
    const isEnabled = result.extensionEnabled !== false; // Default to true
    
    await chrome.storage.local.set({ extensionEnabled: !isEnabled });
    
    // Send message to content script
    try {
      await chrome.tabs.sendMessage(tab.id, {
        action: isEnabled ? 'disable' : 'enable'
      });
    } catch (error) {
      console.log('Content script not ready yet');
    }
    
    // Update UI
    const toggleBtn = document.getElementById('toggle-btn');
    const statusDiv = document.getElementById('status');
    const statusText = document.getElementById('status-text');
    
    if (!isEnabled) {
      statusDiv.className = 'status active';
      statusText.textContent = 'Active on YouTube';
      toggleBtn.textContent = 'Disable';
      toggleBtn.className = 'secondary';
    } else {
      statusDiv.className = 'status inactive';
      statusText.textContent = 'Disabled on YouTube';
      toggleBtn.textContent = 'Enable';
      toggleBtn.className = 'primary';
    }
  } else {
    // Navigate to YouTube
    chrome.tabs.create({ url: 'https://www.youtube.com' });
    window.close();
  }
}

function openSettings() {
  // For now, just show an alert. Later we'll create a proper settings page
  alert('Settings panel coming soon! This will allow you to:\n\n• Choose which types of citations to detect\n• Set API preferences\n• Customize the sidebar appearance\n• Export your citation history');
} 