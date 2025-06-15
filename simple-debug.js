// Simple debug script to test content script loading
console.log('🚀 CONTENT SCRIPT LOADED!');
console.log('Current URL:', window.location.href);
console.log('Is YouTube:', window.location.hostname === 'www.youtube.com');
console.log('Is video page:', window.location.pathname === '/watch');

// Add a visible indicator
const indicator = document.createElement('div');
indicator.style.cssText = `
  position: fixed;
  top: 10px;
  right: 10px;
  background: red;
  color: white;
  padding: 10px;
  z-index: 9999;
  border-radius: 5px;
  font-family: Arial;
`;
indicator.textContent = 'EXTENSION LOADED';
document.body.appendChild(indicator);

// Remove after 3 seconds
setTimeout(() => {
  indicator.remove();
}, 3000); 