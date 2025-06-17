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
      // Books - only when explicitly cited or referenced
      books: [
        // "book called/titled 'Title'" or "book named 'Title'"
        /(?:book|novel|memoir|biography|autobiography)\s+(?:called|titled|named|entitled)\s*[""']([^""']{8,80})[""']/gi,
        // "'Title' by Author" - explicit book citation
        /[""']([^""']{10,80})[""']\s+by\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})/gi,
        // "Author's book 'Title'" - explicit ownership
        /([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})'s\s+(?:book|novel|memoir|biography)\s+[""']([^""']{8,80})[""']/gi,
        // "in his/her book 'Title'" - referencing content
        /(?:in|from)\s+(?:his|her|their)\s+(?:book|novel|memoir|biography)\s+[""']([^""']{8,80})[""']/gi,
        // "I read the book 'Title'" - explicit reading reference
        /(?:I\s+read|read\s+the|reading\s+the)\s+(?:book|novel)\s+[""']([^""']{8,80})[""']/gi,
        // "Author wrote 'Title'" - authorship citation
        /([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\s+(?:wrote|published|authored)\s+[""']([^""']{8,80})[""']/gi,
        // "the book 'Title' talks about" - explicit book reference
        /(?:the|this)\s+(?:book|novel)\s+[""']([^""']{8,80})[""']\s+(?:talks\s+about|discusses|explains|covers)/gi
      ],
      
      // Research papers and studies - only academic citations
      papers: [
        // "study published in Journal" - explicit academic reference
        /(?:study|research|paper|article)\s+(?:published|appearing)\s+in\s+(?:the\s+)?([A-Z][^.!?]{10,60}(?:Journal|Review|Science|Nature|Cell|PNAS|Proceedings))/gi,
        // "according to a study in/from Journal" - explicit study citation
        /(?:according\s+to|based\s+on)\s+(?:a\s+)?(?:study|research|paper)\s+(?:in|from|published\s+in)\s+([A-Z][^.!?]{10,60})/gi,
        // "researchers at Institution found/discovered" - explicit research citation
        /(?:researchers|scientists)\s+(?:at|from)\s+([A-Z][^.!?]{10,60}(?:University|Institute|Laboratory|College))\s+(?:found|discovered|showed|published|concluded)/gi,
        // "the study shows/found/concluded" - explicit study reference
        /(?:the|this|that)\s+(?:study|research|paper)\s+(?:shows|found|concluded|demonstrates|reveals)\s+(?:that\s+)?([A-Z][^.!?]{15,100})/gi,
        // Famous journals by name
        /(Nature|Science|Cell|PNAS|New\s+England\s+Journal\s+of\s+Medicine|The\s+Lancet|JAMA)\s+(?:published|reported|found)/gi
      ],
      
      // Videos and documentaries - only when explicitly referenced
      videos: [
        // "watch the documentary/video 'Title'" - explicit viewing recommendation
        /(?:watch|see|check\s+out)\s+(?:the\s+)?(?:documentary|video|film|movie)\s+[""']([^""']{8,60})[""']/gi,
        // "documentary/video called/titled 'Title'" - explicit naming
        /(?:documentary|video|film|movie)\s+(?:called|titled|named|entitled)\s+[""']([^""']{8,60})[""']/gi,
        // "TED talk by/about" - explicit TED reference
        /(?:TED\s+talk|TEDx\s+talk)\s+(?:by|about|called)\s+[""']?([^""']{8,50})[""']?/gi,
        // "YouTube channel called" - explicit channel reference
        /(?:YouTube\s+channel|channel)\s+(?:called|named)\s+[""']([^""']{5,40})[""']/gi,
        // "there's a great video about" - explicit recommendation
        /(?:there's|there\s+is)\s+(?:a\s+)?(?:great|good|excellent|amazing)\s+(?:documentary|video)\s+(?:about|on|called)\s+[""']([^""']{8,60})[""']/gi
      ],
      
      // Only very explicit general citations
      general: [
        // Quoted titles with explicit citation context
        /(?:mentioned|referenced|cited|discussed)\s+[""']([A-Z][^""']{10,80})[""']/gi,
        // "the work of Author" - explicit work reference
        /(?:the|this)\s+work\s+(?:of|by)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})/gi,
        // "according to Author" - explicit attribution
        /(?:according\s+to|says|states)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})/gi
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
    // Start with high confidence since patterns are now very specific
    let confidence = 0.8;

    const matchLower = fullMatch.toLowerCase();
    
    // Boost for strong citation indicators
    const strongIndicators = {
      books: ['called', 'titled', 'named', 'entitled', 'by', 'wrote', 'authored', 'published'],
      papers: ['published in', 'according to', 'study found', 'research shows', 'researchers at'],
      videos: ['watch', 'see', 'check out', 'called', 'titled', 'TED talk'],
      general: ['mentioned', 'referenced', 'cited', 'discussed', 'according to', 'work of']
    };

    const indicators = strongIndicators[type] || [];
    let indicatorCount = 0;
    
    for (const indicator of indicators) {
      if (matchLower.includes(indicator)) {
        indicatorCount++;
        confidence += 0.05;
      }
    }

    // Strong boost for quotation marks (explicit citation)
    if (/[""']/.test(fullMatch)) {
      confidence += 0.1;
    }

    // Boost for proper title formatting
    if (/^[A-Z]/.test(title)) {
      confidence += 0.05;
    }

    // Length-based scoring for titles
    if (title.length >= 15 && title.length <= 60) {
      confidence += 0.05; // Sweet spot for title length
    } else if (title.length < 8) {
      confidence -= 0.2; // Too short, probably not a real title
    } else if (title.length > 80) {
      confidence -= 0.15; // Too long, probably captured too much
    }

    // Boost for multiple indicators (stronger citation context)
    if (indicatorCount >= 2) {
      confidence += 0.1;
    }

    // Penalty for generic/vague titles
    const genericWords = ['this', 'that', 'something', 'anything', 'everything'];
    if (genericWords.some(word => title.toLowerCase().includes(word))) {
      confidence -= 0.4;
    }

    // Penalty for obviously wrong captures
    const obviouslyWrong = ['bell tower', 'according to', 'the study shows', 'in this video'];
    if (obviouslyWrong.some(wrong => title.toLowerCase().includes(wrong))) {
      confidence -= 0.6;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Check if citation meets minimum quality standards
   */
  isValidCitation(citation) {
    // Higher confidence threshold since patterns are more specific
    if (citation.confidence < 0.6) return false;

    // Title length should be reasonable for actual citations
    if (citation.title.length < 8 || citation.title.length > 120) return false;

    const titleLower = citation.title.toLowerCase().trim();
    
    // Must contain at least one letter and not be all spaces
    if (!/[a-zA-Z]/.test(citation.title) || titleLower.length === 0) return false;

    // Block obvious false positives
    const invalidTitles = [
      'this', 'that', 'these', 'those', 'here', 'there',
      'now', 'then', 'today', 'yesterday', 'tomorrow',
      'something', 'anything', 'everything', 'nothing',
      'bell tower', 'according to', 'the study shows',
      'in this video', 'this place', 'that person',
      'we found', 'they discovered', 'it shows'
    ];

    if (invalidTitles.some(invalid => titleLower === invalid || titleLower.includes(invalid))) {
      return false;
    }

    // Books should look like book titles
    if (citation.type === 'books') {
      // Should not be just a single common word
      const commonSingleWords = ['science', 'physics', 'history', 'mathematics', 'biology'];
      if (commonSingleWords.includes(titleLower)) return false;
      
      // Should have reasonable length for a book title
      if (citation.title.length < 10) return false;
    }

    // Papers should look like academic content
    if (citation.type === 'papers') {
      // Should contain some academic-sounding content
      const hasAcademicWords = /(?:study|research|analysis|investigation|findings|results|journal|university|institute)/i.test(citation.title);
      if (!hasAcademicWords && citation.title.length < 15) return false;
    }

    // Videos should look like video titles
    if (citation.type === 'videos') {
      // Should not be just descriptive phrases
      const genericPhrases = ['this video', 'that documentary', 'the film'];
      if (genericPhrases.some(phrase => titleLower.includes(phrase))) return false;
    }

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