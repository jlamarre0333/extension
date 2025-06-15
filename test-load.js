// Simple test to verify content script loading
console.log('🚀 TEST CONTENT SCRIPT LOADED!');
console.log('URL:', window.location.href);
console.log('Domain:', window.location.hostname);
console.log('Path:', window.location.pathname);

// Create visible indicator
const testDiv = document.createElement('div');
testDiv.style.cssText = `
  position: fixed;
  top: 20px;
  right: 20px;
  background: #ff0000;
  color: white;
  padding: 15px;
  z-index: 99999;
  border-radius: 8px;
  font-family: Arial, sans-serif;
  font-size: 14px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.3);
`;
testDiv.textContent = 'CONTENT SCRIPT WORKING!';
document.body.appendChild(testDiv);

// Remove after 5 seconds
setTimeout(() => {
  if (testDiv.parentNode) {
    testDiv.remove();
  }
}, 5000);

// Test global assignment
window.TEST_EXTENSION_LOADED = true;
console.log('✅ Test extension component loaded'); 