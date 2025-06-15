console.log('ULTRA SIMPLE TEST LOADED!');

// Create a big red box immediately
const testDiv = document.createElement('div');
testDiv.textContent = 'EXTENSION WORKS!';
testDiv.style.cssText = `
  position: fixed;
  top: 50px;
  left: 50px;
  width: 200px;
  height: 100px;
  background: red;
  color: white;
  font-size: 20px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999999;
  border: 3px solid black;
`;

// Add it immediately when script loads
if (document.body) {
  document.body.appendChild(testDiv);
} else {
  // If body doesn't exist yet, wait for it
  document.addEventListener('DOMContentLoaded', () => {
    document.body.appendChild(testDiv);
  });
}

console.log('Red box should be visible now!'); 