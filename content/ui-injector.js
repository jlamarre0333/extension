// UI Injector for Citation Cross-Reference Extension

class UIInjector {
  constructor() {
    this.sidebar = null;
    this.toggleButton = null;
    this.isVisible = false;
    this.citations = [];
    this.videos = [];
  }

  /**
   * Initialize and inject the UI elements
   */
  async init() {
    const { log, isYouTubeVideoPage } = window.CitationHelpers;
    
    if (!isYouTubeVideoPage()) {
      return;
    }

    log('Initializing UI components');
    
    // Remove existing UI if present
    this.cleanup();
    
    // Create and inject sidebar
    this.createSidebar();
    this.createToggleButton();
    
    // Set up event listeners
    this.setupEventListeners();
    
    log('UI components initialized successfully');
  }

  /**
   * Create the main sidebar element
   */
  createSidebar() {
    this.sidebar = document.createElement('div');
    this.sidebar.id = 'citation-sidebar';
    this.sidebar.innerHTML = `
      <div class="sidebar-header">
        <h3 class="sidebar-title">
          📚 Citations & Videos
        </h3>
        <button class="sidebar-close" title="Close sidebar">×</button>
      </div>
      <div class="sidebar-content">
        <div class="sidebar-loading">
          <div class="loading-spinner"></div>
          Analyzing transcript...
        </div>
      </div>
    `;
    
    document.body.appendChild(this.sidebar);
  }

  /**
   * Create the toggle button
   */
  createToggleButton() {
    this.toggleButton = document.createElement('button');
    this.toggleButton.className = 'sidebar-toggle';
    this.toggleButton.innerHTML = '📚';
    this.toggleButton.title = 'Show Citations & Videos';
    
    document.body.appendChild(this.toggleButton);
  }

  /**
   * Set up event listeners for UI interactions
   */
  setupEventListeners() {
    // Toggle button click
    this.toggleButton.addEventListener('click', () => {
      this.toggleSidebar();
    });

    // Close button click
    const closeButton = this.sidebar.querySelector('.sidebar-close');
    closeButton.addEventListener('click', () => {
      this.hideSidebar();
    });

    // Click outside to close (optional)
    document.addEventListener('click', (event) => {
      if (this.isVisible && 
          !this.sidebar.contains(event.target) && 
          !this.toggleButton.contains(event.target)) {
        // Uncomment to enable click-outside-to-close
        // this.hideSidebar();
      }
    });

    // Escape key to close
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.isVisible) {
        this.hideSidebar();
      }
    });
  }

  /**
   * Toggle sidebar visibility
   */
  toggleSidebar() {
    if (this.isVisible) {
      this.hideSidebar();
    } else {
      this.showSidebar();
    }
  }

  /**
   * Show the sidebar
   */
  showSidebar() {
    this.sidebar.classList.add('visible');
    this.toggleButton.style.opacity = '0.5';
    this.isVisible = true;
    
    // Update button tooltip
    this.toggleButton.title = 'Hide Citations & Videos';
  }

  /**
   * Hide the sidebar
   */
  hideSidebar() {
    this.sidebar.classList.remove('visible');
    this.toggleButton.style.opacity = '1';
    this.isVisible = false;
    
    // Update button tooltip
    this.toggleButton.title = 'Show Citations & Videos';
  }

  /**
   * Update sidebar content with citations and videos
   */
  updateContent(citations = [], videos = []) {
    this.citations = citations;
    this.videos = videos;
    
    const content = this.sidebar.querySelector('.sidebar-content');
    
    if (citations.length === 0 && videos.length === 0) {
      content.innerHTML = this.getEmptyStateHTML();
      return;
    }

    let html = '';
    
    // Add citations section
    if (citations.length > 0) {
      html += '<div class="section-header">📖 Citations Found</div>';
      citations.forEach(citation => {
        html += this.createCitationCardHTML(citation);
      });
    }
    
    // Add videos section
    if (videos.length > 0) {
      html += '<div class="section-header">🎥 Related Videos</div>';
      videos.forEach(video => {
        html += this.createVideoCardHTML(video);
      });
    }
    
    content.innerHTML = html;
    
    // Set up click handlers for the new content
    this.setupContentEventListeners();
  }

  /**
   * Show loading state
   */
  showLoading(message = 'Analyzing transcript...') {
    const content = this.sidebar.querySelector('.sidebar-content');
    content.innerHTML = `
      <div class="sidebar-loading">
        <div class="loading-spinner"></div>
        ${message}
      </div>
    `;
  }

  /**
   * Get empty state HTML
   */
  getEmptyStateHTML() {
    return `
      <div class="sidebar-empty">
        <div class="empty-icon">🔍</div>
        <div class="empty-title">No citations found yet</div>
        <div class="empty-description">
          We'll automatically detect books, research papers, and videos mentioned in this video as it plays.
        </div>
      </div>
    `;
  }

  /**
   * Create HTML for a citation card
   */
  createCitationCardHTML(citation) {
    const confidenceClass = citation.confidence > 0.7 ? 'high' : 
                           citation.confidence > 0.5 ? 'medium' : 'low';
    
    const verifiedClass = citation.verified ? 'verified' : 'unverified';
    
    return `
      <div class="citation-card ${verifiedClass}" data-citation-id="${citation.id}">
        <div class="citation-type ${citation.type}">${citation.type}</div>
        <div class="citation-title">${this.escapeHtml(citation.title)}</div>
        ${citation.author ? `<div class="citation-author">by ${this.escapeHtml(citation.author)}</div>` : ''}
        <div class="citation-context">"${this.escapeHtml(citation.context)}"</div>
        <div class="citation-meta">
          <div class="citation-timestamp" data-timestamp="${citation.timestamp}">
            ⏱️ ${this.formatTimestamp(citation.timestamp)}
          </div>
          <div class="confidence-score">
            <div class="confidence-bar">
              <div class="confidence-fill ${confidenceClass}" style="width: ${citation.confidence * 100}%"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Create HTML for a video card
   */
  createVideoCardHTML(video) {
    return `
      <div class="video-card" data-video-id="${video.id}">
        <div class="video-thumbnail">
          ${video.thumbnail ? 
            `<img src="${video.thumbnail}" alt="${this.escapeHtml(video.title)}">` : 
            '<div style="color: #666;">📹</div>'
          }
          ${video.duration ? `<div class="video-duration">${video.duration}</div>` : ''}
        </div>
        <div class="video-info">
          <div class="video-title">${this.escapeHtml(video.title)}</div>
          ${video.channel ? `<div class="video-channel">${this.escapeHtml(video.channel)}</div>` : ''}
          <div class="video-stats">
            ${video.views ? `<span>${video.views} views</span>` : ''}
            ${video.publishedAt ? `<span>${video.publishedAt}</span>` : ''}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Set up event listeners for content interactions
   */
  setupContentEventListeners() {
    // Citation card clicks
    const citationCards = this.sidebar.querySelectorAll('.citation-card');
    citationCards.forEach(card => {
      card.addEventListener('click', (event) => {
        const citationId = card.dataset.citationId;
        this.handleCitationClick(citationId, event);
      });
    });

    // Timestamp clicks
    const timestamps = this.sidebar.querySelectorAll('.citation-timestamp');
    timestamps.forEach(timestamp => {
      timestamp.addEventListener('click', (event) => {
        event.stopPropagation();
        const time = parseFloat(timestamp.dataset.timestamp);
        this.seekToTimestamp(time);
      });
    });

    // Video card clicks
    const videoCards = this.sidebar.querySelectorAll('.video-card');
    videoCards.forEach(card => {
      card.addEventListener('click', (event) => {
        const videoId = card.dataset.videoId;
        this.handleVideoClick(videoId, event);
      });
    });
  }

  /**
   * Handle citation card click
   */
  handleCitationClick(citationId, event) {
    const citation = this.citations.find(c => c.id === citationId);
    if (!citation) return;

    const { log } = window.CitationHelpers;
    log('Citation clicked:', citation.title);

    // Send message to background script to handle citation lookup
    chrome.runtime.sendMessage({
      action: 'lookupCitation',
      citation: citation
    });

    // Update stats
    this.updateStats('sourcesAccessed');
  }

  /**
   * Handle video card click
   */
  handleVideoClick(videoId, event) {
    const video = this.videos.find(v => v.id === videoId);
    if (!video) return;

    const { log } = window.CitationHelpers;
    log('Video clicked:', video.title);

    // Open video in new tab
    if (video.url) {
      window.open(video.url, '_blank');
    }

    // Update stats
    this.updateStats('videosFound');
  }

  /**
   * Seek to specific timestamp in the video
   */
  seekToTimestamp(seconds) {
    const video = document.querySelector('video');
    if (video) {
      video.currentTime = seconds;
      video.focus();
      
      const { log } = window.CitationHelpers;
      log(`Seeking to ${seconds}s`);
    }
  }

  /**
   * Update extension statistics
   */
  async updateStats(statType) {
    try {
      const result = await chrome.storage.local.get([statType]);
      const currentValue = result[statType] || 0;
      await chrome.storage.local.set({
        [statType]: currentValue + 1
      });
    } catch (error) {
      console.warn('Failed to update stats:', error);
    }
  }

  /**
   * Format timestamp for display
   */
  formatTimestamp(seconds) {
    const { formatTimestamp } = window.CitationHelpers;
    return formatTimestamp(seconds);
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Update toggle button with citation count
   */
  updateToggleButton(count = 0) {
    if (count > 0) {
      this.toggleButton.innerHTML = `📚 ${count}`;
      this.toggleButton.style.background = '#34a853';
    } else {
      this.toggleButton.innerHTML = '📚';
      this.toggleButton.style.background = '#4285f4';
    }
  }

  /**
   * Clean up UI elements
   */
  cleanup() {
    if (this.sidebar) {
      this.sidebar.remove();
      this.sidebar = null;
    }
    
    if (this.toggleButton) {
      this.toggleButton.remove();
      this.toggleButton = null;
    }
    
    this.isVisible = false;
    this.citations = [];
    this.videos = [];
  }
}

// Create global instance
window.UIInjector = new UIInjector(); 