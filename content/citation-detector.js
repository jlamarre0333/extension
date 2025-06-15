// Citation Detection Engine for Citation Cross-Reference Extension

class CitationDetector {
  constructor() {
    this.patterns = this.initializePatterns();
    this.detectedCitations = [];
    this.observers = [];
  }

  /**
   * Initialize detection patterns for different types of citations
   */
  initializePatterns() {
    return {
      books: [
        // "book called 'Title'" or "book titled 'Title'"
        /(?:book|novel|memoir|biography)(?:\s+called|\s+titled|\s+named)?\s*[""']([^""']+)[""']/gi,
        // "'Title' by Author"
        /[""']([^""']+)[""']\s+by\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
        // "Author wrote 'Title'"
        /(?:author|writer)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:wrote|published)\s+[""']([^""']+)[""']/gi,
        // "in his book 'Title'"
        /(?:in|from)\s+(?:his|her|their)?\s*(?:book|novel)\s+[""']([^""']+)[""']/gi,
        // "the book 'Title'"
        /(?:the|this)\s+book\s+[""']([^""']+)[""']/gi
      ],
      papers: [
        // "study published in Journal"
        /(?:study|research|paper|article)\s+(?:published\s+)?(?:in\s+)?(?:the\s+)?([A-Z][^.!?]+(?:Journal|Review|Science|Nature|Cell|PNAS))/gi,
        // "journal called 'Name'"
        /(?:journal|publication)\s+(?:called|named)?\s*[""']?([A-Z][^""',.!?]+)[""']?/gi,
        // "researchers at Institution found"
        /(?:researchers?|scientists?)\s+(?:at\s+)?([A-Z][^.!?]+(?:University|Institute|Lab|Laboratory))\s+(?:found|discovered|showed)/gi,
        // "according to a study"
        /(?:according\s+to|based\s+on)\s+(?:a\s+)?(?:study|research)\s+(?:by\s+)?([A-Z][^.!?]+)/gi
      ],
      videos: [
        // "video called 'Title'"
        /(?:video|clip|interview|documentary)\s+(?:called|titled|named)\s*[""']([^""']+)[""']/gi,
        // "watch the video 'Title'"
        /(?:watch|see|check out)\s+(?:the\s+)?(?:video|clip)\s+[""']([^""']+)[""']/gi,
        // "YouTube video" or "TED talk"
        /(?:YouTube\s+video|TED\s+talk|interview)\s+(?:with\s+|about\s+|on\s+)?([A-Z][^.!?]+)/gi,
        // "there's a great video"
        /(?:there's|there\s+is)\s+(?:a\s+)?(?:great|good|interesting)\s+(?:video|clip)\s+(?:called\s+)?[""']?([^""'.!?]+)[""']?/gi
      ],
      general: [
        // Quoted titles that might be anything
        /[""']([A-Z][^""']{10,})[""']/gi,
        // "the work of Author"
        /(?:the\s+work\s+of|work\s+by)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi
      ]
    };
  }

  /**
   * Analyze transcript text for citations
   */
  async analyzeText(text, timestamp = 0) {
    const { log } = window.CitationHelpers;
    
    if (!text || text.length < 10) {
      return [];
    }

    const citations = [];
    
    // Check each pattern type
    for (const [type, patterns] of Object.entries(this.patterns)) {
      for (const pattern of patterns) {
        const matches = [...text.matchAll(pattern)];
        
        for (const match of matches) {
          const citation = this.createCitation(match, type, timestamp);
          if (citation && this.isValidCitation(citation)) {
            citations.push(citation);
          }
        }
      }
    }

    // Remove duplicates and low-confidence matches
    const uniqueCitations = this.deduplicateCitations(citations);
    
    if (uniqueCitations.length > 0) {
      log(`Found ${uniqueCitations.length} potential citations at ${timestamp}s`);
    }

    return uniqueCitations;
  }

  /**
   * Create citation object from regex match
   */
  createCitation(match, type, timestamp) {
    const fullMatch = match[0];
    const title = match[1]?.trim();
    const author = match[2]?.trim();

    if (!title || title.length < 3) {
      return null;
    }

    return {
      id: this.generateCitationId(title, type, timestamp),
      type,
      title,
      author: author || null,
      timestamp,
      confidence: this.calculateConfidence(fullMatch, type, title),
      context: this.extractContext(match.input, match.index, 50),
      originalMatch: fullMatch,
      verified: false,
      metadata: {}
    };
  }

  /**
   * Calculate confidence score for a citation
   */
  calculateConfidence(fullMatch, type, title) {
    let confidence = 0.5; // Base confidence

    // Boost confidence based on explicit indicators
    const indicators = {
      books: ['book', 'novel', 'memoir', 'biography', 'author', 'wrote'],
      papers: ['study', 'research', 'journal', 'published', 'researchers'],
      videos: ['video', 'clip', 'YouTube', 'TED', 'interview', 'documentary']
    };

    const typeIndicators = indicators[type] || [];
    const matchLower = fullMatch.toLowerCase();
    
    for (const indicator of typeIndicators) {
      if (matchLower.includes(indicator)) {
        confidence += 0.1;
      }
    }

    // Boost for proper formatting (quotes, capitalization)
    if (/[""']/.test(fullMatch)) confidence += 0.1;
    if (/^[A-Z]/.test(title)) confidence += 0.1;
    if (title.length > 10) confidence += 0.1;
    if (title.length > 30) confidence += 0.1;

    // Reduce confidence for very short or very long titles
    if (title.length < 5) confidence -= 0.2;
    if (title.length > 100) confidence -= 0.2;

    // Reduce confidence for common false positives
    const falsePositives = ['this video', 'that book', 'the study', 'my research'];
    if (falsePositives.some(fp => title.toLowerCase().includes(fp))) {
      confidence -= 0.3;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Check if citation meets minimum quality standards
   */
  isValidCitation(citation) {
    // Minimum confidence threshold
    if (citation.confidence < 0.4) return false;

    // Title length checks
    if (citation.title.length < 3 || citation.title.length > 200) return false;

    // Filter out common false positives
    const blacklist = [
      'this', 'that', 'these', 'those', 'here', 'there',
      'now', 'then', 'today', 'yesterday', 'tomorrow',
      'good', 'bad', 'great', 'amazing', 'terrible'
    ];

    const titleLower = citation.title.toLowerCase();
    if (blacklist.some(word => titleLower === word)) return false;

    // Must contain at least one letter
    if (!/[a-zA-Z]/.test(citation.title)) return false;

    return true;
  }

  /**
   * Remove duplicate citations
   */
  deduplicateCitations(citations) {
    const seen = new Set();
    const unique = [];

    for (const citation of citations) {
      const key = `${citation.type}:${citation.title.toLowerCase()}`;
      
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(citation);
      } else {
        // If we've seen this citation before, keep the one with higher confidence
        const existingIndex = unique.findIndex(c => 
          c.type === citation.type && 
          c.title.toLowerCase() === citation.title.toLowerCase()
        );
        
        if (existingIndex !== -1 && citation.confidence > unique[existingIndex].confidence) {
          unique[existingIndex] = citation;
        }
      }
    }

    return unique.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Extract context around the citation
   */
  extractContext(text, matchIndex, contextLength = 50) {
    const start = Math.max(0, matchIndex - contextLength);
    const end = Math.min(text.length, matchIndex + contextLength);
    
    let context = text.substring(start, end);
    
    // Add ellipsis if we truncated
    if (start > 0) context = '...' + context;
    if (end < text.length) context = context + '...';
    
    return context.trim();
  }

  /**
   * Generate unique ID for citation
   */
  generateCitationId(title, type, timestamp) {
    const hash = this.simpleHash(title + type + timestamp);
    return `citation_${type}_${hash}`;
  }

  /**
   * Simple hash function for generating IDs
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Process transcript segments in real-time
   */
  async processTranscriptSegment(segment) {
    const citations = await this.analyzeText(segment.text, segment.start);
    
    if (citations.length > 0) {
      this.detectedCitations.push(...citations);
      this.notifyObservers(citations);
    }
    
    return citations;
  }

  /**
   * Get all detected citations
   */
  getAllCitations() {
    return this.detectedCitations;
  }

  /**
   * Get citations by type
   */
  getCitationsByType(type) {
    return this.detectedCitations.filter(citation => citation.type === type);
  }

  /**
   * Subscribe to citation detection events
   */
  onCitationDetected(callback) {
    this.observers.push(callback);
  }

  /**
   * Notify observers of new citations
   */
  notifyObservers(citations) {
    this.observers.forEach(callback => callback(citations));
  }

  /**
   * Clear all detected citations
   */
  clear() {
    this.detectedCitations = [];
    this.observers = [];
  }
}

// Create global instance
window.CitationDetector = new CitationDetector(); 