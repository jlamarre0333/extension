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

// Test script to analyze citation detection issues
// This helps us understand why we're getting irrelevant results

// Sample transcript text similar to the video in the screenshot
const sampleTranscript = `
we're probably not welcome here it is not open to the public is there anyone who speaks English
this place doesn't appear on most maps it's like a secret country that's been erased from history
we're traveling through a region that most people have never heard of
the government doesn't want outsiders to know about this place
there are military checkpoints everywhere and photography is restricted
the people here speak a different language and have their own customs
this territory has been disputed for decades between different nations
the Bell tower in the distance marks the center of this hidden settlement
according to the National Institute of Standards and Technology this area measures exactly
we're trying to understand why this place has been kept secret for so long
the architecture here is unlike anything in the surrounding countries
local residents say their ancestors have lived here for centuries
but you won't find this place in any official government records
`;

// Load the citation detector patterns (simplified version for testing)
const patterns = {
  places: [
    /(?:visit|travel|go\s+to|from|in|at)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]*)*(?:\s+(?:City|State|Country|Province|Region|Island|Mountain|River|Lake|Beach|Park|National\s+Park|Monument))?)/gi,
    /(?:visit|see|at)\s+(Eiffel\s+Tower|Great\s+Wall|Statue\s+of\s+Liberty|Taj\s+Mahal|Colosseum|Pyramids|Stonehenge|Machu\s+Picchu|Grand\s+Canyon|Niagara\s+Falls|Times\s+Square|Central\s+Park|Golden\s+Gate\s+Bridge|Mount\s+Everest|Yellowstone|Yosemite)/gi,
    /(North\s+America|South\s+America|Europe|Asia|Africa|Australia|Antarctica|Middle\s+East|Southeast\s+Asia|Central\s+America)/gi,
    /(?:traveling|journey|trip)\s+(?:to|through|across)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]*)*)/gi
  ],
  companies: [
    /(National\s+Institute\s+of\s+Standards\s+and\s+Technology|Apple|Google|Microsoft|Amazon|Facebook|Meta|Tesla|Netflix|YouTube)/gi
  ],
  general: [
    /[""']([A-Z][^""']{10,})[""']/gi,
    /(?:the\s+work\s+of|work\s+by)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi
  ]
};

console.log('=== TESTING CITATION DETECTION ===');
console.log('Sample transcript:', sampleTranscript.substring(0, 200) + '...');
console.log('');

// Test each pattern type
for (const [type, typePatterns] of Object.entries(patterns)) {
  console.log(`--- Testing ${type} patterns ---`);
  
  for (let i = 0; i < typePatterns.length; i++) {
    const pattern = typePatterns[i];
    const matches = [...sampleTranscript.matchAll(pattern)];
    
    console.log(`Pattern ${i + 1}: ${pattern.source}`);
    console.log(`Matches found: ${matches.length}`);
    
    matches.forEach((match, idx) => {
      console.log(`  Match ${idx + 1}: "${match[1]}" (full: "${match[0]}")`);
    });
    console.log('');
  }
}

console.log('=== ANALYSIS ===');
console.log('The problem appears to be:');
console.log('1. Patterns are too broad and match random words');
console.log('2. No context awareness - matching "Bell tower" as "Bell" company');
console.log('3. Matching "National Institute of Standards and Technology" from a measurement context');
console.log('4. Need better filtering for what constitutes a meaningful citation vs casual mention'); 