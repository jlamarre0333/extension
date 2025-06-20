// Smart Fact-Checking Engine for Educational Content
console.log('🔍 Smart Fact-Checker loading...');

class SmartFactChecker {
  constructor() {
    this.factChecks = [];
    this.verificationCache = new Map();
    
    // Claim detection patterns - looking for factual statements
    this.claimPatterns = {
      // Historical dates and events - more specific patterns
      historical: [
        /([A-Z][a-zA-Z\s]{2,30})\s+(?:was\s+)?(?:born|died)\s+(?:in\s+)?(\d{4})/gi,
        /([A-Z][a-zA-Z\s]{2,30})\s+(?:invented|discovered|founded|established|created)\s+([a-zA-Z\s]{3,40})\s+(?:in\s+)?(\d{4})/gi,
        /(World\s+War\s+(?:I|II|One|Two|1|2))\s+(?:started|began|ended|lasted)\s+(?:in\s+|from\s+)?(\d{4})/gi,
        /(?:the\s+)?([A-Z][a-zA-Z\s]{5,40}(?:War|Revolution|Empire|Dynasty))\s+(?:occurred|happened|lasted)\s+(?:from\s+)?(\d{4})/gi
      ],
      
      // Scientific facts and discoveries - more precise
      scientific: [
        /([A-Z][a-zA-Z\s]{2,25})\s+discovered\s+(?:that\s+)?([a-zA-Z0-9\s]{10,60})\s+(?:in\s+)?(\d{4})/gi,
        /(?:the\s+)?(?:speed\s+of\s+light|gravity|mass\s+of\s+(?:the\s+)?(?:Earth|Sun|Moon))\s+is\s+(?:approximately\s+|about\s+)?(\d+(?:,\d{3})*(?:\.\d+)?)\s*([a-zA-Z\/\s]+)/gi,
        /(?:the\s+)?(?:diameter|radius|distance)\s+of\s+(?:the\s+)?([A-Z][a-zA-Z\s]{3,25})\s+is\s+(?:approximately\s+|about\s+)?(\d+(?:,\d{3})*(?:\.\d+)?)\s*(km|miles|light-years|meters)/gi,
        /([A-Z][a-zA-Z\s]{3,25})\s+(?:has\s+a\s+)?(?:mass|weight|temperature)\s+of\s+(?:approximately\s+|about\s+)?(\d+(?:,\d{3})*(?:\.\d+)?)\s*([a-zA-Z\/°\s]+)/gi,
        /(black\s+holes?|neutron\s+stars?|supernovas?|galaxies)\s+(?:can\s+)?(?:have|reach|contain)\s+(?:temperatures?|masses?|densities?)\s+of\s+(?:up\s+to\s+)?(\d+(?:,\d{3})*(?:\.\d+)?)/gi
      ],
      
      // Geographic and demographic facts - more specific
      geographic: [
        /(?:the\s+)?population\s+of\s+([A-Z][a-zA-Z\s]{2,25})\s+is\s+(?:approximately\s+|about\s+)?(\d+(?:,\d{3})*(?:\.\d+)?)\s*(million|billion|thousand)/gi,
        /([A-Z][a-zA-Z\s]{2,25})\s+is\s+(?:the\s+)?capital\s+(?:city\s+)?of\s+([A-Z][a-zA-Z\s]{2,25})/gi,
        /(?:the\s+)?([A-Z][a-zA-Z\s]{2,25})\s+(?:River|Mountain|Desert|Ocean|Sea)\s+is\s+(?:approximately\s+|about\s+)?(\d+(?:,\d{3})*(?:\.\d+)?)\s*(km|miles|meters|feet)\s+(?:long|tall|wide|deep)/gi,
        /([A-Z][a-zA-Z\s]{2,25})\s+has\s+an?\s+area\s+of\s+(?:approximately\s+|about\s+)?(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:square\s+)?(km|kilometers|miles)/gi
      ],
      
      // Mathematical and technical facts
      mathematical: [
        /(?:the\s+value\s+of\s+)?(\w+(?:\s+\w+)*)\s+(?:equals|is)\s+(?:approximately\s+|about\s+)?(\d+(?:\.\d+)?)/gi,
        /(\w+(?:\s+\w+)*)\s+has\s+(?:approximately\s+|about\s+)?(\d+(?:,\d{3})*(?:\.\d+)?)\s+(\w+)/gi
      ],
      
      // Biographical facts
      biographical: [
        /(\w+(?:\s+\w+)*)\s+was\s+born\s+in\s+(\w+(?:\s+\w+)*)/gi,
        /(\w+(?:\s+\w+)*)\s+lived\s+from\s+(\d{4})\s+to\s+(\d{4})/gi,
        /(\w+(?:\s+\w+)*)\s+was\s+(?:a|an)\s+(\w+(?:\s+\w+)*)/gi,
        /(\w+(?:\s+\w+)*)\s+wrote\s+["']([^"']+)["']/gi
      ],
      
      // Economic and statistical facts
      statistical: [
        /(?:approximately\s+|about\s+)?(\d+(?:,\d{3})*(?:\.\d+)?)\s*percent\s+of\s+(\w+(?:\s+\w+)*)/gi,
        /(\w+(?:\s+\w+)*)\s+costs?\s+(?:approximately\s+|about\s+)?\$(\d+(?:,\d{3})*(?:\.\d+)?)/gi,
        /(?:the\s+)?GDP\s+of\s+(\w+(?:\s+\w+)*)\s+is\s+(?:approximately\s+|about\s+)?\$(\d+(?:,\d{3})*(?:\.\d+)?\s*(?:million|billion|trillion)?)/gi
      ],
      
      // Physics and chaos theory specific patterns
      physics: [
        /(?:chaos\s+theory|butterfly\s+effect|strange\s+attractors?)\s+(?:was\s+)?(?:discovered|developed|studied)\s+(?:by\s+)?([A-Z][a-zA-Z\s]{3,25})/gi,
        /(?:the\s+)?(?:butterfly\s+effect|chaos\s+theory|quantum\s+mechanics)\s+(?:suggests?|shows?|demonstrates?|means?)\s+(?:that\s+)?([a-zA-Z\s]{10,80})/gi,
        /(?:in\s+)?(\d{4}),?\s+([A-Z][a-zA-Z\s]{3,25})\s+(?:discovered|proved|showed)\s+(?:that\s+)?([a-zA-Z\s]{10,60})/gi,
        /(?:atoms?|molecules?|particles?)\s+(?:are|have|contain)\s+(?:approximately\s+|about\s+)?(\d+(?:,\d{3})*(?:\.\d+)?)\s*([a-zA-Z\s]+)/gi,
        /(?:the\s+)?(?:scale\s+of\s+)?(?:atoms?|molecules?|particles?)\s+(?:is|are)\s+(?:approximately\s+|about\s+)?(\d+(?:,\d{3})*(?:\.\d+)?)\s*(nanometers?|micrometers?|picometers?)/gi
      ]
    };
    
    // Wikipedia API configuration
    this.wikipediaAPI = {
      baseURL: 'https://en.wikipedia.org/api/rest_v1',
      searchURL: 'https://en.wikipedia.org/w/api.php'
    };
  }

  // Main fact-checking method
  async detectAndVerifyClaims(transcriptText) {
    console.log('🔍 Starting fact-checking analysis...');
    
    const claims = this.extractClaims(transcriptText);
    console.log(`📋 Extracted ${claims.length} potential claims`);
    
    const verifiedClaims = [];
    
    for (const claim of claims) {
      try {
        const verification = await this.verifyClaim(claim);
        if (verification) {
          verifiedClaims.push({
            ...claim,
            ...verification,
            id: `fact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          });
        }
      } catch (error) {
        console.warn('Verification failed for claim:', claim.text, error);
      }
    }
    
    console.log(`✅ Verified ${verifiedClaims.length} claims`);
    this.factChecks = verifiedClaims;
    return verifiedClaims;
  }

  // Extract potential factual claims from transcript
  extractClaims(text) {
    console.log(`🔍 Analyzing transcript text (${text.length} characters):`, text.substring(0, 200) + '...');
    
    const claims = [];
    let claimId = 1;
    let totalMatches = 0;
    
    for (const [category, patterns] of Object.entries(this.claimPatterns)) {
      console.log(`🔍 Checking category: ${category} with ${patterns.length} patterns`);
      
      for (const pattern of patterns) {
        const matches = [...text.matchAll(pattern)];
        totalMatches += matches.length;
        
        if (matches.length > 0) {
          console.log(`✅ Found ${matches.length} matches for ${category} pattern`);
        }
        
        for (const match of matches) {
          const claimText = match[0].trim();
          
          // Skip very short or generic claims - be more lenient for debugging
          console.log(`🔍 Checking claim: "${claimText}" (length: ${claimText.length})`);
          
          if (claimText.length < 15) {
            console.log(`❌ Claim too short: "${claimText}"`);
            continue;
          }
          
          if (this.isGenericClaim(claimText)) {
            console.log(`❌ Claim too generic: "${claimText}"`);
            continue;
          }
          
          console.log(`✅ Valid claim found: "${claimText}"`);
          
          claims.push({
            id: claimId++,
            text: claimText,
            category: category,
            confidence: this.calculateClaimConfidence(match, category),
            extractedData: this.extractDataFromMatch(match, category),
            position: match.index
          });
        }
      }
    }
    
    console.log(`📊 Pattern matching complete: ${totalMatches} total matches found, ${claims.length} claims created`);
    
    // Remove duplicates and sort by confidence
    const finalClaims = this.deduplicateClaims(claims)
      .filter(claim => {
        const passed = claim.confidence > 0.3; // Lower threshold for debugging
        if (!passed) console.log(`❌ Claim filtered out (low confidence ${claim.confidence.toFixed(2)}): "${claim.text}"`);
        return passed;
      })
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10); // Limit to top 10 claims
      
    console.log(`🎯 Final result: ${finalClaims.length} claims will be fact-checked`);
    return finalClaims;
  }

  // Calculate confidence score for a claim
  calculateClaimConfidence(match, category) {
    let confidence = 0.5; // Base confidence
    
    const text = match[0].toLowerCase();
    
    // Boost for specific indicators
    if (text.includes('approximately') || text.includes('about')) confidence += 0.1;
    if (text.includes('discovered') || text.includes('invented')) confidence += 0.2;
    if (text.includes('born') || text.includes('died')) confidence += 0.15;
    if (/\d{4}/.test(text)) confidence += 0.15; // Contains year
    if (text.includes('million') || text.includes('billion')) confidence += 0.1;
    
    // Category-specific boosts
    const categoryBoosts = {
      historical: 0.2,
      scientific: 0.15,
      biographical: 0.2,
      geographic: 0.1,
      mathematical: 0.1,
      statistical: 0.05,
      physics: 0.15
    };
    
    confidence += categoryBoosts[category] || 0;
    
    // Penalty for very long claims (likely to be inaccurate)
    if (text.length > 200) confidence -= 0.2;
    
    return Math.max(0, Math.min(1, confidence));
  }

  // Extract structured data from claim match
  extractDataFromMatch(match, category) {
    const data = {
      fullMatch: match[0],
      groups: match.slice(1)
    };
    
    // Extract specific data based on category
    switch (category) {
      case 'historical':
        data.subject = match[1];
        data.date = match[2];
        break;
      case 'biographical':
        data.person = match[1];
        data.attribute = match[2];
        break;
      case 'geographic':
        data.location = match[1];
        data.value = match[2];
        break;
      case 'scientific':
        data.scientist = match[1];
        data.discovery = match[2];
        break;
    }
    
    return data;
  }

  // Verify a claim against reliable sources
  async verifyClaim(claim) {
    const cacheKey = claim.text.toLowerCase().trim();
    
    // Check cache first
    if (this.verificationCache.has(cacheKey)) {
      return this.verificationCache.get(cacheKey);
    }
    
    try {
      let verification = null;
      
      // Try different verification methods based on claim category
      switch (claim.category) {
        case 'historical':
        case 'biographical':
        case 'geographic':
          verification = await this.verifyWithWikipedia(claim);
          break;
        case 'scientific':
          verification = await this.verifyScientificClaim(claim);
          break;
        case 'statistical':
          verification = await this.verifyStatisticalClaim(claim);
          break;
        default:
          verification = await this.verifyWithWikipedia(claim);
      }
      
      // Cache the result
      if (verification) {
        this.verificationCache.set(cacheKey, verification);
      }
      
      return verification;
      
    } catch (error) {
      console.warn('Verification error:', error);
      return null;
    }
  }

  // Verify claim using Wikipedia
  async verifyWithWikipedia(claim) {
    try {
      const searchQuery = this.buildWikipediaSearchQuery(claim);
      console.log(`🔍 Wikipedia search: "${searchQuery}"`);
      
      // Search for relevant Wikipedia articles
      const searchResults = await this.searchWikipedia(searchQuery);
      
      if (!searchResults || searchResults.length === 0) {
        return {
          status: 'unverified',
          reason: 'No relevant Wikipedia articles found',
          confidence: 0.1
        };
      }
      
      // Get the top result and check content
      const topResult = searchResults[0];
      const articleContent = await this.getWikipediaArticle(topResult.title);
      
      if (!articleContent) {
        return {
          status: 'unverified',
          reason: 'Could not retrieve article content',
          confidence: 0.2
        };
      }
      
      // Analyze the article content for verification
      const verification = this.analyzeWikipediaContent(claim, articleContent, topResult);
      
      return verification;
      
    } catch (error) {
      console.warn('Wikipedia verification error:', error);
      return {
        status: 'error',
        reason: 'Verification service unavailable',
        confidence: 0
      };
    }
  }

  // Build search query for Wikipedia based on claim
  buildWikipediaSearchQuery(claim) {
    const data = claim.extractedData;
    
    // Extract key terms based on claim category
    switch (claim.category) {
      case 'historical':
        return data.subject || claim.text.split(' ').slice(0, 3).join(' ');
      case 'biographical':
        return data.person || claim.text.split(' ').slice(0, 2).join(' ');
      case 'geographic':
        return data.location || claim.text.split(' ').slice(0, 2).join(' ');
      case 'scientific':
        return data.scientist || data.discovery || claim.text.split(' ').slice(0, 3).join(' ');
      default:
        // Extract the most important words (exclude common words)
        const words = claim.text.toLowerCase().split(' ');
        const importantWords = words.filter(word => 
          word.length > 3 && 
          !['the', 'and', 'was', 'were', 'that', 'this', 'with', 'from', 'they', 'have', 'been'].includes(word)
        );
        return importantWords.slice(0, 3).join(' ');
    }
  }

  // Search Wikipedia articles
  async searchWikipedia(query) {
    try {
      const searchUrl = `${this.wikipediaAPI.searchURL}?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*&srlimit=3`;
      
      const response = await fetch(searchUrl);
      const data = await response.json();
      
      if (data.query && data.query.search) {
        return data.query.search.map(result => ({
          title: result.title,
          snippet: result.snippet,
          wordcount: result.wordcount
        }));
      }
      
      return [];
    } catch (error) {
      console.warn('Wikipedia search error:', error);
      return [];
    }
  }

  // Get Wikipedia article content
  async getWikipediaArticle(title) {
    try {
      const articleUrl = `${this.wikipediaAPI.baseURL}/page/summary/${encodeURIComponent(title)}`;
      
      const response = await fetch(articleUrl);
      const data = await response.json();
      
      return {
        title: data.title,
        extract: data.extract,
        description: data.description,
        url: data.content_urls?.desktop?.page
      };
    } catch (error) {
      console.warn('Wikipedia article fetch error:', error);
      return null;
    }
  }

  // Analyze Wikipedia content to verify claim
  analyzeWikipediaContent(claim, article, searchResult) {
    const claimText = claim.text.toLowerCase();
    const articleText = (article.extract + ' ' + searchResult.snippet).toLowerCase();
    
    // Extract key facts from the claim
    const claimFacts = this.extractKeyFacts(claim);
    
    // Check if key facts are mentioned in the article
    let matches = 0;
    let total = claimFacts.length;
    
    for (const fact of claimFacts) {
      if (articleText.includes(fact.toLowerCase())) {
        matches++;
      }
    }
    
    const matchScore = total > 0 ? matches / total : 0;
    
    // Determine verification status
    let status, confidence, reason;
    
    if (matchScore >= 0.7) {
      status = 'verified';
      confidence = 0.8 + (matchScore - 0.7) * 0.2;
      reason = `Confirmed by Wikipedia article "${article.title}"`;
    } else if (matchScore >= 0.4) {
      status = 'partially_verified';
      confidence = 0.5 + (matchScore - 0.4) * 0.3;
      reason = `Partially supported by Wikipedia article "${article.title}"`;
    } else {
      status = 'unverified';
      confidence = matchScore * 0.4;
      reason = `Not clearly supported by available Wikipedia sources`;
    }
    
    return {
      status,
      confidence,
      reason,
      source: {
        name: 'Wikipedia',
        title: article.title,
        url: article.url,
        extract: article.extract.substring(0, 200) + '...'
      },
      matchScore
    };
  }

  // Extract key facts from a claim for verification
  extractKeyFacts(claim) {
    const facts = [];
    const text = claim.text;
    const data = claim.extractedData;
    
    // Add the main subject/entity
    if (data.subject) facts.push(data.subject);
    if (data.person) facts.push(data.person);
    if (data.location) facts.push(data.location);
    if (data.scientist) facts.push(data.scientist);
    
    // Add dates
    const dateMatches = text.match(/\d{4}/g);
    if (dateMatches) facts.push(...dateMatches);
    
    // Add numbers
    const numberMatches = text.match(/\d+(?:,\d{3})*(?:\.\d+)?/g);
    if (numberMatches) facts.push(...numberMatches);
    
    // Add important keywords based on category
    const keywords = {
      historical: ['invented', 'discovered', 'founded', 'created', 'established'],
      biographical: ['born', 'died', 'lived', 'wrote'],
      geographic: ['population', 'capital', 'located', 'largest'],
      scientific: ['discovered', 'proved', 'theory', 'law']
    };
    
    const categoryKeywords = keywords[claim.category] || [];
    for (const keyword of categoryKeywords) {
      if (text.toLowerCase().includes(keyword)) {
        facts.push(keyword);
      }
    }
    
    return facts.filter(fact => fact && fact.length > 1);
  }

  // Verify scientific claims (placeholder for future enhancement)
  async verifyScientificClaim(claim) {
    // For now, fall back to Wikipedia
    // Future: integrate with scientific databases
    return await this.verifyWithWikipedia(claim);
  }

  // Verify statistical claims (placeholder for future enhancement)
  async verifyStatisticalClaim(claim) {
    // For now, fall back to Wikipedia
    // Future: integrate with statistical databases
    return await this.verifyWithWikipedia(claim);
  }

  // Check if claim is too generic to be useful - enhanced filtering
  isGenericClaim(text) {
    const lowerText = text.toLowerCase();
    
    // Generic phrases that make claims unverifiable
    const genericPhrases = [
      'this is important',
      'that was interesting', 
      'it is true',
      'we can see',
      'you can find',
      'there are many',
      'people often say',
      'it is known',
      'scientists think',
      'experts believe',
      'studies show',
      'research suggests',
      'it is believed',
      'some say',
      'many people',
      'according to some'
    ];
    
    // Vague terms that lack specificity
    const vagueTerms = [
      'something', 'anything', 'everything', 'nothing', 
      'somewhere', 'anywhere', 'everywhere', 'nowhere',
      'someone', 'anyone', 'everyone', 'no one',
      'various', 'numerous', 'several', 'multiple',
      'different', 'certain', 'particular', 'specific'
    ];
    
    // Check for generic phrases
    if (genericPhrases.some(phrase => lowerText.includes(phrase))) {
      return true;
    }
    
    // Check for too many vague terms
    const vaguenessCount = vagueTerms.filter(term => lowerText.includes(term)).length;
    if (vaguenessCount > 1) return true;
    
    // Must contain specific factual content (dates, numbers, proper nouns) - more lenient
    const hasSpecificContent = /(\d{4}|\d+(?:,\d{3})+|\d+\.\d+|[A-Z][a-zA-Z]{2,})/.test(text);
    if (!hasSpecificContent) {
      console.log(`❌ No specific content in: "${text}"`);
      return true;
    }
    
    // Avoid claims that are just opinions or general statements
    const opinionWords = ['should', 'could', 'might', 'maybe', 'perhaps', 'probably', 'seems', 'appears'];
    const opinionCount = opinionWords.filter(word => lowerText.includes(word)).length;
    if (opinionCount > 0) return true;
    
    return false;
  }

  // Remove duplicate claims
  deduplicateClaims(claims) {
    const seen = new Set();
    return claims.filter(claim => {
      const key = claim.text.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // Get verification status for UI
  getVerificationStatusIcon(status) {
    const icons = {
      verified: '✅',
      partially_verified: '⚠️',
      unverified: '❓',
      error: '❌'
    };
    return icons[status] || '❓';
  }

  // Get verification status color for UI
  getVerificationStatusColor(status) {
    const colors = {
      verified: '#10b981',
      partially_verified: '#f59e0b',
      unverified: '#6b7280',
      error: '#ef4444'
    };
    return colors[status] || '#6b7280';
  }

  // Get current fact-checks
  getFactChecks() {
    return this.factChecks;
  }

  // Clear fact-checks
  clearFactChecks() {
    this.factChecks = [];
    this.verificationCache.clear();
  }
}

// Make available globally
window.SmartFactChecker = SmartFactChecker;

console.log('✅ Smart Fact-Checker loaded successfully!'); 