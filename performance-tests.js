// ⚡ PERFORMANCE TESTING SUITE v2.8.0
// Smart Citations - YouTube & Podcasts Extension

class PerformanceTestSuite {
  constructor() {
    this.benchmarks = {
      extensionLoad: 500,    // ms
      detectionSpeed: 2000,  // ms
      personalizationSpeed: 100, // ms
      memoryUsage: 50        // MB
    };
  }

  async runOptimizationTest() {
    console.log('🧪 Starting optimization performance test...');
    
    const results = {
      timestamp: new Date().toISOString(),
      tests: []
    };

    // Test 1: Extension Initialization
    console.log('📊 Testing extension initialization...');
    const initTest = await this.testInitialization();
    results.tests.push(initTest);

    // Test 2: Citation Detection
    console.log('📊 Testing citation detection performance...');
    const detectionTest = await this.testDetection();
    results.tests.push(detectionTest);

    // Test 3: Personalization Speed
    console.log('📊 Testing personalization performance...');
    const personalizationTest = await this.testPersonalization();
    results.tests.push(personalizationTest);

    // Test 4: Memory Usage
    console.log('📊 Testing memory usage...');
    const memoryTest = await this.testMemory();
    results.tests.push(memoryTest);

    this.displayResults(results);
    return results;
  }

  async testInitialization() {
    const startTime = performance.now();
    
    try {
      const detector = new EnhancedCitationDetector();
      const optimizer = new PerformanceOptimizer();
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      return {
        name: 'Extension Initialization',
        duration: duration,
        passed: duration < this.benchmarks.extensionLoad,
        score: Math.max(0, 100 - (duration / this.benchmarks.extensionLoad) * 100)
      };
    } catch (error) {
      return {
        name: 'Extension Initialization',
        duration: 0,
        passed: false,
        score: 0,
        error: error.message
      };
    }
  }

  async testDetection() {
    const detector = new EnhancedCitationDetector();
    const testText = {
      text: 'Einstein published his theory of relativity in 1905. The book "Origin of Species" by Darwin is groundbreaking. The study published in Nature (2023) showed significant results.',
      segments: []
    };

    const startTime = performance.now();
    
    try {
      const citations = await detector.detectCitations(testText);
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      return {
        name: 'Citation Detection',
        duration: duration,
        passed: duration < this.benchmarks.detectionSpeed,
        score: Math.max(0, 100 - (duration / this.benchmarks.detectionSpeed) * 100),
        citationsFound: citations.length
      };
    } catch (error) {
      return {
        name: 'Citation Detection',
        duration: 0,
        passed: false,
        score: 0,
        error: error.message
      };
    }
  }

  async testPersonalization() {
    const detector = new EnhancedCitationDetector();
    const testCitations = Array(20).fill().map((_, i) => ({
      title: `Test Citation ${i}`,
      author: `Author ${i % 5}`,
      type: 'paper',
      confidence: 0.8,
      language: 'en'
    }));

    const startTime = performance.now();
    
    try {
      const ranked = detector.applyPersonalizedRanking(testCitations);
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      return {
        name: 'Personalization',
        duration: duration,
        passed: duration < this.benchmarks.personalizationSpeed,
        score: Math.max(0, 100 - (duration / this.benchmarks.personalizationSpeed) * 100),
        citationsProcessed: testCitations.length
      };
    } catch (error) {
      return {
        name: 'Personalization',
        duration: 0,
        passed: false,
        score: 0,
        error: error.message
      };
    }
  }

  async testMemory() {
    if (!performance.memory) {
      return {
        name: 'Memory Usage',
        duration: 0,
        passed: false,
        score: 0,
        error: 'Memory API not available'
      };
    }

    const initialMemory = performance.memory.usedJSHeapSize;
    
    // Create some load
    const detector = new EnhancedCitationDetector();
    const optimizer = new PerformanceOptimizer();
    
    const finalMemory = performance.memory.usedJSHeapSize;
    const memoryUsed = (finalMemory - initialMemory) / 1024 / 1024; // MB
    
    return {
      name: 'Memory Usage',
      duration: memoryUsed,
      passed: memoryUsed < this.benchmarks.memoryUsage,
      score: Math.max(0, 100 - (memoryUsed / this.benchmarks.memoryUsage) * 100),
      memoryIncrease: `${memoryUsed.toFixed(2)}MB`
    };
  }

  displayResults(results) {
    const overallScore = results.tests.reduce((sum, test) => sum + (test.score || 0), 0) / results.tests.length;
    const performance_rating = overallScore >= 80 ? 'Excellent' : overallScore >= 60 ? 'Good' : 'Needs Improvement';
    
    console.log('🏆 OPTIMIZATION TEST RESULTS');
    console.log('='.repeat(40));
    console.log(`Overall Score: ${overallScore.toFixed(1)}/100 (${performance_rating})`);
    console.log('');

    results.tests.forEach(test => {
      const status = test.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${test.name}: ${test.duration.toFixed(2)}ms (Score: ${(test.score || 0).toFixed(1)})`);
      if (test.error) console.log(`   Error: ${test.error}`);
      if (test.citationsFound) console.log(`   Citations Found: ${test.citationsFound}`);
      if (test.citationsProcessed) console.log(`   Citations Processed: ${test.citationsProcessed}`);
      if (test.memoryIncrease) console.log(`   Memory Increase: ${test.memoryIncrease}`);
    });

    return { overallScore, performance_rating, tests: results.tests };
  }

  async quickCheck() {
    console.log('⚡ Quick performance check...');
    
    const startTime = performance.now();
    const detector = new EnhancedCitationDetector();
    const endTime = performance.now();
    
    const initTime = endTime - startTime;
    const memoryMB = performance.memory ? (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2) : 'N/A';
    
    console.log(`⚡ Init: ${initTime.toFixed(2)}ms | Memory: ${memoryMB}MB`);
    return { initTime, memoryMB };
  }
}

// Global access
if (typeof window !== 'undefined') {
  window.PerformanceTestSuite = PerformanceTestSuite;
  window.testOptimizations = async () => {
    const suite = new PerformanceTestSuite();
    return await suite.runOptimizationTest();
  };
  window.quickPerfCheck = async () => {
    const suite = new PerformanceTestSuite();
    return await suite.quickCheck();
  };
  console.log('🧪 Performance Testing Suite loaded!');
} 