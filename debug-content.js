// Debug Content Script for Citation Cross-Reference Extension

console.log('🔍 Debug content script loaded');

// Check if all dependencies are loaded
setTimeout(() => {
  console.log('🔍 Checking dependencies...');
  console.log('CitationHelpers:', window.CitationHelpers ? '✅' : '❌');
  console.log('TranscriptParser:', window.TranscriptParser ? '✅' : '❌');
  console.log('CitationDetector:', window.CitationDetector ? '✅' : '❌');
  console.log('UIInjector:', window.UIInjector ? '✅' : '❌');
  
  // Test citation detection with simple text
  if (window.CitationDetector) {
    console.log('🔍 Testing citation detection...');
    const testText = 'In his book "Sapiens" by Yuval Noah Harari, the author discusses human evolution.';
    window.CitationDetector.analyzeText(testText, 0).then(citations => {
      console.log('🔍 Test citations found:', citations);
    });
  }
  
  // Check if we're on YouTube
  if (window.CitationHelpers) {
    const isYT = window.CitationHelpers.isYouTubeVideoPage();
    const videoId = window.CitationHelpers.getYouTubeVideoId();
    console.log('🔍 YouTube page:', isYT);
    console.log('🔍 Video ID:', videoId);
  }
  
  // Try to inject UI
  if (window.UIInjector) {
    console.log('🔍 Initializing UI...');
    window.UIInjector.init().then(() => {
      console.log('🔍 UI initialized');
    }).catch(err => {
      console.error('🔍 UI initialization failed:', err);
    });
  }
  
  // Try to get transcript
  if (window.TranscriptParser && window.CitationHelpers && window.CitationHelpers.isYouTubeVideoPage()) {
    console.log('🔍 Attempting to get transcript...');
    window.TranscriptParser.getTranscript().then(transcript => {
      console.log('🔍 Transcript loaded:', transcript ? transcript.length + ' segments' : 'null');
      if (transcript && transcript.length > 0) {
        console.log('🔍 First segment:', transcript[0]);
        
        // Test citation detection on transcript
        const fullText = transcript.map(s => s.text).join(' ');
        console.log('🔍 Full transcript text (first 200 chars):', fullText.substring(0, 200));
        
        window.CitationDetector.analyzeText(fullText, 0).then(citations => {
          console.log('🔍 Citations found in transcript:', citations);
        });
      }
    }).catch(err => {
      console.error('🔍 Transcript loading failed:', err);
    });
  }
}, 2000);

// Add a manual test button
setTimeout(() => {
  if (window.CitationHelpers && window.CitationHelpers.isYouTubeVideoPage()) {
    const testButton = document.createElement('button');
    testButton.textContent = '🔍 Test Citations';
    testButton.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      z-index: 10001;
      background: #ff0000;
      color: white;
      border: none;
      padding: 10px;
      border-radius: 5px;
      cursor: pointer;
    `;
    
    testButton.onclick = () => {
      console.log('🔍 Manual test triggered');
      
      // Test with hardcoded text
      const testText = `
        In his book "Sapiens: A Brief History of Humankind", Yuval Noah Harari discusses evolution.
        The study published in Nature journal shows climate change effects.
        There's a great TED talk called "The Power of Vulnerability" by Brené Brown.
      `;
      
      if (window.CitationDetector) {
        window.CitationDetector.analyzeText(testText, 0).then(citations => {
          console.log('🔍 Manual test citations:', citations);
          alert(`Found ${citations.length} citations. Check console for details.`);
        });
      } else {
        alert('CitationDetector not available');
      }
    };
    
    document.body.appendChild(testButton);
    console.log('🔍 Test button added');
  }
}, 3000); 