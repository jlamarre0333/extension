// Test Citation Detection - Load this in browser console on YouTube

console.log('🔍 Testing Citation Detection...');

// Check if extension components are loaded
console.log('Extension Components:');
console.log('- CitationHelpers:', window.CitationHelpers ? '✅' : '❌');
console.log('- TranscriptParser:', window.TranscriptParser ? '✅' : '❌');
console.log('- CitationDetector:', window.CitationDetector ? '✅' : '❌');
console.log('- UIInjector:', window.UIInjector ? '✅' : '❌');

// Check if UI elements exist
const sidebar = document.getElementById('citation-sidebar');
const toggleButton = document.querySelector('.sidebar-toggle');

console.log('UI Elements:');
console.log('- Sidebar:', sidebar ? '✅ Found' : '❌ Missing');
console.log('- Toggle Button:', toggleButton ? '✅ Found' : '❌ Missing');

// Test citation detection with sample text
if (window.CitationDetector) {
  console.log('\n📚 Testing Citation Detection...');
  
  const testTexts = [
    "I recommend reading the book called 'Atomic Habits' by James Clear",
    "There's a great study published in Nature about climate change",
    "Check out the video 'How to Learn Anything' on YouTube",
    "The research paper 'Deep Learning' by Goodfellow is excellent"
  ];
  
  testTexts.forEach(async (text, index) => {
    console.log(`\nTest ${index + 1}: "${text}"`);
    try {
      const citations = await window.CitationDetector.analyzeText(text, 0);
      console.log(`Found ${citations.length} citations:`, citations);
    } catch (error) {
      console.error('Error:', error);
    }
  });
}

// Show instructions
console.log('\n📋 How to see citations:');
console.log('1. Go to a YouTube video with captions/transcript');
console.log('2. Look for a floating 📚 button on the right side');
console.log('3. Click the button to open the citations sidebar');
console.log('4. Citations should appear as the video plays');
console.log('\n💡 Try videos that mention books, studies, or other videos!'); 