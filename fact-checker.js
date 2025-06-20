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
        /(black\s+holes?|neutron\s+stars?|supernovas?|galaxies)\s+(?:can\s+)?(?:have|reach|contain)\s+(?:temperatures?|masses?|densities?)\s+of\s+(?:up\s+to\s+)?(\d+(?:,\d{3})*(?:\.\d+)?)/gi,
        // Enhanced scientific patterns for educational content
        /(?:scientists?|researchers?)\s+(?:have\s+)?(?:found|discovered|shown|proved)\s+(?:that\s+)?([a-zA-Z0-9\s]{15,100})/gi,
        /(?:studies?|research|experiments?)\s+(?:show|reveal|demonstrate|indicate)\s+(?:that\s+)?([a-zA-Z0-9\s]{15,100})/gi,
        /(?:the\s+)?(?:theory|law|principle|concept)\s+of\s+([a-zA-Z\s]{5,40})\s+(?:states?|explains?|describes?)\s+(?:that\s+)?([a-zA-Z0-9\s]{15,100})/gi,
        /(DNA|RNA|proteins?|genes?|molecules?|atoms?|cells?|neurons?)\s+(?:are|have|contain|consist\s+of)\s+([a-zA-Z0-9\s]{10,80})/gi,
        /(?:the\s+)?(?:human\s+)?(?:brain|heart|liver|lungs?|kidney)\s+(?:contains?|has|produces?|processes?)\s+(?:about\s+|approximately\s+)?([a-zA-Z0-9\s,]{10,80})/gi
      ],
      
      // Educational/explanatory content - NEW
      educational: [
        /(?:this\s+)?(?:phenomenon|effect|process|mechanism)\s+(?:is\s+)?(?:called|known\s+as|referred\s+to\s+as)\s+([a-zA-Z\s]{5,40})/gi,
        /(?:the\s+)?(?:reason|cause|explanation)\s+(?:for\s+)?(?:this\s+)?(?:is\s+)?(?:that\s+)?([a-zA-Z0-9\s]{15,120})/gi,
        /(?:this\s+)?(?:happens|occurs|works)\s+(?:because|when|due\s+to)\s+([a-zA-Z0-9\s]{15,100})/gi,
        /(?:the\s+)?(?:result|effect|consequence|outcome)\s+(?:is\s+)?(?:that\s+)?([a-zA-Z0-9\s]{15,100})/gi,
        /(?:research|studies|data|evidence)\s+(?:shows?|suggests?|indicates?)\s+(?:that\s+)?([a-zA-Z0-9\s]{15,120})/gi,
        /(?:according\s+to|based\s+on)\s+(?:the\s+)?(?:study|research|data|evidence)\s+([a-zA-Z0-9\s]{15,100})/gi
      ],
      
      // Quantitative claims - NEW
      quantitative: [
        /(?:about\s+|approximately\s+|roughly\s+|around\s+)?(\d+(?:,\d{3})*(?:\.\d+)?)\s+(?:percent|%)\s+of\s+([a-zA-Z\s]{5,60})/gi,
        /(?:over|more\s+than|less\s+than|up\s+to|about)\s+(\d+(?:,\d{3})*(?:\.\d+)?)\s+(million|billion|thousand|hundred)\s+([a-zA-Z\s]{5,60})/gi,
        /(?:the\s+)?(?:average|typical|normal|standard)\s+([a-zA-Z\s]{5,40})\s+(?:is|are|contains?|measures?)\s+(?:about\s+|approximately\s+)?(\d+(?:,\d{3})*(?:\.\d+)?)\s*([a-zA-Z\s\/]+)/gi,
        /(?:can\s+)?(?:reach|achieve|grow\s+to|extend\s+to)\s+(?:up\s+to\s+|as\s+much\s+as\s+)?(\d+(?:,\d{3})*(?:\.\d+)?)\s*([a-zA-Z\s\/]+)/gi
      ],
      
      // Comparative claims - NEW
      comparative: [
        /([a-zA-Z\s]{5,40})\s+(?:is|are)\s+(?:much\s+|significantly\s+)?(?:larger|smaller|bigger|faster|slower|heavier|lighter|stronger|weaker)\s+than\s+([a-zA-Z\s]{5,40})/gi,
        /(?:compared\s+to|versus|vs\.?)\s+([a-zA-Z\s]{5,40}),?\s+([a-zA-Z\s]{5,40})\s+(?:is|are|has|have)\s+([a-zA-Z\s]{5,60})/gi,
        /([a-zA-Z\s]{5,40})\s+(?:is|are)\s+(?:the\s+)?(?:most|least|best|worst|largest|smallest)\s+([a-zA-Z\s]{5,60})/gi
      ],
      
      // Geographic and demographic facts - more specific
      geographic: [
        /(?:the\s+)?population\s+of\s+([A-Z][a-zA-Z\s]{2,25})\s+is\s+(?:approximately\s+|about\s+)?(\d+(?:,\d{3})*(?:\.\d+)?)\s*(million|billion|thousand)/gi,
        /([A-Z][a-zA-Z\s]{2,25})\s+is\s+(?:the\s+)?capital\s+(?:city\s+)?of\s+([A-Z][a-zA-Z\s]{2,25})/gi,
        /(?:the\s+)?([A-Z][a-zA-Z\s]{2,25})\s+(?:River|Mountain|Desert|Ocean|Sea)\s+is\s+(?:approximately\s+|about\s+)?(\d+(?:,\d{3})*(?:\.\d+)?)\s*(km|miles|meters|feet)\s+(?:long|tall|wide|deep)/gi,
        /([A-Z][a-zA-Z\s]{2,25})\s+has\s+an?\s+area\s+of\s+(?:approximately\s+|about\s+)?(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:square\s+)?(km|kilometers|miles)/gi,
        /([A-Z][a-zA-Z\s]{2,25})\s+is\s+located\s+(?:in|on|at|near)\s+([A-Z][a-zA-Z\s]{2,40})/gi
      ],
      
      // Mathematical and technical facts
      mathematical: [
        /(?:the\s+value\s+of\s+)?(\w+(?:\s+\w+)*)\s+(?:equals|is)\s+(?:approximately\s+|about\s+)?(\d+(?:\.\d+)?)/gi,
        /(\w+(?:\s+\w+)*)\s+has\s+(?:approximately\s+|about\s+)?(\d+(?:,\d{3})*(?:\.\d+)?)\s+(\w+)/gi,
        // Enhanced math patterns
        /(?:the\s+)?(?:formula|equation|calculation)\s+(?:for\s+)?([a-zA-Z\s]{5,40})\s+(?:is|equals|gives)\s+([a-zA-Z0-9\s\+=\-\*\/\(\)]{5,60})/gi,
        /(?:in\s+)?(?:mathematics|physics|chemistry|biology),?\s+([a-zA-Z\s]{5,40})\s+(?:is\s+)?(?:defined\s+as|means|refers\s+to)\s+([a-zA-Z0-9\s]{10,80})/gi
      ],
      
      // Biographical facts
      biographical: [
        /(\w+(?:\s+\w+)*)\s+was\s+born\s+in\s+(\w+(?:\s+\w+)*)/gi,
        /(\w+(?:\s+\w+)*)\s+lived\s+from\s+(\d{4})\s+to\s+(\d{4})/gi,
        /(\w+(?:\s+\w+)*)\s+was\s+(?:a|an)\s+(\w+(?:\s+\w+)*)/gi,
        /(\w+(?:\s+\w+)*)\s+wrote\s+["']([^"']+)["']/gi,
        // Enhanced biographical patterns
        /([A-Z][a-zA-Z\s]{3,30})\s+(?:is\s+)?(?:famous|known|recognized)\s+for\s+([a-zA-Z\s]{10,80})/gi,
        /([A-Z][a-zA-Z\s]{3,30})\s+(?:won|received|earned)\s+(?:the\s+)?([a-zA-Z\s]{5,60})\s+(?:in\s+)?(\d{4})?/gi
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
        /(?:the\s+)?(?:scale\s+of\s+)?(?:atoms?|molecules?|particles?)\s+(?:is|are)\s+(?:approximately\s+|about\s+)?(\d+(?:,\d{3})*(?:\.\d+)?)\s*(nanometers?|micrometers?|picometers?)/gi,
        // Enhanced physics patterns
        /(?:energy|force|velocity|acceleration|momentum)\s+(?:is\s+)?(?:equal\s+to|calculated\s+by|given\s+by)\s+([a-zA-Z0-9\s\*\/\+=\-\(\)]{5,40})/gi,
        /(?:if\s+)?(.{10,60})\s+(?:has\s+)?(?:friction|resistance|mass|energy|velocity),?\s+(?:it\s+will|then)\s+(.{10,80})/gi
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
    
    // Add detailed debugging
    console.log('🚨 FACT CHECKER DEBUG:');
    console.log('📝 Full text sample (first 500 chars):', text.substring(0, 500));
    console.log('📝 Text type:', typeof text);
    console.log('📝 Text contains "butterfly":', text.toLowerCase().includes('butterfly'));
    console.log('📝 Text contains "effect":', text.toLowerCase().includes('effect'));
    console.log('📝 Text contains "theory":', text.toLowerCase().includes('theory'));
    console.log('📝 Text contains "research":', text.toLowerCase().includes('research'));
    console.log('📝 Text contains numbers:', /\d+/.test(text));
    
    const claims = [];
    let claimId = 1;
    let totalMatches = 0;
    
    for (const [category, patterns] of Object.entries(this.claimPatterns)) {
      console.log(`🔍 Checking category: ${category} with ${patterns.length} patterns`);
      
      for (const pattern of patterns) {
        try {
          const matches = [...text.matchAll(pattern)];
          totalMatches += matches.length;
          
          if (matches.length > 0) {
            console.log(`✅ Found ${matches.length} matches for ${category} pattern:`, pattern.toString());
            console.log('✅ Matches:', matches.map(m => m[0]));
          }
          
          for (const match of matches) {
            const claimText = match[0].trim();
            
            // Skip very short or generic claims - be more lenient for debugging
            console.log(`🔍 Checking claim: "${claimText}" (length: ${claimText.length})`);
            
            if (claimText.length < 10) { // Reduced from 15 to 10
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
        } catch (error) {
          console.warn(`❌ Pattern error in category ${category}:`, error);
        }
      }
    }
    
    console.log(`📊 Pattern matching complete: ${totalMatches} total matches found, ${claims.length} claims created`);
    
    // If no claims found, try simpler patterns as fallback
    if (claims.length === 0) {
      console.log('🚨 NO CLAIMS FOUND - Trying emergency fallback patterns...');
      const emergencyPatterns = [
        // Very simple patterns for any statement with numbers or specific terms
        /(\w+\s+){3,10}(\d+|\d+%|percent|million|billion|theory|principle|effect|discovered|research|study)/gi,
        // Catch scientific or educational terms
        /(butterfly\s+effect|chaos\s+theory|quantum|relativity|evolution|gravity|energy)/gi,
        // Basic factual statements
        /([A-Z][a-zA-Z\s]{10,60})\s+(?:is|are|was|were|can|will|has|have)\s+([a-zA-Z0-9\s]{10,80})/gi
      ];
      
      for (const pattern of emergencyPatterns) {
        const matches = [...text.matchAll(pattern)];
        console.log(`🚨 Emergency pattern found ${matches.length} matches:`, pattern.toString());
        
        for (const match of matches) {
          const claimText = match[0].trim();
          if (claimText.length > 15) {
            console.log(`🚨 Emergency claim: "${claimText}"`);
            claims.push({
              id: claimId++,
              text: claimText,
              category: 'emergency',
              confidence: 0.3,
              extractedData: { fullMatch: claimText },
              position: match.index
            });
          }
        }
      }
    }
    
    // Remove duplicates and sort by confidence
    const finalClaims = this.deduplicateClaims(claims)
      .filter(claim => {
        const passed = claim.confidence > 0.15; // Even lower threshold for debugging
        if (!passed) console.log(`❌ Claim filtered out (low confidence ${claim.confidence.toFixed(2)}): "${claim.text}"`);
        return passed;
      })
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 20); // Increased limit even more
      
    console.log(`🎯 Final result: ${finalClaims.length} claims will be fact-checked`);
    if (finalClaims.length > 0) {
      console.log('🎯 Final claims:', finalClaims.map(c => `"${c.text}" (${c.confidence.toFixed(2)})`));
    }
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
    
    // Enhanced educational content indicators
    if (text.includes('research') || text.includes('studies') || text.includes('scientists')) confidence += 0.2;
    if (text.includes('evidence') || text.includes('data') || text.includes('experiments')) confidence += 0.15;
    if (text.includes('theory') || text.includes('principle') || text.includes('law')) confidence += 0.15;
    if (text.includes('according to') || text.includes('based on')) confidence += 0.1;
    if (text.includes('shows') || text.includes('demonstrates') || text.includes('indicates')) confidence += 0.15;
    
    // Boost for percentage and numerical claims
    if (text.includes('percent') || text.includes('%')) confidence += 0.15;
    if (/\d+/.test(text)) confidence += 0.1; // Contains any numbers
    
    // Category-specific boosts
    const categoryBoosts = {
      historical: 0.2,
      scientific: 0.15,
      biographical: 0.2,
      geographic: 0.1,
      mathematical: 0.1,
      statistical: 0.05,
      physics: 0.15,
      educational: 0.25,  // High boost for educational content
      quantitative: 0.2,  // High boost for quantitative claims
      comparative: 0.1    // Moderate boost for comparisons
    };
    
    confidence += categoryBoosts[category] || 0;
    
    // Penalty for very long claims (likely to be inaccurate)
    if (text.length > 200) confidence -= 0.1; // Reduced penalty
    
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
      'it is believed',
      'some say',
      'many people'
    ];
    
    // Vague terms that lack specificity - reduced list for educational content
    const vagueTerms = [
      'something', 'anything', 'everything', 'nothing', 
      'somewhere', 'anywhere', 'everywhere', 'nowhere',
      'someone', 'anyone', 'everyone', 'no one'
    ];
    
    // Check for generic phrases
    if (genericPhrases.some(phrase => lowerText.includes(phrase))) {
      return true;
    }
    
    // Check for too many vague terms - increased tolerance
    const vaguenessCount = vagueTerms.filter(term => lowerText.includes(term)).length;
    if (vaguenessCount > 2) return true; // Increased from 1 to 2
    
    // Must contain specific factual content (dates, numbers, proper nouns) - more lenient
    const hasSpecificContent = /(\d{4}|\d+(?:,\d{3})+|\d+\.\d+|[A-Z][a-zA-Z]{2,}|percent|%|\d+)/.test(text);
    if (!hasSpecificContent) {
      console.log(`❌ No specific content in: "${text}"`);
      return true;
    }
    
    // Educational terms that should NOT be filtered out
    const educationalTerms = [
      'research', 'study', 'studies', 'scientists', 'theory', 'principle', 
      'experiment', 'data', 'evidence', 'according to', 'shows', 'demonstrates',
      'discovered', 'found', 'indicates', 'suggests', 'reveals'
    ];
    
    // If it contains educational terms, be more permissive
    const hasEducationalTerms = educationalTerms.some(term => lowerText.includes(term));
    if (hasEducationalTerms) {
      // Only filter out if it's REALLY generic
      const veryGenericPhrases = ['it should', 'you should', 'we should', 'maybe', 'perhaps'];
      return veryGenericPhrases.some(phrase => lowerText.includes(phrase));
    }
    
    // Avoid claims that are just opinions or general statements - but be less strict
    const strongOpinionWords = ['should', 'must', 'need to', 'have to'];
    const strongOpinionCount = strongOpinionWords.filter(word => lowerText.includes(word)).length;
    if (strongOpinionCount > 0) return true;
    
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