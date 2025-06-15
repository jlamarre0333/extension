// Ultra simple test for global variable assignment
console.log('🚀 ULTRA SIMPLE TEST STARTING...');

// Test 1: Simple assignment
window.TEST_VAR = 'hello';
console.log('Test 1 - Simple assignment:', window.TEST_VAR);

// Test 2: Object assignment
window.TEST_OBJECT = { test: true };
console.log('Test 2 - Object assignment:', window.TEST_OBJECT);

// Test 3: Function assignment
window.TEST_FUNCTION = function() { return 'working'; };
console.log('Test 3 - Function assignment:', typeof window.TEST_FUNCTION);

// Test 4: Try to assign CitationHelpers
window.CitationHelpers = { 
  log: function(msg) { console.log('[Citation] ' + msg); },
  test: true 
};
console.log('Test 4 - CitationHelpers assignment:', window.CitationHelpers);

// Test 5: Immediate verification
console.log('Immediate check - window.CitationHelpers exists:', !!window.CitationHelpers);

// Test 6: Delayed verification
setTimeout(() => {
  console.log('After 500ms - window.CitationHelpers exists:', !!window.CitationHelpers);
  console.log('After 500ms - window.CitationHelpers value:', window.CitationHelpers);
}, 500);

console.log('🚀 ULTRA SIMPLE TEST COMPLETED'); 