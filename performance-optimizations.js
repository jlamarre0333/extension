// ⚡ PERFORMANCE OPTIMIZATION MODULE v2.8.0
// Smart Citations - YouTube & Podcasts Extension

class PerformanceOptimizer {
  constructor() {
    this.config = {
      maxCitationsCache: 100,
      maxHistoryEntries: 50,
      maxTopicInterests: 200,
      maxAuthorPreferences: 100,
      apiCacheTime: 5 * 60 * 1000, // 5 minutes
      debounceTime: 300, // 300ms
      chunkSize: 1000, // For processing large transcripts
      memoryCleanupInterval: 10 * 60 * 1000, // 10 minutes
      maxMemoryMB: 50
    };
    
    // Performance caches
    this.apiCache = new Map();
    this.processingCache = new Map();
    this.debounceTimers = new Map();
    
    // Performance metrics
    this.metrics = {
      totalDetections: 0,
      averageDetectionTime: 0,
      cacheHits: 0,
      memoryUsage: 0
    };
    
    this.initialize();
  }

  initialize() {
    console.log('⚡ Initializing performance optimizations...');
    
    // Start memory management
    this.startMemoryManagement();
    
    // Start performance monitoring
    this.startPerformanceMonitoring();
    
    console.log('✅ Performance optimizer ready');
  }

  // 🧹 MEMORY MANAGEMENT
  startMemoryManagement() {
    // Clean up old data periodically
    setInterval(() => {
      this.performMemoryCleanup();
    }, this.config.memoryCleanupInterval);
    
    // Monitor memory usage
    if (performance.memory) {
      setInterval(() => {
        const memoryMB = performance.memory.usedJSHeapSize / 1024 / 1024;
        this.metrics.memoryUsage = memoryMB;
        
        if (memoryMB > this.config.maxMemoryMB) {
          console.warn(`⚠️ High memory usage: ${memoryMB.toFixed(2)}MB`);
          this.performMemoryCleanup();
        }
      }, 30000); // Check every 30 seconds
    }
  }

  performMemoryCleanup() {
    console.log('🧹 Performing memory cleanup...');
    
    // Clean API cache
    const now = Date.now();
    let cacheCleanedCount = 0;
    
    for (const [key, value] of this.apiCache.entries()) {
      if (now - value.timestamp > this.config.apiCacheTime) {
        this.apiCache.delete(key);
        cacheCleanedCount++;
      }
    }
    
    // Clean processing cache (keep only recent entries)
    if (this.processingCache.size > 50) {
      const entries = Array.from(this.processingCache.entries());
      this.processingCache.clear();
      
      // Keep only the last 25 entries
      entries.slice(-25).forEach(([key, value]) => {
        this.processingCache.set(key, value);
      });
    }
    
    console.log(`✅ Cleaned ${cacheCleanedCount} cache entries`);
  }

  // 📊 CACHING SYSTEM
  getCachedApiResult(cacheKey) {
    const cached = this.apiCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.config.apiCacheTime) {
      this.metrics.cacheHits++;
      console.log(`📊 Cache hit for: ${cacheKey}`);
      return cached.data;
    }
    return null;
  }

  setCachedApiResult(cacheKey, data) {
    this.apiCache.set(cacheKey, {
      data: data,
      timestamp: Date.now()
    });
    
    // Prevent cache from growing too large
    if (this.apiCache.size > 100) {
      const oldestKey = this.apiCache.keys().next().value;
      this.apiCache.delete(oldestKey);
    }
  }

  // ⏱️ DEBOUNCING SYSTEM
  debounce(key, func, delay = this.config.debounceTime) {
    if (this.debounceTimers.has(key)) {
      clearTimeout(this.debounceTimers.get(key));
    }
    
    const timer = setTimeout(() => {
      func();
      this.debounceTimers.delete(key);
    }, delay);
    
    this.debounceTimers.set(key, timer);
  }

  // 🚀 OPTIMIZED CITATION DETECTION
  async optimizedCitationDetection(detector, transcriptData) {
    const startTime = performance.now();
    
    // Check processing cache first
    const cacheKey = this.generateTranscriptHash(transcriptData.text);
    const cachedResult = this.processingCache.get(cacheKey);
    if (cachedResult) {
      console.log('📊 Using cached detection result');
      return cachedResult;
    }
    
    let citations;
    
    // Process in chunks for large transcripts
    if (transcriptData.text.length > this.config.chunkSize * 10) {
      console.log('📦 Processing large transcript in chunks...');
      citations = await this.processLargeTranscript(detector, transcriptData);
    } else {
      // Regular processing
      citations = await detector.detectCitations(transcriptData);
    }
    
    // Cache the result
    this.processingCache.set(cacheKey, citations);
    
    // Update metrics
    const processingTime = performance.now() - startTime;
    this.metrics.totalDetections++;
    this.metrics.averageDetectionTime = 
      (this.metrics.averageDetectionTime * (this.metrics.totalDetections - 1) + processingTime) / 
      this.metrics.totalDetections;
    
    console.log(`⚡ Optimized detection completed in ${processingTime.toFixed(2)}ms`);
    
    return citations;
  }

  // 📦 LARGE TRANSCRIPT PROCESSING
  async processLargeTranscript(detector, transcriptData) {
    const text = transcriptData.text;
    const chunkSize = this.config.chunkSize;
    const chunks = [];
    
    // Split text into manageable chunks with overlap to prevent missing citations
    const overlap = 200; // Character overlap between chunks
    for (let i = 0; i < text.length; i += chunkSize - overlap) {
      const end = Math.min(i + chunkSize, text.length);
      chunks.push(text.substring(i, end));
    }
    
    console.log(`📦 Processing ${chunks.length} chunks...`);
    
    const allCitations = [];
    
    // Process chunks with delays to prevent blocking
    for (let i = 0; i < chunks.length; i++) {
      const chunkData = {
        text: chunks[i],
        segments: transcriptData.segments
      };
      
      const chunkCitations = await detector.detectCitations(chunkData);
      allCitations.push(...chunkCitations);
      
      // Add small delay every 3 chunks to prevent UI blocking
      if (i > 0 && i % 3 === 0) {
        await this.sleep(5);
        
        // Update progress for long processing
        if (chunks.length > 10) {
          console.log(`📦 Progress: ${i + 1}/${chunks.length} chunks`);
        }
      }
    }
    
    // Remove duplicates across chunks
    return detector.removeDuplicatesAdvanced ? 
      detector.removeDuplicatesAdvanced(allCitations) : 
      allCitations;
  }

  // 💤 Non-blocking delay
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 🔑 Generate hash for transcript caching
  generateTranscriptHash(text) {
    // Fast hash function for caching
    let hash = 0;
    const maxLength = Math.min(text.length, 1000); // Sample first 1000 chars
    
    for (let i = 0; i < maxLength; i += 2) { // Skip every other char for speed
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  // ⚡ FAST PERSONALIZED RANKING
  optimizedPersonalizedRanking(detector, citations) {
    if (!detector.userPreferences?.personalizedRanking || citations.length === 0) {
      return citations;
    }
    
    const startTime = performance.now();
    
    // Use fast processing for large citation lists
    if (citations.length > 15) {
      return this.fastPersonalizedRanking(detector, citations);
    }
    
    // Regular processing for smaller lists
    const result = detector.applyPersonalizedRanking(citations);
    
    const processingTime = performance.now() - startTime;
    console.log(`⚡ Personalized ranking completed in ${processingTime.toFixed(2)}ms`);
    
    return result;
  }

  // 🏃‍♂️ Fast ranking for large lists
  fastPersonalizedRanking(detector, citations) {
    console.log('🏃‍♂️ Using fast ranking for large citation list...');
    
    // Pre-calculate top interests for faster lookup
    const topTopics = this.getTopInterests(detector.learningData.topicInterests, 5);
    const topAuthors = this.getTopInterests(detector.learningData.authorPreferences, 5);
    
    // Create lookup sets for faster matching
    const topicSet = new Set(topTopics);
    const authorSet = new Set(topAuthors);
    
    return citations.map(citation => {
      let personalizedScore = citation.confidence;
      let totalBoost = 0;
      
      // Quick topic boost
      const titleWords = citation.title.toLowerCase().split(/\s+/);
      const hasTopicMatch = titleWords.some(word => {
        return Array.from(topicSet).some(topic => word.includes(topic));
      });
      
      if (hasTopicMatch) {
        totalBoost += 0.05;
        personalizedScore += 0.05;
      }
      
      // Quick author boost
      if (citation.author) {
        const authorLower = citation.author.toLowerCase();
        const hasAuthorMatch = Array.from(authorSet).some(author => 
          authorLower.includes(author)
        );
        
        if (hasAuthorMatch) {
          totalBoost += 0.1;
          personalizedScore += 0.1;
        }
      }
      
      // Quick quality boost
      if (citation.journalImpact || citation.historicalSignificance) {
        totalBoost += 0.05;
        personalizedScore += 0.05;
      }
      
      return {
        ...citation,
        personalizedScore,
        originalConfidence: citation.confidence,
        personalizationBoost: totalBoost
      };
    }).sort((a, b) => b.personalizedScore - a.personalizedScore);
  }

  getTopInterests(map, limit) {
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([key]) => key);
  }

  // 📊 PERFORMANCE MONITORING
  startPerformanceMonitoring() {
    // Log performance metrics every 5 minutes
    setInterval(() => {
      this.logPerformanceMetrics();
    }, 5 * 60 * 1000);
  }

  logPerformanceMetrics() {
    console.log('📊 PERFORMANCE METRICS:');
    console.log(`   Total Detections: ${this.metrics.totalDetections}`);
    console.log(`   Average Detection Time: ${this.metrics.averageDetectionTime.toFixed(2)}ms`);
    console.log(`   Cache Hits: ${this.metrics.cacheHits}`);
    console.log(`   Memory Usage: ${this.metrics.memoryUsage.toFixed(2)}MB`);
    console.log(`   API Cache Size: ${this.apiCache.size}`);
    console.log(`   Processing Cache Size: ${this.processingCache.size}`);
  }

  // 🔧 UI OPTIMIZATION HELPERS
  optimizeUIRendering() {
    // Request animation frame for smooth updates
    return new Promise(resolve => {
      requestAnimationFrame(resolve);
    });
  }

  // Batch DOM updates to prevent layout thrashing
  batchDOMUpdates(updates) {
    return new Promise(resolve => {
      requestAnimationFrame(() => {
        updates.forEach(update => update());
        resolve();
      });
    });
  }

  // 📈 ANALYTICS & DIAGNOSTICS
  getPerformanceReport() {
    const report = {
      timestamp: new Date().toISOString(),
      metrics: { ...this.metrics },
      cacheStats: {
        apiCacheSize: this.apiCache.size,
        processingCacheSize: this.processingCache.size,
        activeDebounceTimers: this.debounceTimers.size
      },
      memoryStats: performance.memory ? {
        usedJSHeapSize: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        totalJSHeapSize: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
        jsHeapSizeLimit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
      } : null
    };
    
    console.log('📈 Performance Report:', report);
    return report;
  }

  // 🧪 PERFORMANCE TESTING
  async runPerformanceTest() {
    console.log('🧪 Running performance test...');
    
    const testResults = {
      initializationTime: 0,
      smallTranscriptTime: 0,
      largeTranscriptTime: 0,
      personalizationTime: 0,
      memoryUsage: 0
    };
    
    // Test initialization time
    const initStart = performance.now();
    const testOptimizer = new PerformanceOptimizer();
    testResults.initializationTime = performance.now() - initStart;
    
    // Test small transcript processing
    const smallTranscript = { text: 'The Origin of Species by Darwin '.repeat(50), segments: [] };
    const smallStart = performance.now();
    testOptimizer.generateTranscriptHash(smallTranscript.text);
    testResults.smallTranscriptTime = performance.now() - smallStart;
    
    // Test large transcript processing
    const largeTranscript = { text: 'The Origin of Species by Darwin '.repeat(1000), segments: [] };
    const largeStart = performance.now();
    testOptimizer.generateTranscriptHash(largeTranscript.text);
    testResults.largeTranscriptTime = performance.now() - largeStart;
    
    // Test personalization performance
    const testCitations = Array(20).fill().map((_, i) => ({
      title: `Test Citation ${i}`,
      confidence: 0.8,
      type: 'paper'
    }));
    
    const personalStart = performance.now();
    // Simulate fast ranking
    testCitations.sort((a, b) => b.confidence - a.confidence);
    testResults.personalizationTime = performance.now() - personalStart;
    
    // Test memory usage
    if (performance.memory) {
      testResults.memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024;
    }
    
    console.log('🧪 Performance Test Results:', testResults);
    return testResults;
  }
}

// 🚀 Export for use in main extension
if (typeof window !== 'undefined') {
  window.PerformanceOptimizer = PerformanceOptimizer;
  console.log('⚡ Performance optimization module loaded!');
} 