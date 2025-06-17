// 🧪 COMPREHENSIVE PERSONALIZATION TESTING SUITE v2.8.0
// Smart Citations - YouTube & Podcasts Extension

// 🧠 Test Personalization & Learning System
function testPersonalizationSystem() {
  console.log('🧠 Testing Personalization & Learning System v2.8.0...');
  console.log('='.repeat(60));
  
  if (typeof detector === 'undefined') {
    console.log('❌ Detector not initialized');
    return;
  }
  
  const results = {
    userPreferences: false,
    learningData: false,
    citationTracking: false,
    personalizedRanking: false,
    smartRecommendations: false,
    uiControls: false,
    multilanguage: false
  };
  
  // Test 1: User Preferences System
  console.log('\n🔧 Testing User Preferences...');
  try {
    const prefs = detector.userPreferences;
    if (prefs && prefs.version === '2.8.0' && prefs.learningMode !== undefined) {
      results.userPreferences = true;
      console.log('✅ User preferences loaded correctly');
      console.log(`   Learning Mode: ${prefs.learningMode}`);
      console.log(`   Personalized Ranking: ${prefs.personalizedRanking}`);
      console.log(`   Show Language Badges: ${prefs.showLanguageBadges}`);
    } else {
      console.log('❌ User preferences not properly initialized');
    }
  } catch (error) {
    console.log('❌ Error testing user preferences:', error.message);
  }
  
  // Test 2: Learning Data Storage
  console.log('\n📊 Testing Learning Data...');
  try {
    const learning = detector.learningData;
    if (learning && learning.topicInterests instanceof Map) {
      results.learningData = true;
      console.log('✅ Learning data structures initialized');
      console.log(`   Topic Interests: ${learning.topicInterests.size} entries`);
      console.log(`   Author Preferences: ${learning.authorPreferences.size} entries`);
      console.log(`   Field Weights: ${learning.fieldWeights.size} entries`);
    } else {
      console.log('❌ Learning data not properly initialized');
    }
  } catch (error) {
    console.log('❌ Error testing learning data:', error.message);
  }
  
  // Test 3: Citation Tracking
  console.log('\n📈 Testing Citation Tracking...');
  try {
    const testCitation = {
      title: 'Test Paper on Quantum Physics and Relativity',
      author: 'Albert Einstein',
      type: 'paper',
      confidence: 0.95
    };
    
    const beforeInteractions = detector.userHistory.totalInteractions;
    const beforeTopics = detector.learningData.topicInterests.size;
    
    // Simulate user interactions
    detector.recordCitationView(testCitation);
    detector.recordCitationClick(testCitation, 'test_link');
    
    const afterInteractions = detector.userHistory.totalInteractions;
    const afterTopics = detector.learningData.topicInterests.size;
    
    if (afterInteractions > beforeInteractions && afterTopics >= beforeTopics) {
      results.citationTracking = true;
      console.log('✅ Citation tracking working');
      console.log(`   Interactions increased: ${beforeInteractions} → ${afterInteractions}`);
      console.log(`   Topics learned: ${beforeTopics} → ${afterTopics}`);
    } else {
      console.log('❌ Citation tracking not working properly');
    }
  } catch (error) {
    console.log('❌ Error testing citation tracking:', error.message);
  }
  
  // Test 4: Personalized Ranking
  console.log('\n🎯 Testing Personalized Ranking...');
  try {
    const testCitations = [
      { title: 'Random Biology Paper', confidence: 0.8, type: 'paper', author: 'Unknown Author' },
      { title: 'Quantum Physics Research by Einstein', confidence: 0.7, type: 'paper', author: 'Albert Einstein' },
      { title: 'General Chemistry Book', confidence: 0.6, type: 'book', author: 'Chemistry Author' }
    ];
    
    const rankedCitations = detector.applyPersonalizedRanking(testCitations);
    const hasPersonalizedBoosts = rankedCitations.some(c => c.personalizationBoost && c.personalizationBoost > 0);
    
    if (hasPersonalizedBoosts) {
      results.personalizedRanking = true;
      console.log('✅ Personalized ranking applying boosts');
      rankedCitations.forEach((c, i) => {
        const boost = c.personalizationBoost || 0;
        console.log(`   ${i+1}. "${c.title.substring(0, 30)}..." (+${(boost * 100).toFixed(1)}%)`);
      });
    } else {
      console.log('⚠️ Personalized ranking not applying significant boosts (may be normal for new users)');
    }
  } catch (error) {
    console.log('❌ Error testing personalized ranking:', error.message);
  }
  
  // Test 5: Smart Recommendations
  console.log('\n💡 Testing Smart Recommendations...');
  try {
    const testCitations = [
      { title: 'Physics Paper', type: 'paper', author: 'Einstein' },
      { title: 'Quantum Mechanics Book', type: 'book', author: 'Feynman' }
    ];
    
    const recommendations = detector.generateSmartRecommendations(testCitations);
    
    if (recommendations && recommendations.length > 0) {
      results.smartRecommendations = true;
      console.log('✅ Smart recommendations generated');
      recommendations.forEach((rec, i) => {
        console.log(`   ${i+1}. ${rec.title} (${rec.items.length} items)`);
      });
    } else {
      console.log('⚠️ No smart recommendations generated (normal for limited data)');
    }
  } catch (error) {
    console.log('❌ Error testing smart recommendations:', error.message);
  }
  
  // Test 6: UI Controls
  console.log('\n🎮 Testing UI Controls...');
  try {
    const hasToggleFunctions = [
      'toggleLearningMode',
      'togglePersonalizedRanking', 
      'toggleLanguageBadges',
      'resetPersonalization'
    ].every(func => typeof detector[func] === 'function');
    
    const hasPanelFunction = typeof detector.createPersonalizationPanel === 'function';
    
    if (hasToggleFunctions && hasPanelFunction) {
      results.uiControls = true;
      console.log('✅ UI control functions available');
      console.log('   Toggle functions: ✅');
      console.log('   Panel creation: ✅');
    } else {
      console.log('❌ Some UI control functions missing');
    }
  } catch (error) {
    console.log('❌ Error testing UI controls:', error.message);
  }
  
  // Test 7: Multi-language Integration
  console.log('\n🌍 Testing Multi-language Integration...');
  try {
    const spanishText = 'Este es un libro llamado "El Origen de las Especies"';
    const detectedLang = detector.detectLanguage(spanishText);
    const spanishPatterns = detector.getMultiLanguageCitationPatterns('es');
    
    if (detectedLang === 'es' && spanishPatterns.length > 0) {
      results.multilanguage = true;
      console.log('✅ Multi-language support working');
      console.log(`   Detected language: ${detectedLang}`);
      console.log(`   Spanish patterns available: ${spanishPatterns.length}`);
    } else {
      console.log('❌ Multi-language support not working properly');
    }
  } catch (error) {
    console.log('❌ Error testing multi-language support:', error.message);
  }
  
  // Summary
  console.log('\n📊 PERSONALIZATION TEST SUMMARY');
  console.log('='.repeat(40));
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  const successRate = (passedTests / totalTests * 100).toFixed(1);
  
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}`);
  });
  
  console.log(`\n🎯 Overall Success Rate: ${passedTests}/${totalTests} (${successRate}%)`);
  
  if (successRate >= 85) {
    console.log('🎉 EXCELLENT - Personalization system ready for production!');
  } else if (successRate >= 70) {
    console.log('✅ GOOD - Minor issues to address');
  } else {
    console.log('⚠️ NEEDS WORK - Several components need attention');
  }
  
  return results;
}

// 🚀 Quick System Status Check
function personalizationStatus() {
  console.log('🧠 Smart Citations v2.8.0 - Personalization Status');
  console.log('Extension:', typeof detector !== 'undefined' ? 'Loaded ✅' : 'Not Loaded ❌');
  
  if (typeof detector !== 'undefined') {
    console.log('Learning Mode:', detector.userPreferences?.learningMode ? 'ON ✅' : 'OFF ⚠️');
    console.log('Personalized Ranking:', detector.userPreferences?.personalizedRanking ? 'ON ✅' : 'OFF ⚠️');
    console.log('Total Interactions:', detector.userHistory?.totalInteractions || 0);
    console.log('Topics Learned:', detector.learningData?.topicInterests?.size || 0);
    console.log('Preferred Authors:', detector.learningData?.authorPreferences?.size || 0);
    
    if (typeof window !== 'undefined' && window.currentCitations) {
      const personalized = window.currentCitations.filter(c => c.personalizationBoost > 0.01).length;
      console.log('Current Citations:', window.currentCitations.length);
      console.log('Personalized Citations:', personalized);
    }
  }
}

// 📊 Performance Benchmark Test
function testSystemPerformance() {
  console.log('⚡ Testing System Performance...');
  
  if (typeof detector === 'undefined') {
    console.log('❌ Detector not initialized');
    return;
  }
  
  const results = {
    loadTime: 0,
    detectionSpeed: 0,
    personalizationSpeed: 0,
    memoryUsage: 0
  };
  
  // Test 1: Extension Load Time
  const startTime = performance.now();
  const testDetector = new EnhancedCitationDetector();
  const loadTime = performance.now() - startTime;
  results.loadTime = loadTime;
  console.log(`📊 Extension Load Time: ${loadTime.toFixed(2)}ms`);
  
  // Test 2: Citation Detection Speed
  const longTranscript = {
    text: 'The Origin of Species by Darwin. Sapiens by Harari. Einstein relativity paper. '.repeat(50),
    segments: []
  };
  
  const detectionStart = performance.now();
  detector.detectCitations(longTranscript).then(() => {
    const detectionTime = performance.now() - detectionStart;
    results.detectionSpeed = detectionTime;
    console.log(`📊 Citation Detection Speed: ${detectionTime.toFixed(2)}ms`);
  });
  
  // Test 3: Personalization Speed
  const testCitations = Array(20).fill().map((_, i) => ({
    title: `Test Citation ${i}`,
    type: 'paper',
    confidence: 0.8,
    author: `Author ${i}`
  }));
  
  const personalizationStart = performance.now();
  detector.applyPersonalizedRanking(testCitations);
  const personalizationTime = performance.now() - personalizationStart;
  results.personalizationSpeed = personalizationTime;
  console.log(`📊 Personalization Speed: ${personalizationTime.toFixed(2)}ms`);
  
  // Test 4: Memory Usage
  if (performance.memory) {
    results.memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024; // MB
    console.log(`📊 Memory Usage: ${results.memoryUsage.toFixed(2)}MB`);
  }
  
  return results;
}

// Export functions for browser console
if (typeof window !== 'undefined') {
  window.testPersonalizationSystem = testPersonalizationSystem;
  window.personalizationStatus = personalizationStatus;
  window.testSystemPerformance = testSystemPerformance;
  
  console.log('🧪 Personalization testing suite loaded!');
  console.log('Available functions:');
  console.log('- testPersonalizationSystem()');
  console.log('- personalizationStatus()');
  console.log('- testSystemPerformance()');
} 