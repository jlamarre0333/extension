// YouTube-specific content script test
console.log('🎬 YOUTUBE CONTENT SCRIPT LOADED!');
console.log('YouTube URL:', window.location.href);
console.log('Is YouTube video page:', window.location.pathname === '/watch');

// Wait for page to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initYouTubeTest);
} else {
  initYouTubeTest();
}

function initYouTubeTest() {
  console.log('🚀 YouTube page ready, initializing test...');
  
  // Create visible indicator for YouTube
  const indicator = document.createElement('div');
  indicator.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    background: #ff0000;
    color: white;
    padding: 12px 16px;
    z-index: 999999;
    border-radius: 8px;
    font-family: 'YouTube Sans', Arial, sans-serif;
    font-size: 13px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    border: 2px solid #fff;
  `;
  indicator.textContent = '📚 EXTENSION WORKING ON YOUTUBE!';
  
  // Add to page
  document.body.appendChild(indicator);
  
  // Remove after 8 seconds
  setTimeout(() => {
    if (indicator.parentNode) {
      indicator.remove();
    }
  }, 8000);
  
  // Set global flag
  window.YOUTUBE_EXTENSION_LOADED = true;
  
  // Test basic YouTube elements
  const video = document.querySelector('video');
  const title = document.querySelector('h1.ytd-video-primary-info-renderer');
  
  console.log('✅ YouTube elements found:');
  console.log('- Video element:', video ? '✅' : '❌');
  console.log('- Title element:', title ? '✅' : '❌');
  
  if (title) {
    console.log('- Video title:', title.textContent?.trim());
  }
} 