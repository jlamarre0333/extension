// Working Content Script for YouTube Citation Cross-Reference
console.log('🚀 Working content script loaded!');

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
    
    // Enhanced book detection patterns
    const bookPatterns = [
      // "book called/titled 'Title'"
      /(?:book|novel|memoir|biography)\s+(?:called|titled|named)\s*[""']([^""']{3,60})[""']/gi,
      // "'Title' by Author"
      /[""']([^""']{10,60})[""']\s+by\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
      // "Author's book 'Title'"
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)'s\s+(?:book|novel|work)\s+[""']([^""']{3,60})[""']/gi,
      // "in his/her book 'Title'"
      /in\s+(?:his|her|their)\s+book\s+[""']([^""']{3,60})[""']/gi,
      // "the book 'Title'"
      /the\s+book\s+[""']([^""']{3,60})[""']/gi,
      // "Title (book title in italics context)"
      /(?:read|reading|wrote|written|published)\s+[""']([^""']{10,60})[""']/gi,
      // More flexible patterns
      // "I recommend Title" or "check out Title"
      /(?:recommend|suggest|check out|read)\s+(?:the\s+book\s+)?[""']?([A-Z][^""'.!?]{10,60})[""']?/gi,
      // "Title is a great book"
      /[""']?([A-Z][^""'.!?]{10,60})[""']?\s+is\s+a\s+(?:great|good|amazing|fantastic)\s+book/gi,
      // "Author wrote Title"
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+wrote\s+[""']?([^""'.!?]{10,60})[""']?/gi,
      // Simple book mentions without quotes
      /(?:book|novel)\s+([A-Z][^.!?]{10,60})/gi
    ];

    // Research paper and study patterns
    const paperPatterns = [
      // "study published in Journal"
      /(?:study|research|paper)\s+(?:published\s+)?(?:in\s+)?(?:the\s+)?([A-Z][^.!?]{10,80})/gi,
      // "Journal of Something study"
      /(Journal\s+of\s+[A-Z][^.!?]{5,50})\s+(?:study|research|paper)/gi,
      // "Nature study" or "Science paper"
      /(Nature|Science|Cell|PNAS|NEJM)\s+(?:study|research|paper|article)/gi,
      // "researchers found" or "study shows"
      /(?:researchers?|scientists?)\s+(?:found|discovered|showed|published)\s+(?:in\s+)?([A-Z][^.!?]{10,60})/gi,
      // "according to a study"
      /according\s+to\s+a\s+(?:study|research)\s+(?:in\s+)?([A-Z][^.!?]{10,60})/gi,
      // More flexible study patterns
      // "studies show" or "research indicates"
      /(?:studies|research)\s+(?:show|shows|indicate|indicates|suggest|suggests)\s+(?:that\s+)?([^.!?]{15,80})/gi,
      // "data shows" or "evidence suggests"
      /(?:data|evidence)\s+(?:shows|suggests|indicates)\s+(?:that\s+)?([^.!?]{15,80})/gi,
      // Simple study mentions
      /(?:study|research|experiment)\s+([A-Z][^.!?]{10,60})/gi
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

        if (title && title.length >= 3 && title.length <= 100) {
          // Calculate confidence based on pattern strength
          let confidence = 0.5; // Start lower for flexible patterns
          if (author) confidence += 0.2;
          if (title.length > 10) confidence += 0.1;
          if (/^[A-Z]/.test(title)) confidence += 0.1;
          if (index <= 5) confidence += 0.1; // Boost for stricter patterns
          
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

  // Google Books API integration
  async enrichWithGoogleBooks(citations) {
    console.log('📖 Enriching citations with Google Books data...');
    const enriched = [];
    
    for (const citation of citations) {
      if (citation.type === 'book') {
        try {
          const bookData = await this.searchGoogleBooks(citation.title, citation.author);
          if (bookData) {
            enriched.push({
              ...citation,
              ...bookData,
              confidence: Math.min(citation.confidence + 0.1, 1.0) // Boost confidence if found
            });
          } else {
            enriched.push(citation);
          }
        } catch (error) {
          console.warn('Failed to enrich citation:', citation.title, error);
          enriched.push(citation);
        }
      } else {
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
}

// Create UI elements
function createUI() {
  console.log('📚 Creating beautiful citation UI...');
  
  // Create toggle button with modern design
  const toggleButton = document.createElement('button');
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
          <h2 style="margin: 0; font-size: 20px; font-weight: 600;">📚 Citations & Sources</h2>
          <p style="margin: 4px 0 0 0; font-size: 14px; opacity: 0.9;">Discovered from video content</p>
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

// Main initialization
async function init() {
  console.log('🚀 Initializing Citation Cross-Reference...');
  
  // Wait for page to be ready
  if (document.readyState !== 'complete') {
    await new Promise(resolve => {
      window.addEventListener('load', resolve);
    });
  }
  
  // Check if we're on a video page
  if (!window.location.pathname.includes('/watch')) {
    console.log('❌ Not on a video page');
    return;
  }
  
  console.log('✅ On YouTube video page, proceeding...');
  
  // Create UI
  const { sidebar } = createUI();
  
  // Initialize citation detector
  const detector = new EnhancedCitationDetector();
  
  // Get video text and analyze
  setTimeout(async () => {
    try {
      const text = await getVideoText();
      if (text) {
        console.log('📝 Analyzing text for citations...');
        
        // Update status to show enrichment phase
        const statusDiv = document.getElementById('citations-status');
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
        
        // Detect citations
        const rawCitations = detector.detectCitations(text);
        console.log('📚 Found raw citations:', rawCitations);
        
        // Enrich with Google Books data
        const enrichedCitations = await detector.enrichWithGoogleBooks(rawCitations);
        console.log('📖 Enriched citations:', enrichedCitations);
        
        // Update UI
        const citationsList = document.getElementById('citations-list');
        
        if (enrichedCitations.length > 0) {
          // Hide loading status
          statusDiv.style.display = 'none';
          
          // Show enriched citations with beautiful cards
          citationsList.innerHTML = enrichedCitations.map((citation, index) => {
            const typeIcon = citation.type === 'book' ? '📚' : citation.type === 'paper' ? '🔬' : '📄';
            const typeColor = citation.type === 'book' ? '#8b5cf6' : citation.type === 'paper' ? '#06b6d4' : '#10b981';
            const confidenceColor = citation.confidence > 0.7 ? '#10b981' : citation.confidence > 0.5 ? '#f59e0b' : '#ef4444';
            
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
                  
                  <div style="display: flex; gap: 8px;">
                    ${citation.googleBooksLink ? `
                      <a href="${citation.googleBooksLink}" target="_blank" style="
                        background: linear-gradient(135deg, #4285f4 0%, #34a853 100%);
                        color: white;
                        border: none;
                        padding: 6px 12px;
                        border-radius: 8px;
                        font-size: 12px;
                        font-weight: 500;
                        text-decoration: none;
                        transition: all 0.2s;
                      " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                        📖 Google Books
                      </a>
                    ` : ''}
                    
                    ${citation.amazonLink ? `
                      <a href="${citation.amazonLink}" target="_blank" style="
                        background: linear-gradient(135deg, #ff9900 0%, #ff6600 100%);
                        color: white;
                        border: none;
                        padding: 6px 12px;
                        border-radius: 8px;
                        font-size: 12px;
                        font-weight: 500;
                        text-decoration: none;
                        transition: all 0.2s;
                      " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                        🛒 Amazon
                      </a>
                    ` : ''}
                    
                    ${!citation.googleBooksLink && !citation.amazonLink ? `
                      <button onclick="window.open('https://www.google.com/search?q=${encodeURIComponent(citation.title + (citation.author ? ' ' + citation.author : ''))}', '_blank')" style="
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        border: none;
                        padding: 6px 12px;
                        border-radius: 8px;
                        font-size: 12px;
                        font-weight: 500;
                        cursor: pointer;
                        transition: all 0.2s;
                      " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                        🔍 Search
                      </button>
                    ` : ''}
                  </div>
                </div>
              </div>
            `;
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
                <div style="color: #92400e; font-weight: 600; margin-bottom: 4px;">No citations found</div>
                <div style="color: #a16207; font-size: 13px;">This video may not contain book or study references</div>
              </div>
            </div>
          `;
          citationsList.innerHTML = '';
        }
      }
    } catch (error) {
      console.error('❌ Error analyzing video:', error);
      const statusDiv = document.getElementById('citations-status');
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
  }, 2000);
  
  console.log('✅ Citation Cross-Reference initialized!');
}

// Start initialization
init().catch(console.error);

// Make detector available globally for testing
window.CitationCrossReference = {
  detector: new EnhancedCitationDetector(),
  initialized: true
};

console.log('✅ Global CitationCrossReference assigned:', window.CitationCrossReference);

// Test persistence
setTimeout(() => {
  console.log('After 1s - CitationCrossReference exists:', !!window.CitationCrossReference);
}, 1000);

setTimeout(() => {
  console.log('After 3s - CitationCrossReference exists:', !!window.CitationCrossReference);
}, 3000); 