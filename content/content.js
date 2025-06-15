// Main Content Script for Citation Cross-Reference Extension

class CitationCrossReference {
  constructor() {
    this.isEnabled = true;
    this.currentVideoId = null;
    this.processingInterval = null;
    this.lastProcessedTime = 0;
    this.allCitations = [];
    this.allVideos = [];
  }

  /**
   * Initialize the extension
   */
  async init() {
    const { log, isYouTubeVideoPage, getYouTubeVideoId } = window.CitationHelpers;
    
    if (!isYouTubeVideoPage()) {
      log('Not on a YouTube video page, skipping initialization');
      return;
    }

    log('Initializing Citation Cross-Reference Extension');

    // Check if extension is enabled
    const result = await chrome.storage.local.get(['extensionEnabled']);
    this.isEnabled = result.extensionEnabled !== false;

    if (!this.isEnabled) {
      log('Extension is disabled');
      return;
    }

    // Initialize UI
    await window.UIInjector.init();

    // Set up video change detection
    this.setupVideoChangeDetection();

    // Start processing current video
    const videoId = getYouTubeVideoId();
    if (videoId) {
      await this.processVideo(videoId);
    }

    // Listen for messages from popup
    this.setupMessageListeners();

    log('Extension initialized successfully');
  }

  /**
   * Set up detection for video changes (YouTube SPA navigation)
   */
  setupVideoChangeDetection() {
    const { log, getYouTubeVideoId } = window.CitationHelpers;
    
    // Watch for URL changes
    let lastUrl = location.href;
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        const videoId = getYouTubeVideoId();
        
        if (videoId && videoId !== this.currentVideoId) {
          log('Video changed, processing new video:', videoId);
          this.processVideo(videoId);
        }
      }
    }).observe(document, { subtree: true, childList: true });

    // Also watch for video element changes
    const videoObserver = new MutationObserver(() => {
      const video = document.querySelector('video');
      if (video && !video.hasAttribute('data-citation-listener')) {
        this.setupVideoEventListeners(video);
        video.setAttribute('data-citation-listener', 'true');
      }
    });

    videoObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Set up event listeners for video playback
   */
  setupVideoEventListeners(video) {
    const { log, throttle } = window.CitationHelpers;
    
    // Process transcript as video plays (throttled)
    const processCurrentSegment = throttle(() => {
      if (this.isEnabled && video.currentTime > this.lastProcessedTime + 5) {
        this.processCurrentVideoSegment(video.currentTime);
      }
    }, 2000);

    video.addEventListener('timeupdate', processCurrentSegment);
    video.addEventListener('play', processCurrentSegment);
    video.addEventListener('seeked', processCurrentSegment);

    log('Video event listeners set up');
  }

  /**
   * Process a new video
   */
  async processVideo(videoId) {
    const { log } = window.CitationHelpers;
    
    if (this.currentVideoId === videoId) {
      return; // Already processing this video
    }

    // Clean up previous video
    this.cleanup();
    this.currentVideoId = videoId;

    log('Processing video:', videoId);
    window.UIInjector.showLoading('Loading transcript...');

    try {
      // Get transcript
      const transcript = await window.TranscriptParser.getTranscript();
      
      if (!transcript || transcript.length === 0) {
        throw new Error('No transcript available');
      }

      log(`Transcript loaded with ${transcript.length} segments`);
      window.UIInjector.showLoading('Analyzing content...');

      // Process entire transcript for initial analysis
      await this.processFullTranscript(transcript);

      // Set up real-time processing
      this.startRealTimeProcessing();

      // Update stats
      await this.updateStats('citationsToday', this.allCitations.length);

    } catch (error) {
      log('Error processing video:', error.message);
      window.UIInjector.updateContent([], []);
      
      // Show error message
      const content = document.querySelector('#citation-sidebar .sidebar-content');
      if (content) {
        content.innerHTML = `
          <div class="sidebar-empty">
            <div class="empty-icon">⚠️</div>
            <div class="empty-title">Transcript not available</div>
            <div class="empty-description">
              This video doesn't have captions or transcript data available. 
              Try a different video with closed captions enabled.
            </div>
          </div>
        `;
      }
    }
  }

  /**
   * Process the full transcript for initial citation detection
   */
  async processFullTranscript(transcript) {
    const { log } = window.CitationHelpers;
    
    // Combine all transcript text for comprehensive analysis
    const fullText = transcript.map(segment => segment.text).join(' ');
    
    // Analyze for citations
    const citations = await window.CitationDetector.analyzeText(fullText, 0);
    
    // For each citation, find the best matching timestamp
    for (const citation of citations) {
      const matchingSegment = transcript.find(segment => 
        segment.text.toLowerCase().includes(citation.title.toLowerCase().substring(0, 20))
      );
      
      if (matchingSegment) {
        citation.timestamp = matchingSegment.start;
      }
    }

    this.allCitations = citations;
    
    // TODO: Analyze for video mentions (Phase 3)
    this.allVideos = [];

    // Update UI
    window.UIInjector.updateContent(this.allCitations, this.allVideos);
    window.UIInjector.updateToggleButton(this.allCitations.length + this.allVideos.length);

    log(`Initial analysis complete: ${citations.length} citations found`);
  }

  /**
   * Start real-time processing as video plays
   */
  startRealTimeProcessing() {
    // Clear any existing interval
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }

    // Process current segment every few seconds
    this.processingInterval = setInterval(() => {
      const video = document.querySelector('video');
      if (video && !video.paused) {
        this.processCurrentVideoSegment(video.currentTime);
      }
    }, 3000);
  }

  /**
   * Process the current video segment for real-time detection
   */
  async processCurrentVideoSegment(currentTime) {
    if (currentTime <= this.lastProcessedTime) {
      return; // Already processed this time
    }

    const transcript = window.TranscriptParser.transcript;
    if (!transcript || transcript.length === 0) {
      return;
    }

    // Get segments around current time (±10 seconds for context)
    const contextSegments = transcript.filter(segment => 
      segment.start >= currentTime - 10 && segment.start <= currentTime + 10
    );

    if (contextSegments.length === 0) {
      return;
    }

    // Analyze context for new citations
    const contextText = contextSegments.map(s => s.text).join(' ');
    const newCitations = await window.CitationDetector.analyzeText(contextText, currentTime);

    // Add any new citations that weren't found before
    let addedNew = false;
    for (const citation of newCitations) {
      const exists = this.allCitations.some(existing => 
        existing.title.toLowerCase() === citation.title.toLowerCase() &&
        existing.type === citation.type
      );

      if (!exists) {
        this.allCitations.push(citation);
        addedNew = true;
      }
    }

    // Update UI if we found new citations
    if (addedNew) {
      window.UIInjector.updateContent(this.allCitations, this.allVideos);
      window.UIInjector.updateToggleButton(this.allCitations.length + this.allVideos.length);
      
      // Update stats
      await this.updateStats('citationsToday', this.allCitations.length);
    }

    this.lastProcessedTime = currentTime;
  }

  /**
   * Set up message listeners for communication with popup and background
   */
  setupMessageListeners() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.action) {
        case 'enable':
          this.enable();
          break;
        case 'disable':
          this.disable();
          break;
        case 'getStatus':
          sendResponse({
            enabled: this.isEnabled,
            videoId: this.currentVideoId,
            citationsCount: this.allCitations.length,
            videosCount: this.allVideos.length
          });
          break;
      }
    });
  }

  /**
   * Enable the extension
   */
  async enable() {
    const { log } = window.CitationHelpers;
    
    this.isEnabled = true;
    await chrome.storage.local.set({ extensionEnabled: true });
    
    // Reinitialize if on video page
    if (window.CitationHelpers.isYouTubeVideoPage()) {
      await this.init();
    }
    
    log('Extension enabled');
  }

  /**
   * Disable the extension
   */
  async disable() {
    const { log } = window.CitationHelpers;
    
    this.isEnabled = false;
    await chrome.storage.local.set({ extensionEnabled: false });
    
    // Clean up UI
    this.cleanup();
    window.UIInjector.cleanup();
    
    log('Extension disabled');
  }

  /**
   * Update extension statistics
   */
  async updateStats(statType, value) {
    try {
      await chrome.storage.local.set({ [statType]: value });
    } catch (error) {
      console.warn('Failed to update stats:', error);
    }
  }

  /**
   * Clean up resources
   */
  cleanup() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    
    this.lastProcessedTime = 0;
    this.allCitations = [];
    this.allVideos = [];
    
    // Clear detection engine
    window.CitationDetector.clear();
    window.TranscriptParser.clear();
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeExtension);
} else {
  initializeExtension();
}

async function initializeExtension() {
  console.log('🚀 Citation Cross-Reference: Starting initialization...');
  
  // Wait a bit for YouTube to fully load
  setTimeout(async () => {
    console.log('🚀 Citation Cross-Reference: Creating extension instance...');
    const extension = new CitationCrossReference();
    await extension.init();
    
    // Make it globally accessible for debugging
    window.CitationCrossReference = extension;
    console.log('✅ Citation Cross-Reference: Extension fully loaded!');
  }, 1000);
} 