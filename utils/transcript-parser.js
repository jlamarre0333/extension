// YouTube Transcript Parser for Citation Cross-Reference Extension

class TranscriptParser {
  constructor() {
    this.transcript = [];
    this.currentVideoId = null;
    this.isLoading = false;
    this.observers = [];
  }

  /**
   * Get transcript for current YouTube video
   */
  async getTranscript() {
    const { log, getYouTubeVideoId, isYouTubeVideoPage } = window.CitationHelpers;
    
    if (!isYouTubeVideoPage()) {
      throw new Error('Not on a YouTube video page');
    }

    const videoId = getYouTubeVideoId();
    if (!videoId) {
      throw new Error('Could not extract video ID');
    }

    // Return cached transcript if same video
    if (this.currentVideoId === videoId && this.transcript.length > 0) {
      log('Using cached transcript for video:', videoId);
      return this.transcript;
    }

    log('Fetching transcript for video:', videoId);
    this.isLoading = true;
    this.currentVideoId = videoId;

    try {
      // Try multiple methods to get transcript
      let transcript = await this.tryYouTubeTranscriptAPI(videoId);
      
      if (!transcript || transcript.length === 0) {
        transcript = await this.tryExtractFromPage();
      }

      if (!transcript || transcript.length === 0) {
        throw new Error('No transcript available for this video');
      }

      this.transcript = this.processTranscript(transcript);
      log(`Successfully loaded transcript with ${this.transcript.length} segments`);
      
      return this.transcript;
    } catch (error) {
      log('Error fetching transcript:', error.message);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Try to get transcript using YouTube's internal API
   */
  async tryYouTubeTranscriptAPI(videoId) {
    try {
      // Look for transcript data in YouTube's player response
      const scripts = document.querySelectorAll('script');
      let playerResponse = null;

      for (const script of scripts) {
        const content = script.textContent;
        if (content.includes('var ytInitialPlayerResponse')) {
          const match = content.match(/var ytInitialPlayerResponse\s*=\s*({.+?});/);
          if (match) {
            playerResponse = JSON.parse(match[1]);
            break;
          }
        }
      }

      if (!playerResponse) {
        throw new Error('Could not find player response');
      }

      // Extract captions from player response
      const captions = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
      
      if (!captions || captions.length === 0) {
        throw new Error('No captions available');
      }

      // Find English captions (prefer auto-generated if available)
      let captionTrack = captions.find(track => 
        track.languageCode === 'en' && track.kind === 'asr'
      ) || captions.find(track => track.languageCode === 'en');

      if (!captionTrack) {
        throw new Error('No English captions found');
      }

      // Fetch the caption data
      const response = await fetch(captionTrack.baseUrl);
      const xmlText = await response.text();
      
      return this.parseXMLTranscript(xmlText);
    } catch (error) {
      console.warn('YouTube API method failed:', error.message);
      return null;
    }
  }

  /**
   * Try to extract transcript from page elements
   */
  async tryExtractFromPage() {
    const { waitForElement } = window.CitationHelpers;
    
    try {
      // Look for transcript button and click it
      const transcriptButton = await waitForElement('[aria-label*="transcript" i], [aria-label*="captions" i]', 3000);
      
      if (transcriptButton) {
        transcriptButton.click();
        
        // Wait for transcript panel to load
        const transcriptPanel = await waitForElement('[data-testid="transcript-panel"], .ytd-transcript-renderer', 5000);
        
        if (transcriptPanel) {
          return this.extractFromTranscriptPanel(transcriptPanel);
        }
      }
    } catch (error) {
      console.warn('Page extraction method failed:', error.message);
    }
    
    return null;
  }

  /**
   * Parse XML transcript format
   */
  parseXMLTranscript(xmlText) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    const textElements = xmlDoc.querySelectorAll('text');
    
    const transcript = [];
    
    textElements.forEach(element => {
      const start = parseFloat(element.getAttribute('start')) || 0;
      const duration = parseFloat(element.getAttribute('dur')) || 0;
      const text = element.textContent.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
      
      transcript.push({
        start,
        end: start + duration,
        text: text.trim()
      });
    });
    
    return transcript;
  }

  /**
   * Extract transcript from YouTube's transcript panel
   */
  extractFromTranscriptPanel(panel) {
    const transcript = [];
    const segments = panel.querySelectorAll('[data-testid="transcript-segment"], .ytd-transcript-segment-renderer');
    
    segments.forEach(segment => {
      const timeElement = segment.querySelector('[data-testid="transcript-segment-timestamp"], .ytd-transcript-segment-renderer .segment-timestamp');
      const textElement = segment.querySelector('[data-testid="transcript-segment-text"], .ytd-transcript-segment-renderer .segment-text');
      
      if (timeElement && textElement) {
        const timeText = timeElement.textContent.trim();
        const text = textElement.textContent.trim();
        
        // Parse timestamp (format: "1:23" or "12:34")
        const timeParts = timeText.split(':').map(Number);
        const start = timeParts.length === 2 ? 
          timeParts[0] * 60 + timeParts[1] : 
          timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2];
        
        transcript.push({
          start,
          end: start + 5, // Estimate 5 second duration
          text
        });
      }
    });
    
    return transcript;
  }

  /**
   * Process and clean transcript data
   */
  processTranscript(rawTranscript) {
    const { cleanText } = window.CitationHelpers;
    
    return rawTranscript.map(segment => ({
      start: segment.start,
      end: segment.end,
      text: cleanText(segment.text),
      originalText: segment.text
    })).filter(segment => segment.text.length > 0);
  }

  /**
   * Get transcript segment at specific time
   */
  getSegmentAtTime(currentTime) {
    return this.transcript.find(segment => 
      currentTime >= segment.start && currentTime <= segment.end
    );
  }

  /**
   * Get transcript segments within time range
   */
  getSegmentsInRange(startTime, endTime) {
    return this.transcript.filter(segment =>
      segment.start >= startTime && segment.end <= endTime
    );
  }

  /**
   * Get all transcript text as a single string
   */
  getFullText() {
    return this.transcript.map(segment => segment.text).join(' ');
  }

  /**
   * Subscribe to transcript updates
   */
  onTranscriptUpdate(callback) {
    this.observers.push(callback);
  }

  /**
   * Notify observers of transcript updates
   */
  notifyObservers() {
    this.observers.forEach(callback => callback(this.transcript));
  }

  /**
   * Clear cached transcript data
   */
  clear() {
    this.transcript = [];
    this.currentVideoId = null;
    this.observers = [];
  }
}

// Create global instance
window.TranscriptParser = new TranscriptParser(); 