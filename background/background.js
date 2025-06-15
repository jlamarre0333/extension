// Background Service Worker for Citation Cross-Reference Extension

// Extension lifecycle
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Citation Cross-Reference Extension installed');
  
  // Initialize default settings
  chrome.storage.local.set({
    extensionEnabled: true,
    citationsToday: 0,
    videosFound: 0,
    sourcesAccessed: 0
  });
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'lookupCitation':
      handleCitationLookup(message.citation, sendResponse);
      return true; // Keep message channel open for async response
      
    case 'searchVideos':
      handleVideoSearch(message.query, sendResponse);
      return true;
      
    case 'getApiKey':
      handleApiKeyRequest(message.service, sendResponse);
      return true;
      
    default:
      console.warn('Unknown message action:', message.action);
  }
});

/**
 * Handle citation lookup requests
 */
async function handleCitationLookup(citation, sendResponse) {
  console.log('Looking up citation:', citation.title);
  
  try {
    let result = null;
    
    switch (citation.type) {
      case 'books':
        result = await lookupBook(citation);
        break;
      case 'papers':
        result = await lookupPaper(citation);
        break;
      case 'general':
        result = await lookupGeneral(citation);
        break;
      default:
        result = await lookupGeneral(citation);
    }
    
    if (result) {
      // Open the source in a new tab
      chrome.tabs.create({ url: result.url });
      
      // Update citation as verified
      citation.verified = true;
      citation.metadata = result;
      
      sendResponse({ success: true, result });
    } else {
      sendResponse({ success: false, error: 'No results found' });
    }
    
  } catch (error) {
    console.error('Citation lookup failed:', error);
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * Look up a book using Google Books API
 */
async function lookupBook(citation) {
  const query = encodeURIComponent(`${citation.title} ${citation.author || ''}`);
  const url = `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      const book = data.items[0].volumeInfo;
      return {
        title: book.title,
        authors: book.authors,
        description: book.description,
        thumbnail: book.imageLinks?.thumbnail,
        url: book.infoLink || `https://www.google.com/search?q=${query}+book`,
        source: 'Google Books'
      };
    }
  } catch (error) {
    console.error('Google Books API error:', error);
  }
  
  // Fallback to Google search
  return {
    title: citation.title,
    url: `https://www.google.com/search?q=${query}+book`,
    source: 'Google Search'
  };
}

/**
 * Look up a research paper using Semantic Scholar API
 */
async function lookupPaper(citation) {
  const query = encodeURIComponent(citation.title);
  const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${query}&limit=1&fields=title,authors,abstract,url,venue,year`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.data && data.data.length > 0) {
      const paper = data.data[0];
      return {
        title: paper.title,
        authors: paper.authors?.map(a => a.name),
        abstract: paper.abstract,
        venue: paper.venue,
        year: paper.year,
        url: paper.url || `https://scholar.google.com/scholar?q=${query}`,
        source: 'Semantic Scholar'
      };
    }
  } catch (error) {
    console.error('Semantic Scholar API error:', error);
  }
  
  // Fallback to Google Scholar
  return {
    title: citation.title,
    url: `https://scholar.google.com/scholar?q=${query}`,
    source: 'Google Scholar'
  };
}

/**
 * Look up general citations using Wikipedia API
 */
async function lookupGeneral(citation) {
  const query = encodeURIComponent(citation.title);
  const searchUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${query}`;
  
  try {
    const response = await fetch(searchUrl);
    
    if (response.ok) {
      const data = await response.json();
      return {
        title: data.title,
        description: data.extract,
        thumbnail: data.thumbnail?.source,
        url: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${query}`,
        source: 'Wikipedia'
      };
    }
  } catch (error) {
    console.error('Wikipedia API error:', error);
  }
  
  // Fallback to Google search
  return {
    title: citation.title,
    url: `https://www.google.com/search?q=${query}`,
    source: 'Google Search'
  };
}

/**
 * Handle video search requests (for Phase 3)
 */
async function handleVideoSearch(query, sendResponse) {
  console.log('Searching for videos:', query);
  
  try {
    // TODO: Implement YouTube Data API search
    // For now, return mock data
    const results = [
      {
        id: 'mock1',
        title: `Video about ${query}`,
        channel: 'Educational Channel',
        thumbnail: 'https://via.placeholder.com/320x180',
        duration: '10:30',
        views: '1.2M views',
        publishedAt: '2 days ago',
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
      }
    ];
    
    sendResponse({ success: true, results });
  } catch (error) {
    console.error('Video search failed:', error);
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * Handle API key requests (for future use)
 */
async function handleApiKeyRequest(service, sendResponse) {
  // TODO: Implement secure API key management
  // For now, return null (will use public endpoints)
  sendResponse({ success: true, apiKey: null });
}

/**
 * Clean up old data periodically
 */
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'cleanup') {
    cleanupOldData();
  }
});

// Set up daily cleanup
chrome.alarms.create('cleanup', { 
  delayInMinutes: 1440, // 24 hours
  periodInMinutes: 1440 
});

/**
 * Clean up old statistics and cached data
 */
async function cleanupOldData() {
  console.log('Cleaning up old data');
  
  // Reset daily stats
  chrome.storage.local.set({
    citationsToday: 0
  });
  
  // TODO: Clean up cached citation data older than 7 days
}

/**
 * Handle tab updates to detect YouTube navigation
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && 
      tab.url && 
      tab.url.includes('youtube.com/watch')) {
    
    console.log('YouTube video page detected:', tab.url);
    // Content scripts are automatically injected via manifest
  }
});

console.log('Citation Cross-Reference background script loaded'); 