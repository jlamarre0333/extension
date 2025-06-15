// Working Content Script for YouTube Citation Cross-Reference
console.log('🚀 Working content script loaded!');

// Global variables
let detector;
let currentVideoId;
let uiElements = {}; // Store UI references for cleanup

// Enhanced citation detector with better patterns and API integration
class EnhancedCitationDetector {
  constructor() {
    this.citations = [];
    this.googleBooksApiKey = 'AIzaSyBqOTz8QZ9X_8X8X8X8X8X8X8X8X8X8X8X'; // You'll need to get a real API key
  }

  detectCitations(text) {
    console.log('🔍 Analyzing text for citations...');
    console.log('📄 Text sample (first 500 chars):', text.substring(0, 500));
    console.log('📏 Total text length:', text.length);
    
    const found = [];
    
    // Refined book detection patterns (more precise)
    const bookPatterns = [
      // "book called/titled 'Title'" - high confidence
      /(?:book|novel|memoir|biography)\s+(?:called|titled|named)\s*[""']([^""']{5,60})[""']/gi,
      // "'Title' by Author" - high confidence
      /[""']([^""']{8,60})[""']\s+by\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})/gi,
      // "Author's book 'Title'" - high confidence
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})'s\s+(?:book|novel|memoir|biography)\s+[""']([^""']{5,60})[""']/gi,
      // "in his/her book 'Title'" - high confidence
      /in\s+(?:his|her|their)\s+(?:book|novel)\s+[""']([^""']{5,60})[""']/gi,
      // "the book 'Title'" - medium confidence
      /the\s+(?:book|novel)\s+[""']([^""']{5,60})[""']/gi,
      // "I recommend the book Title" - medium confidence
      /(?:I\s+)?(?:recommend|suggest)\s+(?:the\s+)?(?:book|novel)\s+[""']([^""']{5,60})[""']/gi,
      // "Title is a great book" - medium confidence
      /[""']([^""']{8,60})[""']\s+is\s+a\s+(?:great|amazing|fantastic|brilliant|excellent)\s+(?:book|novel|read)/gi,
      // "Author wrote Title" - medium confidence
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\s+wrote\s+[""']([^""']{8,60})[""']/gi
    ];

    // Enhanced research paper and study patterns
    const paperPatterns = [
      // "study published in Journal" - high confidence
      /(?:study|research|paper)\s+published\s+in\s+(?:the\s+)?([A-Z][^.!?]{8,60})/gi,
      // "Journal of Something" - high confidence
      /(Journal\s+of\s+[A-Z][a-z\s]{5,40})/gi,
      // High-impact journals - high confidence
      /(Nature|Science|Cell|PNAS|NEJM|The\s+Lancet|JAMA|Physical\s+Review|Proceedings|Annals)\s+(?:study|research|paper|article|published)/gi,
      // "according to a study in Journal" - medium confidence
      /according\s+to\s+a\s+(?:study|research)\s+(?:published\s+)?in\s+([A-Z][^.!?]{8,50})/gi,
      // "researchers at University found" - medium confidence
      /(?:researchers?|scientists?)\s+(?:at|from)\s+([A-Z][a-z\s]{5,40}(?:University|Institute|College))\s+(?:found|discovered|showed)/gi,
      // "meta-analysis" or "systematic review" - high confidence
      /(?:meta-analysis|systematic\s+review|clinical\s+trial)\s+(?:published\s+in\s+)?([A-Z][^.!?]{8,50})/gi,
      // Scientific experiments - medium confidence
      /(?:experiment|study)\s+(?:by|from|at)\s+([A-Z][a-z\s]{5,40}(?:University|Institute|Lab|Laboratory))/gi,
      // Famous experiments - high confidence
      /(Double\s+Slit\s+Experiment|Bell\s+Test|Schrödinger'?s?\s+Cat|EPR\s+Paradox|Michelson-Morley\s+Experiment)/gi
    ];

    // Refined product detection patterns
    const productPatterns = [
      // Brand + Model patterns - high confidence
      /(?:iPhone|iPad|MacBook|iMac|Apple\s+Watch)\s+(Pro|Air|Mini|Max|Plus|Ultra|\d+[A-Za-z]*)/gi,
      /(?:Samsung|Galaxy)\s+(S\d+|Note\d+|Tab\s+[A-Z]\d+|Watch\d*)/gi,
      /(?:Google|Pixel)\s+(\d+[a-zA-Z]*|Pro|XL|Buds|Nest)/gi,
      /(?:Sony|Canon|Nikon)\s+([A-Z]\d+[A-Za-z]*|Alpha\s+\d+)/gi,
      /(?:Tesla|Model)\s+([SXY3]|Cybertruck|Roadster)/gi,
      // "I use/bought/recommend the Product" - medium confidence
      /(?:I\s+(?:use|bought|got|recommend|love)|using\s+(?:the\s+)?|bought\s+(?:the\s+)?)([A-Z][a-zA-Z0-9\s]{4,30}(?:Pro|Max|Plus|Ultra|Air|Mini))/gi,
      // "Product review/unboxing" - medium confidence
      /([A-Z][a-zA-Z0-9\s]{4,30}(?:Pro|Max|Plus|Ultra|Air|Mini))\s+(?:review|unboxing|hands-on|first\s+look)/gi,
      // Price context - medium confidence
      /([A-Z][a-zA-Z0-9\s]{4,30})\s+(?:costs?|priced?\s+at|for)\s+\$[\d,]+/gi,
      // "available on Amazon" - medium confidence
      /([A-Z][a-zA-Z0-9\s]{4,30})\s+(?:available\s+on|buy\s+on)\s+(?:Amazon|Best\s+Buy)/gi
    ];

    // Enhanced scientific and educational concept patterns
    const topicPatterns = [
      // Educational context - high confidence
      /(?:introduction\s+to|guide\s+to|basics\s+of|fundamentals\s+of)\s+([A-Z][a-zA-Z\s]{5,40})/gi,
      /(?:learn|learning|understanding|mastering)\s+([A-Z][a-zA-Z\s]{5,40}(?:Programming|Development|Design|Marketing|Finance|Science))/gi,
      // Tutorial context - high confidence
      /([A-Z][a-zA-Z\s]{5,40})\s+(?:tutorial|course|training|bootcamp|masterclass)/gi,
      // "how to" context - medium confidence
      /how\s+to\s+(?:learn|use|master|understand)\s+([A-Z][a-zA-Z\s]{5,40})/gi,
      // Beginner context - medium confidence
      /([A-Z][a-zA-Z\s]{5,40})\s+for\s+(?:beginners|dummies|newbies)/gi,
      // Technical/academic concepts - medium confidence
      /(?:concept\s+of|theory\s+of|principles\s+of|science\s+of)\s+([A-Z][a-zA-Z\s]{5,40})/gi,
      // Deep learning context - medium confidence
      /(?:deep\s+dive\s+into|comprehensive\s+guide\s+to|complete\s+course\s+on)\s+([A-Z][a-zA-Z\s]{5,40})/gi
    ];

    // Scientific concept patterns specifically for physics/science videos
    const scientificConceptPatterns = [
      // Physics theories and principles - high confidence
      /(Quantum\s+Mechanics|Quantum\s+Physics|Relativity|General\s+Relativity|Special\s+Relativity|Thermodynamics|Electromagnetism|String\s+Theory|Loop\s+Quantum\s+Gravity)/gi,
      // Quantum mechanics concepts - high confidence  
      /(Wave\s+Function|Superposition|Entanglement|Quantum\s+Entanglement|Schrödinger\s+Equation|Heisenberg\s+Uncertainty\s+Principle|Observer\s+Effect|Quantum\s+Tunneling|Decoherence)/gi,
      // Mathematical concepts - medium confidence
      /(Probability\s+Amplitude|Wave\s+Equation|Fourier\s+Transform|Linear\s+Algebra|Complex\s+Numbers|Hilbert\s+Space)/gi,
      // Physics phenomena - medium confidence
      /(Interference|Diffraction|Double\s+Slit|Bell\s+Inequality|EPR\s+Paradox|Quantum\s+State|Measurement\s+Problem)/gi,
      // Scientific fields - medium confidence
      /(Particle\s+Physics|Condensed\s+Matter|Astrophysics|Cosmology|Theoretical\s+Physics|Experimental\s+Physics)/gi,
      // Technology/applications - medium confidence
      /(Quantum\s+Computer|Quantum\s+Computing|Laser|MRI|Electron\s+Microscope|Particle\s+Accelerator)/gi,
      // Scientific institutions - medium confidence
      /(CERN|MIT|Stanford|Harvard|Caltech|NIST|Max\s+Planck\s+Institute)/gi,
      // Famous scientists - medium confidence
      /(Einstein|Schrödinger|Heisenberg|Bohr|Feynman|Planck|Newton|Maxwell|Hawking|Bell)/gi
    ];

    // Process book patterns
    bookPatterns.forEach((pattern, index) => {
      const matches = [...text.matchAll(pattern)];
      console.log(`📖 Pattern ${index} found ${matches.length} matches`);
      
      matches.forEach(match => {
        let title, author;
        
        if (index === 1) { // "'Title' by Author" pattern
          title = match[1];
          author = match[2];
        } else if (index === 2) { // "Author's book 'Title'" pattern
          title = match[2];
          author = match[1];
        } else if (index === 8) { // "Author wrote Title" pattern
          title = match[2];
          author = match[1];
        } else {
          title = match[1];
          author = match[2] || null;
        }

        if (title && title.length >= 5 && title.length <= 80 && this.isValidBookTitle(title)) {
          // Calculate confidence based on pattern strength
          let confidence = index <= 3 ? 0.8 : 0.6; // High confidence for first 4 patterns
          if (author) confidence += 0.15;
          if (title.length > 15) confidence += 0.05;
          if (this.hasBookKeywords(title)) confidence += 0.1;
          
          console.log(`📚 Found potential book: "${title}" by ${author || 'Unknown'} (confidence: ${confidence})`);
          
          found.push({
            title: this.cleanTitle(title),
            author: author ? this.cleanAuthor(author) : null,
            type: 'book',
            confidence: Math.min(confidence, 1.0),
            source: 'pattern_' + index
          });
        }
      });
    });

    // Process paper patterns
    paperPatterns.forEach((pattern, index) => {
      const matches = [...text.matchAll(pattern)];
      console.log(`🔬 Paper pattern ${index} found ${matches.length} matches`);
      
      matches.forEach(match => {
        const title = match[1];
        
        if (title && title.length >= 10 && title.length <= 150) {
          let confidence = 0.4; // Start lower for flexible patterns
          if (title.includes('Journal')) confidence += 0.2;
          if (['Nature', 'Science', 'Cell', 'PNAS', 'NEJM'].some(j => title.includes(j))) confidence += 0.3;
          if (index <= 4) confidence += 0.1; // Boost for stricter patterns
          
          console.log(`🔬 Found potential study: "${title}" (confidence: ${confidence})`);
          
          found.push({
            title: this.cleanTitle(title),
            author: null,
            type: 'paper',
            confidence: Math.min(confidence, 1.0),
            source: 'paper_pattern_' + index
          });
        }
      });
    });

    // Process product patterns
    productPatterns.forEach((pattern, index) => {
      const matches = [...text.matchAll(pattern)];
      console.log(`🛍️ Product pattern ${index} found ${matches.length} matches`);
      
      matches.forEach(match => {
        const product = match[1];
        
        if (product && product.length >= 4 && product.length <= 40 && this.isValidProduct(product)) {
          let confidence = index <= 4 ? 0.8 : 0.6; // High confidence for brand+model patterns
          
          // Boost for specific contexts
          if (index >= 5 && index <= 7) confidence += 0.1; // review, price, store patterns
          if (product.match(/Pro|Max|Plus|Ultra|Air|Mini/)) confidence += 0.1;
          
          console.log(`🛍️ Found potential product: "${product}" (confidence: ${confidence})`);
          
          found.push({
            title: this.cleanTitle(product),
            author: null,
            type: 'product',
            confidence: Math.min(confidence, 1.0),
            source: 'product_pattern_' + index
          });
        }
      });
    });

    // Process topic patterns
    topicPatterns.forEach((pattern, index) => {
      const matches = [...text.matchAll(pattern)];
      console.log(`📚 Topic pattern ${index} found ${matches.length} matches`);
      
      matches.forEach(match => {
        const topic = match[1];
        
        if (topic && topic.length >= 6 && topic.length <= 50 && this.isValidTopic(topic)) {
          let confidence = index <= 2 ? 0.7 : 0.5; // High confidence for educational/tutorial patterns
          
          // Boost for specific educational contexts
          if (index === 3 || index === 4) confidence += 0.15; // how-to, beginners patterns
          if (topic.match(/Programming|Development|Design|Marketing|Finance|Science/i)) confidence += 0.1;
          
          console.log(`📚 Found potential topic: "${topic}" (confidence: ${confidence})`);
          
          found.push({
            title: this.cleanTitle(topic),
            author: null,
            type: 'topic',
            confidence: Math.min(confidence, 1.0),
            source: 'topic_pattern_' + index
          });
        }
      });
    });

    // Process scientific concept patterns
    scientificConceptPatterns.forEach((pattern, index) => {
      const matches = [...text.matchAll(pattern)];
      console.log(`🔬 Science pattern ${index} found ${matches.length} matches`);
      
      matches.forEach(match => {
        const concept = match[1];
        
        if (concept && concept.length >= 3 && concept.length <= 60) {
          let confidence = 0.8; // High confidence for scientific concepts
          
          // Boost confidence based on pattern type
          if (index <= 1) confidence = 0.9; // Physics theories and quantum concepts
          if (index === 6 || index === 7) confidence = 0.85; // Institutions and scientists
          if (index >= 2 && index <= 5) confidence = 0.75; // Other scientific concepts
          
          console.log(`🔬 Found scientific concept: "${concept}" (confidence: ${confidence})`);
          
          found.push({
            title: this.cleanTitle(concept),
            author: null,
            type: 'paper', // Classify as paper for better Wikipedia search
            confidence: Math.min(confidence, 1.0),
            source: 'science_pattern_' + index
          });
        }
      });
    });

    // Remove duplicates and sort by confidence
    const unique = this.removeDuplicates(found);
    const sorted = unique.sort((a, b) => b.confidence - a.confidence);
    
    console.log(`📚 Found ${sorted.length} potential citations:`, sorted);
    return sorted.slice(0, 10); // Limit to top 10
  }

  cleanTitle(title) {
    return title
      .replace(/^[""']+|[""']+$/g, '') // Remove quotes
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  cleanAuthor(author) {
    return author
      .replace(/^[""']+|[""']+$/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  removeDuplicates(citations) {
    const seen = new Set();
    return citations.filter(citation => {
      const key = citation.title.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // Validation methods for better filtering
  isValidBookTitle(title) {
    // Filter out common false positives
    const invalidPatterns = [
      /^(this|that|these|those|here|there|now|then|today|tomorrow|yesterday)$/i,
      /^(video|channel|content|episode|part|section|chapter)$/i,
      /^(link|description|comment|like|subscribe|notification)$/i,
      /^(website|platform|app|software|program|system)$/i,
      /^\d+$/,  // Just numbers
      /^[a-z\s]+$/,  // All lowercase (likely not a title)
    ];
    
    return !invalidPatterns.some(pattern => pattern.test(title.trim()));
  }

  hasBookKeywords(title) {
    const bookKeywords = ['guide', 'handbook', 'manual', 'story', 'tale', 'chronicles', 'saga', 'memoir', 'biography', 'autobiography'];
    return bookKeywords.some(keyword => title.toLowerCase().includes(keyword));
  }

  isValidProduct(product) {
    // Must contain brand indicators or model patterns
    const brandPatterns = [
      /iPhone|iPad|MacBook|iMac|Apple/i,
      /Samsung|Galaxy/i,
      /Google|Pixel/i,
      /Sony|Canon|Nikon/i,
      /Tesla|Model/i,
      /Pro|Max|Plus|Ultra|Air|Mini/i,
      /\d+/  // Contains numbers (model numbers)
    ];
    
    return brandPatterns.some(pattern => pattern.test(product));
  }

  isValidTopic(topic) {
    // Filter out overly generic or invalid topics
    const invalidTopics = [
      /^(this|that|these|those|here|there|now|then)$/i,
      /^(video|channel|content|tutorial|guide)$/i,
      /^(today|tomorrow|yesterday|week|month|year)$/i,
      /^\d+$/,  // Just numbers
      /^(a|an|the|and|or|but|so|if|when|where|why|how)$/i, // Common words
    ];
    
    const validTopicKeywords = [
      'programming', 'development', 'design', 'marketing', 'finance', 'science',
      'technology', 'business', 'education', 'learning', 'training', 'course',
      'physics', 'quantum', 'mechanics', 'theory', 'mathematics', 'engineering',
      'computer', 'artificial', 'intelligence', 'machine', 'chemistry', 'biology'
    ];
    
    // Always allow scientific terms that are commonly used
    const scientificTerms = [
      'quantum', 'mechanics', 'physics', 'relativity', 'thermodynamics',
      'electromagnetism', 'superposition', 'entanglement', 'wavelength',
      'frequency', 'amplitude', 'particle', 'wave', 'electron', 'photon'
    ];
    
    const topicLower = topic.toLowerCase();
    
    return !invalidTopics.some(pattern => pattern.test(topic.trim())) &&
           (topic.length > 8 || 
            validTopicKeywords.some(keyword => topicLower.includes(keyword)) ||
            scientificTerms.some(term => topicLower.includes(term)));
  }

  // Enhanced API integration for all citation types
  async enrichWithAPIs(citations) {
    console.log('🔍 Enriching citations with API data...');
    const enriched = [];
    
    for (const citation of citations) {
      try {
        let enrichedData = null;
        
        if (citation.type === 'book') {
          // Try Google Books first
          enrichedData = await this.searchGoogleBooks(citation.title, citation.author);
          
          // Fallback to Wikipedia for books not found in Google Books
          if (!enrichedData) {
            console.log(`📚 Google Books failed for "${citation.title}", trying Wikipedia fallback...`);
            enrichedData = await this.searchWikipedia(citation.title, 'book');
          }
        } else if (citation.type === 'paper') {
          // For papers/studies, try Wikipedia first (better for academic content)
          enrichedData = await this.searchWikipedia(citation.title, 'paper');
          
          // Fallback to Google Books (sometimes has academic papers)
          if (!enrichedData) {
            console.log(`🔬 Wikipedia failed for paper "${citation.title}", trying Google Books fallback...`);
            enrichedData = await this.searchGoogleBooks(citation.title, citation.author);
          }
        } else if (citation.type === 'product') {
          enrichedData = await this.enrichProduct(citation.title);
        } else if (citation.type === 'topic') {
          enrichedData = await this.searchWikipedia(citation.title, 'topic');
        }
        
        if (enrichedData) {
          enriched.push({
            ...citation,
            ...enrichedData,
            confidence: Math.min(citation.confidence + 0.1, 1.0) // Boost confidence if found
          });
        } else {
          // If all APIs fail, still provide basic search links
          enriched.push({
            ...citation,
            googleSearchLink: `https://www.google.com/search?q=${encodeURIComponent(citation.title + (citation.author ? ' ' + citation.author : ''))}`,
            youtubeSearchLink: `https://www.youtube.com/results?search_query=${encodeURIComponent(citation.title)}`
          });
        }
      } catch (error) {
        console.warn('Failed to enrich citation:', citation.title, error);
        enriched.push(citation);
      }
    }
    
    return enriched;
  }

  async searchGoogleBooks(title, author = null) {
    try {
      // Build search query
      let query = `intitle:"${title}"`;
      if (author) {
        query += `+inauthor:"${author}"`;
      }
      
      // For demo purposes, we'll use a free endpoint (no API key required)
      // In production, you'd want to use the official API with your key
      const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=1`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('API request failed');
      
      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        const book = data.items[0].volumeInfo;
        return {
          title: book.title || title,
          author: book.authors ? book.authors.join(', ') : author,
          description: book.description ? book.description.substring(0, 200) + '...' : null,
          thumbnail: book.imageLinks?.thumbnail || null,
          publishedDate: book.publishedDate || null,
          pageCount: book.pageCount || null,
          googleBooksLink: data.items[0].volumeInfo.infoLink || null,
          amazonLink: this.generateAmazonLink(book.title, book.authors?.[0])
        };
      }
    } catch (error) {
      console.warn('Google Books API error:', error);
    }
    
    return null;
  }

  generateAmazonLink(title, author) {
    const searchTerm = author ? `${title} ${author}` : title;
    return `https://www.amazon.com/s?k=${encodeURIComponent(searchTerm)}&i=stripbooks`;
  }

  // Product enrichment
  async enrichProduct(productName) {
    try {
      // For products, we'll create rich shopping links and basic info
      return {
        title: productName,
        description: `Product mentioned in video: ${productName}`,
        amazonLink: `https://www.amazon.com/s?k=${encodeURIComponent(productName)}`,
        googleShoppingLink: `https://shopping.google.com/search?q=${encodeURIComponent(productName)}`,
        ebayLink: `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(productName)}`,
        youtubeSearchLink: `https://www.youtube.com/results?search_query=${encodeURIComponent(productName + ' review')}`
      };
    } catch (error) {
      console.warn('Product enrichment error:', error);
      return null;
    }
  }

  // Enhanced Wikipedia API with academic paper support
  async searchWikipedia(query, contentType = 'topic') {
    try {
      console.log(`🔍 Searching Wikipedia for ${contentType}: "${query}"`);
      
      // For papers, try different search strategies
      let searchQueries = [query];
      if (contentType === 'paper') {
        // Add variations for academic papers
        searchQueries = [
          query,
          query.replace(/study|research|paper|journal/gi, '').trim(), // Remove common paper words
          ...this.extractPaperKeywords(query) // Extract key concepts
        ].filter(q => q && q.length > 3);
      }
      
      // Try direct page lookup first
      for (const searchQuery of searchQueries) {
        const directResult = await this.tryDirectWikipediaPage(searchQuery, contentType);
        if (directResult) return directResult;
      }
      
      // Fallback to search API with enhanced queries
      for (const searchQuery of searchQueries) {
        const searchResult = await this.searchWikipediaPages(searchQuery, contentType);
        if (searchResult) return searchResult;
      }
      
      return null;
    } catch (error) {
      console.warn('Wikipedia API error:', error);
      return null;
    }
  }

  async tryDirectWikipediaPage(query, contentType) {
    try {
      const searchUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
      const response = await fetch(searchUrl);
      
      if (response.ok) {
        const data = await response.json();
        return this.formatWikipediaResult(data, query, contentType, 'direct');
      }
    } catch (error) {
      // Silent fail, will try search API
    }
    return null;
  }

  async searchWikipediaPages(query, contentType) {
    try {
      // Enhanced search query based on content type
      let searchTerm = query;
      if (contentType === 'paper') {
        searchTerm += ' study research science'; // Add academic keywords
      } else if (contentType === 'book') {
        searchTerm += ' book author'; // Add book-related keywords
      }
      
      const searchApiUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(searchTerm)}&srlimit=5&origin=*`;
      const searchResponse = await fetch(searchApiUrl);
      const searchData = await searchResponse.json();
      
      if (searchData.query && searchData.query.search && searchData.query.search.length > 0) {
        // Filter results based on content type
        const filteredResults = this.filterSearchResults(searchData.query.search, contentType);
        
        if (filteredResults.length > 0) {
          const firstResult = filteredResults[0];
          
          // Get full page data for the best result
          try {
            const pageData = await this.tryDirectWikipediaPage(firstResult.title, contentType);
            if (pageData) return pageData;
          } catch (error) {
            // Use search result data if page fetch fails
          }
          
          return {
            title: firstResult.title,
            description: firstResult.snippet.replace(/<[^>]*>/g, ''), // Remove HTML tags
            wikipediaLink: `https://en.wikipedia.org/wiki/${encodeURIComponent(firstResult.title)}`,
            ...this.generateSearchLinks(firstResult.title, contentType),
            source: 'wikipedia_search'
          };
        }
      }
    } catch (error) {
      console.warn('Wikipedia search API error:', error);
    }
    return null;
  }

  formatWikipediaResult(data, originalQuery, contentType, source) {
    return {
      title: data.title || originalQuery,
      description: data.extract ? data.extract.substring(0, 250) + '...' : null,
      thumbnail: data.thumbnail?.source || null,
      wikipediaLink: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(data.title)}`,
      ...this.generateSearchLinks(data.title, contentType),
      source: `wikipedia_${source}`
    };
  }

  generateSearchLinks(title, contentType) {
    const baseLinks = {
      googleSearchLink: `https://www.google.com/search?q=${encodeURIComponent(title)}`,
      youtubeSearchLink: `https://www.youtube.com/results?search_query=${encodeURIComponent(title)}`
    };

    if (contentType === 'paper') {
      return {
        ...baseLinks,
        googleScholarLink: `https://scholar.google.com/scholar?q=${encodeURIComponent(title)}`,
        youtubeSearchLink: `https://www.youtube.com/results?search_query=${encodeURIComponent(title + ' explained research')}`
      };
    } else if (contentType === 'book') {
      return {
        ...baseLinks,
        amazonLink: `https://www.amazon.com/s?k=${encodeURIComponent(title)}&i=stripbooks`,
        youtubeSearchLink: `https://www.youtube.com/results?search_query=${encodeURIComponent(title + ' book review')}`
      };
    }

    return {
      ...baseLinks,
      youtubeSearchLink: `https://www.youtube.com/results?search_query=${encodeURIComponent(title + ' explained')}`
    };
  }

  extractPaperKeywords(paperTitle) {
    // Extract key scientific/academic terms from paper titles
    const keywords = [];
    const scientificTerms = paperTitle.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
    
    // Add combinations of terms
    scientificTerms.forEach(term => {
      if (term.length > 4 && !['Study', 'Research', 'Journal', 'Published'].includes(term)) {
        keywords.push(term);
      }
    });

    return keywords.slice(0, 3); // Limit to top 3 keywords
  }

  filterSearchResults(results, contentType) {
    if (contentType === 'paper') {
      // Prioritize academic-sounding pages
      return results.sort((a, b) => {
        const aScore = this.getAcademicScore(a.title + ' ' + a.snippet);
        const bScore = this.getAcademicScore(b.title + ' ' + b.snippet);
        return bScore - aScore;
      });
    } else if (contentType === 'book') {
      // Prioritize book-related pages
      return results.sort((a, b) => {
        const aScore = this.getBookScore(a.title + ' ' + a.snippet);
        const bScore = this.getBookScore(b.title + ' ' + b.snippet);
        return bScore - aScore;
      });
    }
    
    return results; // Return as-is for topics
  }

  getAcademicScore(text) {
    const academicKeywords = ['research', 'study', 'science', 'university', 'journal', 'published', 'analysis', 'theory', 'method'];
    return academicKeywords.reduce((score, keyword) => {
      return score + (text.toLowerCase().includes(keyword) ? 1 : 0);
    }, 0);
  }

  getBookScore(text) {
    const bookKeywords = ['book', 'author', 'novel', 'published', 'writer', 'literature', 'biography', 'memoir'];
    return bookKeywords.reduce((score, keyword) => {
      return score + (text.toLowerCase().includes(keyword) ? 1 : 0);
    }, 0);
  }
}

// Clean up existing UI elements
function cleanupUI() {
  console.log('🧹 Cleaning up existing UI...');
  
  // Remove existing toggle button
  const existingButton = document.querySelector('[data-citation-toggle]');
  if (existingButton) {
    existingButton.remove();
  }
  
  // Remove existing sidebar
  const existingSidebar = document.querySelector('[data-citation-sidebar]');
  if (existingSidebar) {
    existingSidebar.remove();
  }
  
  // Remove existing styles
  const existingStyles = document.querySelector('[data-citation-styles]');
  if (existingStyles) {
    existingStyles.remove();
  }
}

function createUI() {
  console.log('📚 Creating beautiful citation UI...');
  
  // Clean up any existing UI first
  cleanupUI();
  
  // Create toggle button with modern design
  const toggleButton = document.createElement('button');
  toggleButton.setAttribute('data-citation-toggle', 'true'); // Add identifier
  toggleButton.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
    </svg>
    <span style="margin-left: 6px; font-size: 12px; font-weight: 500;">Citations</span>
  `;
  
  toggleButton.style.cssText = `
    position: fixed;
    top: 120px;
    right: 24px;
    display: flex;
    align-items: center;
    padding: 12px 16px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 24px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    cursor: pointer;
    z-index: 999999;
    box-shadow: 0 8px 32px rgba(102, 126, 234, 0.4);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  `;
  
  // Add hover effects
  toggleButton.addEventListener('mouseenter', () => {
    toggleButton.style.transform = 'translateY(-2px) scale(1.05)';
    toggleButton.style.boxShadow = '0 12px 40px rgba(102, 126, 234, 0.6)';
  });
  
  toggleButton.addEventListener('mouseleave', () => {
    toggleButton.style.transform = 'translateY(0) scale(1)';
    toggleButton.style.boxShadow = '0 8px 32px rgba(102, 126, 234, 0.4)';
  });
  
  // Create modern sidebar
  const sidebar = document.createElement('div');
  sidebar.setAttribute('data-citation-sidebar', 'true'); // Add identifier
  sidebar.style.cssText = `
    position: fixed;
    top: 0;
    right: -420px;
    width: 420px;
    height: 100vh;
    background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
    border-left: 1px solid rgba(226, 232, 240, 0.8);
    z-index: 999998;
    transition: right 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    overflow-y: auto;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    box-shadow: -20px 0 60px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(20px);
  `;
  
  sidebar.innerHTML = `
    <div style="
      padding: 24px;
      border-bottom: 1px solid rgba(226, 232, 240, 0.8);
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    ">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <div>
          <h2 style="margin: 0; font-size: 20px; font-weight: 600;">🔍 Smart Citations</h2>
          <p style="margin: 4px 0 0 0; font-size: 14px; opacity: 0.9;">Books • Products • Topics • Studies</p>
        </div>
        <button id="close-sidebar" style="
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        ">✕</button>
      </div>
    </div>
    
    <div style="padding: 24px;">
      <div id="citations-status" style="
        display: flex;
        align-items: center;
        padding: 16px;
        background: linear-gradient(135deg, #e0f2fe 0%, #f3e5f5 100%);
        border-radius: 12px;
        margin-bottom: 20px;
        border: 1px solid rgba(102, 126, 234, 0.2);
      ">
        <div class="loading-spinner" style="
          width: 20px;
          height: 20px;
          border: 2px solid #e3f2fd;
          border-top: 2px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-right: 12px;
        "></div>
        <span style="color: #667eea; font-weight: 500;">Analyzing video content...</span>
      </div>
      
      <div id="citations-list"></div>
    </div>
  `;
  
  // Add CSS animation for spinner
  const style = document.createElement('style');
  style.setAttribute('data-citation-styles', 'true'); // Add identifier
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .citation-card {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .citation-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 40px rgba(102, 126, 234, 0.15) !important;
    }
  `;
  document.head.appendChild(style);
  
  let isOpen = false;
  
  // Toggle button click handler
  toggleButton.addEventListener('click', () => {
    isOpen = !isOpen;
    sidebar.style.right = isOpen ? '0px' : '-420px';
    
    if (isOpen) {
      toggleButton.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
      toggleButton.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        </svg>
        <span style="margin-left: 6px; font-size: 12px; font-weight: 500;">Active</span>
      `;
    } else {
      toggleButton.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      toggleButton.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
        </svg>
        <span style="margin-left: 6px; font-size: 12px; font-weight: 500;">Citations</span>
      `;
    }
  });
  
  // Close button handler
  sidebar.addEventListener('click', (e) => {
    if (e.target.id === 'close-sidebar') {
      isOpen = false;
      sidebar.style.right = '-420px';
      toggleButton.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      toggleButton.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
        </svg>
        <span style="margin-left: 6px; font-size: 12px; font-weight: 500;">Citations</span>
      `;
    }
  });
  
  document.body.appendChild(toggleButton);
  document.body.appendChild(sidebar);
  
  // Store references for cleanup
  uiElements = { toggleButton, sidebar, style };
  
  console.log('✅ Beautiful UI created successfully!');
  return { toggleButton, sidebar };
}

// Get video transcript/captions
async function getVideoText() {
  console.log('🎬 Attempting to get real video captions...');
  
  try {
    // Method 1: Try to extract from YouTube's player data
    const transcriptFromPlayer = await extractFromYouTubePlayer();
    if (transcriptFromPlayer) {
      console.log('✅ Got transcript from YouTube player data');
      return transcriptFromPlayer;
    }

    // Method 2: Try to access transcript panel
    const transcriptFromPanel = await extractFromTranscriptPanel();
    if (transcriptFromPanel) {
      console.log('✅ Got transcript from transcript panel');
      return transcriptFromPanel;
    }

    // Method 3: Try to get from video tracks
    const transcriptFromTracks = await extractFromVideoTracks();
    if (transcriptFromTracks) {
      console.log('✅ Got transcript from video tracks');
      return transcriptFromTracks;
    }

  } catch (error) {
    console.warn('Error extracting real transcript:', error);
  }
  
  // Fallback: return sample text for testing
  console.log('📝 Using sample text for testing...');
  return "Check out the book 'Sapiens' by Yuval Noah Harari. Also, there's an interesting study published in Science about human evolution. I recommend reading 'Atomic Habits' by James Clear.";
}

// Extract transcript from YouTube's internal player data
async function extractFromYouTubePlayer() {
  try {
    // Look for ytInitialPlayerResponse in page scripts
    const scripts = document.querySelectorAll('script');
    for (const script of scripts) {
      const content = script.textContent || '';
      if (content.includes('ytInitialPlayerResponse')) {
        const match = content.match(/var ytInitialPlayerResponse\s*=\s*({.+?});/);
        if (match) {
          const playerResponse = JSON.parse(match[1]);
          const captions = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
          
          if (captions && captions.length > 0) {
            // Find English captions
            const englishCaptions = captions.find(track => 
              track.languageCode === 'en' || track.languageCode === 'en-US'
            );
            
            if (englishCaptions && englishCaptions.baseUrl) {
              console.log('🎯 Found English captions URL');
              const response = await fetch(englishCaptions.baseUrl);
              const xmlText = await response.text();
              return parseTranscriptXML(xmlText);
            }
          }
        }
      }
    }
  } catch (error) {
    console.warn('Failed to extract from player data:', error);
  }
  return null;
}

// Extract from transcript panel if available
async function extractFromTranscriptPanel() {
  try {
    // Look for transcript button
    const transcriptButtons = document.querySelectorAll('button[aria-label*="transcript" i], button[aria-label*="Show transcript" i]');
    
    for (const button of transcriptButtons) {
      if (button.textContent.toLowerCase().includes('transcript') || 
          button.getAttribute('aria-label')?.toLowerCase().includes('transcript')) {
        
        console.log('🎯 Found transcript button, clicking...');
        button.click();
        
        // Wait for transcript panel to load
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Look for transcript segments
        const segments = document.querySelectorAll('[data-testid="transcript-segment"], .ytd-transcript-segment-renderer');
        if (segments.length > 0) {
          const text = Array.from(segments)
            .map(segment => segment.textContent?.trim())
            .filter(text => text && text.length > 0)
            .join(' ');
          
          if (text.length > 100) {
            return text;
          }
        }
      }
    }
  } catch (error) {
    console.warn('Failed to extract from transcript panel:', error);
  }
  return null;
}

// Extract from video text tracks
async function extractFromVideoTracks() {
  try {
    const video = document.querySelector('video');
    if (!video) return null;
    
    const tracks = video.textTracks;
    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];
      if ((track.kind === 'captions' || track.kind === 'subtitles') && 
          track.language.startsWith('en')) {
        
        console.log('🎯 Found English text track:', track.label);
        
        // Enable the track
        track.mode = 'showing';
        
        // Wait a bit for cues to load
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (track.cues && track.cues.length > 0) {
          const text = Array.from(track.cues)
            .map(cue => cue.text)
            .join(' ');
          
          if (text.length > 100) {
            return text;
          }
        }
      }
    }
  } catch (error) {
    console.warn('Failed to extract from video tracks:', error);
  }
  return null;
}

// Parse XML transcript format
function parseTranscriptXML(xmlText) {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    const textElements = xmlDoc.querySelectorAll('text');
    
    const transcript = Array.from(textElements)
      .map(element => element.textContent?.trim())
      .filter(text => text && text.length > 0)
      .join(' ');
    
    // Clean up HTML entities
    return transcript
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
      
  } catch (error) {
    console.warn('Failed to parse transcript XML:', error);
    return null;
  }
}

// Global variables for video change detection
let isAnalyzing = false;

// Extract video ID from URL
function getCurrentVideoId() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('v');
}

// Analyze current video
async function analyzeCurrentVideo() {
  if (isAnalyzing) {
    console.log('⏳ Analysis already in progress, skipping...');
    return;
  }
  
  isAnalyzing = true;
  console.log('🔍 Starting video analysis...');
  
  try {
    const text = await getVideoText();
    if (text) {
      console.log('📝 Analyzing text for citations...');
      
      // Update status to show enrichment phase
      const statusDiv = document.getElementById('citations-status');
      if (statusDiv) {
        statusDiv.innerHTML = `
          <div class="loading-spinner" style="
            width: 20px;
            height: 20px;
            border: 2px solid #e3f2fd;
            border-top: 2px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-right: 12px;
          "></div>
          <span style="color: #667eea; font-weight: 500;">Enriching citations with source data...</span>
        `;
      }
      
      // Detect citations
      const rawCitations = detector.detectCitations(text);
      console.log('📚 Found raw citations:', rawCitations);
      
      // Filter citations with minimum confidence threshold
      const filteredCitations = rawCitations.filter(citation => citation.confidence >= 0.5);
      console.log('🎯 Filtered citations (confidence >= 0.5):', filteredCitations);
      
      // Enrich with API data (Books, Products, Topics)
      const enrichedCitations = await detector.enrichWithAPIs(filteredCitations);
      console.log('📖 Enriched citations:', enrichedCitations);
      
      // Update UI
      updateCitationsUI(enrichedCitations);
    }
  } catch (error) {
    console.error('❌ Error analyzing video:', error);
    showErrorState();
  } finally {
    isAnalyzing = false;
  }
}

// Update citations UI
function updateCitationsUI(citations) {
  const citationsList = document.getElementById('citations-list');
  const statusDiv = document.getElementById('citations-status');
  
  if (!citationsList || !statusDiv) return;
  
  if (citations.length > 0) {
    // Hide loading status
    statusDiv.style.display = 'none';
    
    // Show enriched citations with beautiful cards
    citationsList.innerHTML = citations.map((citation, index) => {
      const typeIcon = citation.type === 'book' ? '📚' : 
                     citation.type === 'paper' ? '🔬' : 
                     citation.type === 'product' ? '🛍️' : 
                     citation.type === 'topic' ? '💡' : '📄';
      const typeColor = citation.type === 'book' ? '#8b5cf6' : 
                      citation.type === 'paper' ? '#06b6d4' : 
                      citation.type === 'product' ? '#f59e0b' : 
                      citation.type === 'topic' ? '#10b981' : '#6b7280';
      const confidenceColor = citation.confidence > 0.7 ? '#10b981' : citation.confidence > 0.5 ? '#f59e0b' : '#ef4444';
      
      return createCitationCard(citation, index, typeIcon, typeColor, confidenceColor);
    }).join('');
  } else {
    // Show no citations found
    statusDiv.innerHTML = `
      <div style="
        display: flex;
        align-items: center;
        padding: 16px;
        background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
        border-radius: 12px;
        border: 1px solid rgba(245, 158, 11, 0.2);
      ">
        <span style="font-size: 24px; margin-right: 12px;">🔍</span>
        <div>
          <div style="color: #92400e; font-weight: 600; margin-bottom: 4px;">No high-quality citations found</div>
          <div style="color: #a16207; font-size: 13px;">This video may not contain clear book, product, or study references</div>
        </div>
      </div>
    `;
    citationsList.innerHTML = '';
  }
}

// Create citation card HTML
function createCitationCard(citation, index, typeIcon, typeColor, confidenceColor) {
  return `
    <div class="citation-card" style="
      margin-bottom: 16px;
      padding: 20px;
      background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
      border: 1px solid rgba(226, 232, 240, 0.8);
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(102, 126, 234, 0.08);
      cursor: pointer;
      position: relative;
      overflow: hidden;
    ">
      <div style="
        position: absolute;
        top: 0;
        left: 0;
        width: 4px;
        height: 100%;
        background: ${typeColor};
      "></div>
      
      ${citation.thumbnail ? `
        <div style="display: flex; margin-bottom: 16px;">
          <img src="${citation.thumbnail}" style="
            width: 60px;
            height: 80px;
            object-fit: cover;
            border-radius: 8px;
            margin-right: 16px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          " />
          <div style="flex: 1;">
      ` : '<div>'}
      
      <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 12px;">
        <div style="display: flex; align-items: center;">
          <span style="font-size: 24px; margin-right: 12px;">${typeIcon}</span>
          <div>
            <span style="
              background: ${typeColor}20;
              color: ${typeColor};
              padding: 4px 8px;
              border-radius: 12px;
              font-size: 11px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            ">${citation.type}</span>
          </div>
        </div>
        
        <div style="
          background: ${confidenceColor}20;
          color: ${confidenceColor};
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
        ">${Math.round(citation.confidence * 100)}%</div>
      </div>
      
      <h3 style="
        margin: 0 0 8px 0;
        font-size: 16px;
        font-weight: 600;
        color: #1e293b;
        line-height: 1.4;
      ">${citation.title}</h3>
      
      ${citation.author ? `
        <p style="
          margin: 0 0 8px 0;
          font-size: 14px;
          color: #64748b;
          font-style: italic;
        ">by ${citation.author}</p>
      ` : ''}
      
      ${citation.publishedDate ? `
        <p style="
          margin: 0 0 8px 0;
          font-size: 12px;
          color: #94a3b8;
        ">Published: ${citation.publishedDate}</p>
      ` : ''}
      
      ${citation.description ? `
        <p style="
          margin: 0 0 12px 0;
          font-size: 13px;
          color: #64748b;
          line-height: 1.4;
        ">${citation.description}</p>
      ` : ''}
      
      ${citation.thumbnail ? '</div></div>' : '</div>'}
      
      <div style="
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid rgba(226, 232, 240, 0.6);
        gap: 8px;
      ">
        <span style="
          font-size: 12px;
          color: #94a3b8;
          font-weight: 500;
        ">Citation #${index + 1}</span>
        
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          ${createActionButtons(citation)}
        </div>
      </div>
    </div>
  `;
}

// Create action buttons for citation
function createActionButtons(citation) {
  let buttons = '';
  
  // Google Books for books
  if (citation.googleBooksLink) {
    buttons += `<a href="${citation.googleBooksLink}" target="_blank" style="background: linear-gradient(135deg, #4285f4 0%, #34a853 100%); color: white; border: none; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 500; text-decoration: none; transition: all 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">📖 Google Books</a>`;
  }
  
  // Google Scholar for academic papers
  if (citation.googleScholarLink) {
    buttons += `<a href="${citation.googleScholarLink}" target="_blank" style="background: linear-gradient(135deg, #4285f4 0%, #1a73e8 100%); color: white; border: none; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 500; text-decoration: none; transition: all 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">🎓 Scholar</a>`;
  }
  
  // Wikipedia for all content types
  if (citation.wikipediaLink) {
    buttons += `<a href="${citation.wikipediaLink}" target="_blank" style="background: linear-gradient(135deg, #000000 0%, #333333 100%); color: white; border: none; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 500; text-decoration: none; transition: all 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">📖 Wikipedia</a>`;
  }
  
  // Amazon for books and products
  if (citation.amazonLink) {
    buttons += `<a href="${citation.amazonLink}" target="_blank" style="background: linear-gradient(135deg, #ff9900 0%, #ff6600 100%); color: white; border: none; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 500; text-decoration: none; transition: all 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">🛒 Amazon</a>`;
  }
  
  // Google Shopping for products
  if (citation.googleShoppingLink) {
    buttons += `<a href="${citation.googleShoppingLink}" target="_blank" style="background: linear-gradient(135deg, #4285f4 0%, #0f9d58 100%); color: white; border: none; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 500; text-decoration: none; transition: all 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">🛍️ Shopping</a>`;
  }
  
  // YouTube search for all content types
  if (citation.youtubeSearchLink) {
    buttons += `<a href="${citation.youtubeSearchLink}" target="_blank" style="background: linear-gradient(135deg, #ff0000 0%, #cc0000 100%); color: white; border: none; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 500; text-decoration: none; transition: all 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">📺 YouTube</a>`;
  }
  
  // Google Search as fallback
  if (citation.googleSearchLink) {
    buttons += `<a href="${citation.googleSearchLink}" target="_blank" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 500; text-decoration: none; transition: all 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">🔍 Search</a>`;
  }
  
  // Fallback search if no links are available
  if (!buttons) {
    buttons = `<button onclick="window.open('https://www.google.com/search?q=${encodeURIComponent(citation.title + (citation.author ? ' ' + citation.author : ''))}', '_blank')" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">🔍 Search</button>`;
  }
  
  return buttons;
}

// Show error state
function showErrorState() {
  const statusDiv = document.getElementById('citations-status');
  if (statusDiv) {
    statusDiv.innerHTML = `
      <div style="
        display: flex;
        align-items: center;
        padding: 16px;
        background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
        border-radius: 12px;
        border: 1px solid rgba(239, 68, 68, 0.2);
      ">
        <span style="font-size: 24px; margin-right: 12px;">⚠️</span>
        <div>
          <div style="color: #dc2626; font-weight: 600; margin-bottom: 4px;">Analysis failed</div>
          <div style="color: #b91c1c; font-size: 13px;">Could not extract video content</div>
        </div>
      </div>
    `;
  }
}

// Check for video changes and re-analyze
function checkForVideoChange() {
  const newVideoId = getCurrentVideoId();
  
  // Also check if we've navigated away from a video page
  if (!window.location.pathname.includes('/watch')) {
    if (currentVideoId) {
      console.log('🚪 Left video page, cleaning up...');
      cleanupUI();
      currentVideoId = null;
    }
    return;
  }
  
  if (newVideoId && newVideoId !== currentVideoId) {
    console.log(`🔄 Video changed from ${currentVideoId} to ${newVideoId}`);
    currentVideoId = newVideoId;
    
    // Recreate UI for new video
    createUI();
    
    // Reset UI state
    const statusDiv = document.getElementById('citations-status');
    const citationsList = document.getElementById('citations-list');
    
    if (statusDiv) {
      statusDiv.style.display = 'block';
      statusDiv.innerHTML = `
        <div class="loading-spinner" style="
          width: 20px;
          height: 20px;
          border: 2px solid #e3f2fd;
          border-top: 2px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-right: 12px;
        "></div>
        <span style="color: #667eea; font-weight: 500;">Analyzing new video content...</span>
      `;
    }
    
    if (citationsList) {
      citationsList.innerHTML = '';
    }
    
    // Analyze new video after a delay
    setTimeout(() => {
      analyzeCurrentVideo();
    }, 2000);
  }
}

// Enhanced initialization with better SPA handling
async function init() {
  console.log('🚀 Initializing Citation Cross-Reference...');
  
  // Initialize detector first
  detector = new EnhancedCitationDetector();
  
  // Check if we're on a video page initially
  if (window.location.pathname.includes('/watch')) {
    console.log('✅ On YouTube video page, proceeding...');
    
    // Wait a bit for YouTube to load
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Create UI
    createUI();
    
    // Set initial video ID
    currentVideoId = getCurrentVideoId();
    
    // Start initial analysis
    setTimeout(() => {
      analyzeCurrentVideo();
    }, 2000);
  } else {
    console.log('❌ Not on a video page initially');
  }
  
  // Set up video change detection (runs regardless of initial page)
  setInterval(checkForVideoChange, 1000);
  
  console.log('✅ Citation Cross-Reference initialized!');
}

// Start initialization
init().catch(console.error);

// Make detector available globally for testing
window.CitationCrossReference = {
  detector: new EnhancedCitationDetector(),
  initialized: true,
  analyzeCurrentVideo,
  getCurrentVideoId,
  // Debug functions
  async testTranscript() {
    const text = await getVideoText();
    console.log('🧪 Testing transcript extraction:');
    console.log('📄 Full transcript:', text);
    console.log('📏 Length:', text?.length || 0);
    return text;
  },
  async testDetection() {
    const text = await getVideoText();
    if (text) {
      const citations = detector.detectCitations(text);
      console.log('🧪 Testing citation detection:');
      console.log('📊 Found citations:', citations);
      return citations;
    }
    return [];
  }
};

console.log('✅ Global CitationCrossReference assigned:', window.CitationCrossReference); 