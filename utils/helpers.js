// Helper utilities for Citation Cross-Reference Extension

/**
 * Debounce function to limit how often a function can be called
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function to limit function calls to once per interval
 */
function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Wait for an element to appear in the DOM
 */
function waitForElement(selector, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver((mutations, obs) => {
      const element = document.querySelector(selector);
      if (element) {
        obs.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} not found within ${timeout}ms`));
    }, timeout);
  });
}

/**
 * Clean and normalize text for processing
 */
function cleanText(text) {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s'".,!?-]/g, '')
    .trim();
}

/**
 * Format timestamp from seconds to readable format
 */
function formatTimestamp(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Log messages with extension prefix
 */
function log(message, ...args) {
  console.log(`[Citation Cross-Reference] ${message}`, ...args);
}

/**
 * Check if current page is a YouTube video page
 */
function isYouTubeVideoPage() {
  return window.location.hostname === 'www.youtube.com' && 
         window.location.pathname === '/watch';
}

/**
 * Get YouTube video ID from current URL
 */
function getYouTubeVideoId() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('v');
}

// Export functions for use in other scripts
const CitationHelpers = {
  debounce,
  throttle,
  waitForElement,
  cleanText,
  formatTimestamp,
  log,
  isYouTubeVideoPage,
  getYouTubeVideoId
};

// Try multiple assignment methods
window.CitationHelpers = CitationHelpers;
globalThis.CitationHelpers = CitationHelpers;

// Force assignment with defineProperty
try {
  Object.defineProperty(window, 'CitationHelpers', {
    value: CitationHelpers,
    writable: true,
    enumerable: true,
    configurable: true
  });
  console.log('✅ CitationHelpers assigned with defineProperty');
} catch (error) {
  console.error('❌ Failed to assign with defineProperty:', error);
}

console.log('✅ CitationHelpers loaded successfully!');
console.log('Current URL:', window.location.href);
console.log('Is YouTube video page:', isYouTubeVideoPage());

// Debug the window object assignment
console.log('🔍 Debugging window.CitationHelpers assignment...');
console.log('Before assignment - window.CitationHelpers:', window.CitationHelpers);

// Test immediate access
setTimeout(() => {
  console.log('After 100ms - window.CitationHelpers:', window.CitationHelpers ? '✅ EXISTS' : '❌ MISSING');
  if (window.CitationHelpers) {
    console.log('CitationHelpers functions:', Object.keys(window.CitationHelpers));
  }
}, 100);

setTimeout(() => {
  console.log('After 1000ms - window.CitationHelpers:', window.CitationHelpers ? '✅ EXISTS' : '❌ MISSING');
}, 1000); 