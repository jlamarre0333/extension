// Citation Cross-Reference Extension - Test Runner
// Run this in the browser console to test extension accuracy

console.log('🧪 Citation Cross-Reference Test Runner Loaded');
console.log('===============================================');
console.log('');
console.log('Available Commands:');
console.log('  🎯 CitationCrossReference.runAccuracyTests() - Run full accuracy test suite');
console.log('  📝 CitationCrossReference.testTranscript() - Test transcript extraction');
console.log('  🔍 CitationCrossReference.testDetection() - Test citation detection');
console.log('  📊 runQuickTest() - Run a quick validation test');
console.log('  🎬 testVideoRecommendations() - Test video recommendation system');
console.log('');

// Quick test function for immediate validation
window.runQuickTest = async function() {
  console.log('🚀 Running Quick Validation Test...');
  console.log('===================================');
  
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };
  
  // Test 1: Extension loaded
  try {
    const extensionLoaded = window.CitationCrossReference && window.CitationCrossReference.initialized;
    results.tests.push({ name: 'Extension loaded', passed: extensionLoaded });
    if (extensionLoaded) results.passed++; else results.failed++;
    console.log(`✅ Extension loaded: ${extensionLoaded ? 'PASS' : 'FAIL'}`);
  } catch (error) {
    results.tests.push({ name: 'Extension loaded', passed: false, error: error.message });
    results.failed++;
    console.log(`❌ Extension loaded: FAIL - ${error.message}`);
  }
  
  // Test 2: Video ID detection
  try {
    const videoId = getCurrentVideoId();
    const hasVideoId = videoId && videoId.length > 5;
    results.tests.push({ name: 'Video ID detection', passed: hasVideoId });
    if (hasVideoId) results.passed++; else results.failed++;
    console.log(`✅ Video ID detection: ${hasVideoId ? 'PASS' : 'FAIL'} (${videoId || 'none'})`);
  } catch (error) {
    results.tests.push({ name: 'Video ID detection', passed: false, error: error.message });
    results.failed++;
    console.log(`❌ Video ID detection: FAIL - ${error.message}`);
  }
  
  // Test 3: Citation detection patterns
  try {
    const testText = `I recommend reading "Sapiens" by Yuval Noah Harari. The study published in Nature shows interesting results. Watch the documentary 'Free Solo' about climbing.`;
    const citations = window.CitationCrossReference.detector.detectCitations({ text: testText });
    const hasDetections = citations && citations.length >= 2;
    results.tests.push({ name: 'Citation detection', passed: hasDetections, details: `Found ${citations?.length || 0} citations` });
    if (hasDetections) results.passed++; else results.failed++;
    console.log(`✅ Citation detection: ${hasDetections ? 'PASS' : 'FAIL'} (found ${citations?.length || 0} citations)`);
  } catch (error) {
    results.tests.push({ name: 'Citation detection', passed: false, error: error.message });
    results.failed++;
    console.log(`❌ Citation detection: FAIL - ${error.message}`);
  }
  
  // Test 4: Video recommendations
  try {
    const videos = generateEducationalVideoSuggestions('quantum mechanics');
    const hasVideos = videos && videos.length > 0;
    const hasValidUrls = videos.every(v => v.url && v.url.includes('youtube.com'));
    const passed = hasVideos && hasValidUrls;
    results.tests.push({ name: 'Video recommendations', passed, details: `Generated ${videos?.length || 0} videos` });
    if (passed) results.passed++; else results.failed++;
    console.log(`✅ Video recommendations: ${passed ? 'PASS' : 'FAIL'} (generated ${videos?.length || 0} videos)`);
  } catch (error) {
    results.tests.push({ name: 'Video recommendations', passed: false, error: error.message });
    results.failed++;
    console.log(`❌ Video recommendations: FAIL - ${error.message}`);
  }
  
  // Test 5: UI elements
  try {
    const sidebar = document.querySelector('[data-citation-sidebar]');
    const toggleButton = document.querySelector('[data-citation-toggle]');
    const hasUI = sidebar && toggleButton;
    results.tests.push({ name: 'UI elements', passed: hasUI });
    if (hasUI) results.passed++; else results.failed++;
    console.log(`✅ UI elements: ${hasUI ? 'PASS' : 'FAIL'}`);
  } catch (error) {
    results.tests.push({ name: 'UI elements', passed: false, error: error.message });
    results.failed++;
    console.log(`❌ UI elements: FAIL - ${error.message}`);
  }
  
  // Summary
  const accuracy = results.passed + results.failed > 0 ? (results.passed / (results.passed + results.failed) * 100).toFixed(1) : 0;
  console.log('');
  console.log('📊 QUICK TEST SUMMARY:');
  console.log(`  🎯 Accuracy: ${accuracy}%`);
  console.log(`  ✅ Passed: ${results.passed}/${results.passed + results.failed}`);
  console.log(`  ❌ Failed: ${results.failed}`);
  
  if (parseFloat(accuracy) >= 80) {
    console.log('  🎉 Extension is working well!');
  } else {
    console.log('  ⚠️  Extension needs attention');
  }
  
  return results;
};

// Test video recommendations specifically
window.testVideoRecommendations = function() {
  console.log('🎬 Testing Video Recommendation System...');
  console.log('=========================================');
  
  const testQueries = [
    'quantum mechanics',
    'Einstein relativity', 
    'Sapiens Harari',
    'atomic habits',
    'Free Solo documentary'
  ];
  
  testQueries.forEach(query => {
    try {
      const videos = generateEducationalVideoSuggestions(query);
      console.log(`\n📺 Query: "${query}"`);
      console.log(`   Found: ${videos.length} videos`);
      
      videos.forEach((video, index) => {
        console.log(`   ${index + 1}. ${video.title}`);
        console.log(`      Channel: ${video.channel} | Rating: ${video.rating} | Category: ${video.category}`);
        console.log(`      URL: ${video.url}`);
      });
    } catch (error) {
      console.log(`❌ Error testing "${query}": ${error.message}`);
    }
  });
};

// Performance benchmark
window.runPerformanceBenchmark = async function() {
  console.log('⚡ Running Performance Benchmark...');
  console.log('===================================');
  
  const testText = `
    I highly recommend reading "Sapiens" by Yuval Noah Harari, which explores the history of humanity. 
    The research published in Nature journal about climate change is fascinating. 
    Einstein's theory of relativity revolutionized our understanding of physics.
    Watch the documentary 'Free Solo' about Alex Honnold's incredible climbing achievement.
    The study from Science magazine confirms these findings.
    Quantum mechanics and quantum entanglement are complex topics.
    "Atomic Habits" by James Clear provides practical advice for behavior change.
  `;
  
  // Benchmark citation detection
  const startTime = performance.now();
  const citations = window.CitationCrossReference.detector.detectCitations({ text: testText });
  const detectionTime = performance.now() - startTime;
  
  // Benchmark video recommendations
  const videoStartTime = performance.now();
  const videos = generateEducationalVideoSuggestions('quantum mechanics');
  const videoTime = performance.now() - videoStartTime;
  
  console.log('📊 Performance Results:');
  console.log(`  🔍 Citation Detection: ${detectionTime.toFixed(2)}ms (found ${citations.length} citations)`);
  console.log(`  🎬 Video Recommendations: ${videoTime.toFixed(2)}ms (generated ${videos.length} videos)`);
  console.log(`  📈 Total Processing Time: ${(detectionTime + videoTime).toFixed(2)}ms`);
  
  // Performance targets
  const targetDetectionTime = 100; // 100ms
  const targetVideoTime = 50; // 50ms
  
  console.log('\n🎯 Performance Targets:');
  console.log(`  Citation Detection: ${detectionTime <= targetDetectionTime ? '✅ PASS' : '⚠️ SLOW'} (target: <${targetDetectionTime}ms)`);
  console.log(`  Video Recommendations: ${videoTime <= targetVideoTime ? '✅ PASS' : '⚠️ SLOW'} (target: <${targetVideoTime}ms)`);
  
  return {
    detectionTime,
    videoTime,
    citationsFound: citations.length,
    videosGenerated: videos.length
  };
};

console.log('🎯 Test Runner Ready! Try: runQuickTest()'); 