// Simple test script to verify content script loading

console.log('🚀 SIMPLE TEST SCRIPT LOADED!');
console.log('🚀 Current URL:', window.location.href);
console.log('🚀 Is YouTube?', window.location.hostname === 'www.youtube.com');

// Add a visible indicator
setTimeout(() => {
  const indicator = document.createElement('div');
  indicator.textContent = '🚀 EXTENSION LOADED!';
  indicator.style.cssText = `
    position: fixed;
    top: 10px;
    left: 10px;
    background: red;
    color: white;
    padding: 10px;
    z-index: 10000;
    border-radius: 5px;
    font-weight: bold;
  `;
  document.body.appendChild(indicator);
  console.log('🚀 Visual indicator added');
}, 1000);

// Test basic functionality
setTimeout(() => {
  console.log('🚀 Testing basic detection...');
  
  // Simple citation test
  const testText = 'In the book "Test Book" by Test Author, we learn about testing.';
  const bookPattern = /book\s+[""']([^""']+)[""']\s+by\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi;
  const match = bookPattern.exec(testText);
  
  if (match) {
    console.log('🚀 Pattern matching works!', match);
    alert('Citation detection is working! Found: ' + match[1]);
  } else {
    console.log('🚀 Pattern matching failed');
    alert('Citation detection not working');
  }
}, 2000); 