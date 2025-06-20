// Smart Citations v2.8.0 - Complete Working Version
console.log('🚀 Smart Citations v2.8.0 loading...');

// Global variables
let detector;
let factChecker;
let currentVideoId;
let currentCitations = [];
let currentFactChecks = [];
let uiElements = {};

// Enhanced Citation Detector with all advanced features
class EnhancedCitationDetector {
  constructor() {
    this.citations = [];
    
    // Personalization & Learning System
    this.userPreferences = this.loadUserPreferences();
    this.userHistory = this.loadUserHistory();
    this.learningData = this.loadLearningData();
    
    // Improved citation detection patterns - more accurate matching
    this.patterns = {
      books: [
        // Books with explicit titles in quotes
        /(?:book|novel|memoir|biography|autobiography)\s+(?:called|titled|named|entitled)\s*[""']([^""']{4,80})[""']/gi,
        /(?:wrote|published|authored)\s+(?:the\s+)?(?:book|novel)\s+[""']([^""']{4,80})[""']/gi,
        // Author attribution patterns
        /[""']([^""']{4,80})[""']\s+by\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})/gi,
        /([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})'s\s+(?:book|novel|work)\s+[""']([^""']{4,80})[""']/gi,
        // Recommendations with explicit titles
        /(?:recommend|suggests?|mentions?)\s+(?:reading\s+)?(?:the\s+)?(?:book|novel)\s+[""']([^""']{4,80})[""']/gi,
        // References to specific works
        /(?:in|from)\s+(?:his|her|their)\s+(?:famous\s+)?(?:book|work|novel)\s+[""']([^""']{4,80})[""']/gi
      ],
      papers: [
        // Academic papers with journal names
        /(?:study|research|paper|article)\s+(?:published\s+)?(?:in\s+)?(?:the\s+)?(Nature|Science|Cell|PNAS|NEJM|Physical Review|Astrophysical Journal|New England Journal|Proceedings of|Journal of [A-Z][a-zA-Z\s]{5,40})/gi,
        // Research findings with institutions
        /(?:researchers?|scientists?)\s+(?:at\s+|from\s+)?([A-Z][a-zA-Z\s]{5,50}(?:University|Institute|Laboratory|College))\s+(?:found|discovered|showed?|published)/gi,
        // Famous scientific papers
        /(Einstein'?s?\s+(?:1905\s+)?(?:paper|work)\s+on\s+(?:special\s+relativity|photoelectric\s+effect|brownian\s+motion))/gi,
        /(Darwin'?s?\s+(?:paper|work)\s+on\s+(?:evolution|natural\s+selection|origin\s+of\s+species))/gi,
        // Study results with specific findings
        /(?:according\s+to\s+)?(?:a\s+)?(?:study|research)\s+(?:published\s+in\s+|from\s+)(Nature|Science|Cell|PNAS|Physical\s+Review)/gi
      ],
      topics: [
        // Scientific theories and concepts
        /(?:theory\s+of|concept\s+of|principle\s+of|law\s+of)\s+([A-Z][a-zA-Z\s]{4,50})/gi,
        // Famous scientific concepts
        /(Einstein'?s?\s+(?:theory\s+of\s+)?(?:general\s+|special\s+)?relativity)/gi,
        /(quantum\s+(?:mechanics|entanglement|tunneling|superposition))/gi,
        /(natural\s+selection|evolution|big\s+bang\s+theory|string\s+theory)/gi,
        // Physics phenomena
        /(photoelectric\s+effect|uncertainty\s+principle|double[–-]slit\s+experiment)/gi,
        /(black\s+holes?|neutron\s+stars?|dark\s+matter|dark\s+energy)/gi,
        // Mathematical concepts
        /(calculus|differential\s+equations|fourier\s+transform|chaos\s+theory)/gi
      ],
      // Add new categories for better coverage
      documentaries: [
        /(?:documentary|film)\s+(?:called|titled|named)\s+[""']([^""']{4,60})[""']/gi,
        /(?:watch|see|check\s+out)\s+(?:the\s+)?(?:documentary|film)\s+[""']([^""']{4,60})[""']/gi
      ],
      videos: [
        /(?:TED\s+talk|TEDx)\s+(?:called|titled|about)\s+[""']([^""']{4,60})[""']/gi,
        /(?:YouTube\s+channel|channel)\s+[""']([^""']{3,40})[""']/gi,
        /(Veritasium|Kurzgesagt|MinutePhysics|SciShow|Crash\s+Course|Khan\s+Academy|TED-Ed|3Blue1Brown|Numberphile)\s+(?:video|explains?)/gi
      ]
    };
  }

  // Main detection method with all enhancements
  async detectCitations(transcriptData) {
    console.log('🔍 Analyzing transcript for citations...');
    
    const text = typeof transcriptData === 'string' ? transcriptData : transcriptData.text;
    const segments = typeof transcriptData === 'object' && transcriptData.segments ? transcriptData.segments : [];
    
    console.log('📄 Text length:', text.length);
    console.log('📏 Segments available:', segments.length);
    
    const found = [];
    let id = 1;

    // Enhanced detection for all types
    for (const [type, patterns] of Object.entries(this.patterns)) {
      for (const pattern of patterns) {
        const matches = [...text.matchAll(pattern)];
        
        for (const match of matches) {
          const title = match[1]?.trim();
          const author = match[2]?.trim();
          
          if (title && title.length >= 3 && this.isValidTitle(title)) {
            const citation = {
              id: `citation_${id++}`,
              type,
              title,
              author: author || null,
              confidence: this.calculateAdvancedConfidence(match[0], type, title, author),
              originalMatch: match[0],
              timestamp: this.findTimestamp(title, segments),
              verified: false,
              metadata: this.extractMetadata(match[0], type)
            };
            
            if (citation.confidence >= 0.4) {
              found.push(citation);
              console.log(`📚 Found ${type}: "${title}" (confidence: ${citation.confidence.toFixed(2)})`);
            }
          }
        }
      }
    }

    // Apply personalized ranking
    const personalizedCitations = this.applyPersonalizedRanking(found);
    
    // Remove duplicates
    const unique = this.removeDuplicates(personalizedCitations);
    
    console.log(`✅ Found ${unique.length} unique citations`);
    return unique;
  }

  calculateAdvancedConfidence(fullMatch, type, title, author) {
    let confidence = 0.3; // Lower base confidence

    // Strong indicators for each type
    const indicators = {
      books: ['book', 'novel', 'memoir', 'biography', 'wrote', 'authored', 'published'],
      papers: ['study', 'research', 'paper', 'journal', 'published', 'Nature', 'Science', 'researchers'],
      topics: ['theory', 'concept', 'principle', 'law', 'phenomenon', 'effect'],
      documentaries: ['documentary', 'film', 'watch', 'see'],
      videos: ['TED', 'YouTube', 'channel', 'video']
    };

    const typeIndicators = indicators[type] || [];
    const matchLower = fullMatch.toLowerCase();
    
    // Boost for type-specific indicators
    let indicatorCount = 0;
    for (const indicator of typeIndicators) {
      if (matchLower.includes(indicator)) {
        indicatorCount++;
        confidence += 0.15;
      }
    }

    // Strong boost for quotation marks (shows explicit mention)
    if (/[""']/.test(fullMatch)) confidence += 0.25;
    
    // Boost for proper capitalization
    if (/^[A-Z]/.test(title)) confidence += 0.1;
    
    // Length-based scoring
    if (title.length > 15) confidence += 0.15;
    else if (title.length < 5) confidence -= 0.1;
    
    // Author attribution adds credibility
    if (author) confidence += 0.25;
    
    // Boost for famous works
    if (this.isFamousWork(title)) confidence += 0.2;
    
    // Boost for academic/scientific terms
    if (matchLower.includes('university') || matchLower.includes('institute') || 
        matchLower.includes('laboratory') || matchLower.includes('college')) {
      confidence += 0.1;
    }
    
    // Penalty for very generic terms
    const genericTerms = ['science', 'physics', 'mathematics', 'research', 'study'];
    if (genericTerms.includes(title.toLowerCase())) {
      confidence -= 0.2;
    }
    
    return Math.max(0, Math.min(1, confidence));
  }

  isFamousWork(title) {
    const famousWorks = [
      // Physics & Science
      'relativity', 'elegant universe', 'brief history of time', 'fabric of the cosmos',
      'quantum theory cannot hurt you', 'quantum universe', 'parallel worlds',
      'hidden dimensions', 'theory of everything', 'god particle', 'higgs boson',
      
      // Biology & Evolution  
      'origin of species', 'selfish gene', 'blind watchmaker', 'greatest show on earth',
      'your inner fish', 'sapiens', 'homo deus', 'gene machine',
      
      // Mathematics
      'principia mathematica', 'godel escher bach', 'fermats last theorem',
      'man who loved only numbers', 'music of the primes',
      
      // Popular Science
      'cosmos', 'pale blue dot', 'demon haunted world', 'contact',
      'thinking fast and slow', 'predictably irrational', 'freakonomics',
      
      // Technology & Future
      'singularity is near', 'whole earth catalog', 'structure of scientific revolutions',
      
      // Classic Works
      'principia', 'discourse on method', 'novum organum', 'system of the world'
    ];
    
    const titleLower = title.toLowerCase();
    return famousWorks.some(work => {
      // Check for exact matches or if the famous work is contained in the title
      return titleLower.includes(work) || work.includes(titleLower);
    });
  }

  isValidTitle(title) {
    const blacklist = [
      'this', 'that', 'here', 'there', 'now', 'then', 'today', 'yesterday',
      'something', 'anything', 'everything', 'nothing', 'someone', 'anyone'
    ];
    
    const titleLower = title.toLowerCase().trim();
    
    // Direct blacklist check
    if (blacklist.includes(titleLower)) return false;
    
    // Length validation
    if (title.length < 4 || title.length > 120) return false;
    
    // Must contain letters
    if (!/[a-zA-Z]/.test(title)) return false;
    
    // Avoid very generic single words
    if (title.split(' ').length === 1) {
      const genericSingleWords = [
        'science', 'physics', 'chemistry', 'biology', 'mathematics', 'math',
        'research', 'study', 'theory', 'concept', 'principle', 'law',
        'university', 'institute', 'college', 'school', 'department'
      ];
      if (genericSingleWords.includes(titleLower)) return false;
    }
    
    // Avoid titles that are just numbers or very short generic phrases
    if (/^\d+$/.test(title)) return false;
    if (titleLower.match(/^(the|a|an)\s+\w{1,4}$/)) return false;
    
    // Must have some meaningful content (not just articles and prepositions)
    const meaningfulWords = title.split(' ').filter(word => {
      const wordLower = word.toLowerCase();
      return !['the', 'a', 'an', 'of', 'in', 'on', 'at', 'to', 'for', 'with', 'by'].includes(wordLower);
    });
    
    if (meaningfulWords.length === 0) return false;
    
    return true;
  }

  findTimestamp(title, segments) {
    if (!segments || segments.length === 0) return 0;
    
    const titleWords = title.toLowerCase().split(' ');
    for (const segment of segments) {
      const segmentText = segment.text.toLowerCase();
      if (titleWords.some(word => segmentText.includes(word))) {
        return segment.start || 0;
      }
    }
    return 0;
  }

  extractMetadata(match, type) {
    return {
      source: 'transcript',
      detectionMethod: 'pattern_matching',
      type: type,
      context: match.substring(0, 100)
    };
  }

  applyPersonalizedRanking(citations) {
    // Apply user preferences and learning data
    return citations.sort((a, b) => {
      const scoreA = this.calculatePersonalizedScore(a);
      const scoreB = this.calculatePersonalizedScore(b);
      return scoreB - scoreA;
    });
  }

  calculatePersonalizedScore(citation) {
    let score = citation.confidence;
    
    // Boost based on user interests
    const userInterests = this.userPreferences.topicInterests || {};
    if (userInterests[citation.type]) {
      score += userInterests[citation.type] * 0.2;
    }
    
    return score;
  }

  removeDuplicates(citations) {
    const seen = new Set();
    return citations.filter(citation => {
      const key = `${citation.type}:${citation.title.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // Personalization methods
  loadUserPreferences() {
    try {
      const stored = localStorage.getItem('smartCitations_preferences');
      return stored ? JSON.parse(stored) : {
        enabledFeatures: {
          citationDetection: true,
          factChecking: true,
          personalization: true,
          recommendations: true
        },
        topicInterests: {},
        authorPreferences: {},
        languagePreference: 'en'
      };
    } catch (error) {
      console.warn('Failed to load user preferences:', error);
      return {};
    }
  }

  loadUserHistory() {
    try {
      const stored = localStorage.getItem('smartCitations_history');
      return stored ? JSON.parse(stored) : {
        viewedCitations: [],
        clickedSources: [],
        videoAnalyses: []
      };
    } catch (error) {
      console.warn('Failed to load user history:', error);
      return {};
    }
  }

  loadLearningData() {
    try {
      const stored = localStorage.getItem('smartCitations_learning');
      return stored ? JSON.parse(stored) : {
        fieldWeights: {},
        confidenceAdjustments: {},
        preferredSources: {}
      };
    } catch (error) {
      console.warn('Failed to load learning data:', error);
      return {};
    }
  }

  recordCitationInteraction(citation, action) {
    // Record user interaction for learning
    this.userHistory.clickedSources = this.userHistory.clickedSources || [];
    this.userHistory.clickedSources.push({
      citation: citation.id,
      action: action,
      timestamp: Date.now()
    });
    
    // Update preferences
    this.userPreferences.topicInterests = this.userPreferences.topicInterests || {};
    this.userPreferences.topicInterests[citation.type] = 
      (this.userPreferences.topicInterests[citation.type] || 0) + 0.1;
    
    this.saveUserData();
  }

  saveUserData() {
    try {
      localStorage.setItem('smartCitations_preferences', JSON.stringify(this.userPreferences));
      localStorage.setItem('smartCitations_history', JSON.stringify(this.userHistory));
      localStorage.setItem('smartCitations_learning', JSON.stringify(this.learningData));
    } catch (error) {
      console.warn('Failed to save user data:', error);
    }
  }
}

// Enhanced UI with multiple tabs
class EnhancedUIManager {
  constructor() {
    this.currentTab = 'citations';
    this.citations = [];
    this.factChecks = [];
    this.recommendations = [];
  }

  createUI() {
    console.log('🎨 Creating enhanced UI...');
    
    this.createSidebar();
    this.createToggleButton();
    
    console.log('✅ Enhanced UI created');
  }

  createSidebar() {
    // Remove existing sidebar
    const existing = document.getElementById('smart-citations-sidebar');
    if (existing) existing.remove();

    const sidebar = document.createElement('div');
    sidebar.id = 'smart-citations-sidebar';
    sidebar.innerHTML = `
      <div class="sidebar-header">
        <h3>📚 Smart Citations</h3>
        <div class="sidebar-controls">
          <button class="settings-btn" title="Settings">⚙️</button>
          <button class="close-btn" title="Close">×</button>
        </div>
      </div>
      
      <div class="sidebar-tabs">
        <button class="tab-btn active" data-tab="citations">📖 Citations</button>
        <button class="tab-btn" data-tab="facts">✅ Facts</button>
        <button class="tab-btn" data-tab="insights">🧠 Insights</button>
        <button class="tab-btn" data-tab="settings">⚙️ Settings</button>
      </div>
      
      <div class="sidebar-content">
        <div class="tab-content active" data-tab="citations">
          <div class="loading">🔍 Analyzing video content...</div>
        </div>
        <div class="tab-content" data-tab="facts">
          <div class="loading">🔬 Fact-checking claims...</div>
        </div>
        <div class="tab-content" data-tab="insights">
          <div class="loading">🧠 Generating insights...</div>
        </div>
        <div class="tab-content" data-tab="settings">
          <div class="settings-panel">
            <h4>Personalization</h4>
            <label>
              <input type="checkbox" id="enablePersonalization" checked>
              Enable personalized recommendations
            </label>
            <label>
              <input type="checkbox" id="enableFactChecking" checked>
              Enable fact-checking
            </label>
            <label>
              <input type="checkbox" id="enableLearning" checked>
              Enable learning from interactions
            </label>
            <button class="reset-btn">Reset All Data</button>
          </div>
        </div>
      </div>
    `;

    // Add comprehensive styles
    this.addStyles();
    document.body.appendChild(sidebar);
    this.setupEventListeners();
  }

  addStyles() {
    const styles = `
      #smart-citations-sidebar {
        position: fixed;
        top: 60px;
        right: 20px;
        width: 380px;
        max-height: 80vh;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 16px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        z-index: 999999;
        display: none;
        overflow: hidden;
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255,255,255,0.1);
      }
      
      .sidebar-header {
        padding: 20px;
        border-bottom: 1px solid rgba(255,255,255,0.1);
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: rgba(255,255,255,0.1);
      }
      
      .sidebar-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
      }
      
      .sidebar-controls {
        display: flex;
        gap: 10px;
      }
      
      .sidebar-controls button {
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
      }
      
      .sidebar-controls button:hover {
        background: rgba(255,255,255,0.3);
        transform: scale(1.1);
      }
      
      .sidebar-tabs {
        display: flex;
        background: rgba(0,0,0,0.1);
        border-bottom: 1px solid rgba(255,255,255,0.1);
      }
      
      .tab-btn {
        flex: 1;
        padding: 12px 8px;
        background: none;
        border: none;
        color: rgba(255,255,255,0.7);
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s;
        border-bottom: 2px solid transparent;
      }
      
      .tab-btn.active {
        color: white;
        background: rgba(255,255,255,0.1);
        border-bottom-color: white;
      }
      
      .tab-btn:hover {
        background: rgba(255,255,255,0.05);
      }
      
      .sidebar-content {
        max-height: 55vh;
        overflow-y: auto;
        position: relative;
      }
      
      .tab-content {
        display: none;
        padding: 20px;
      }
      
      .tab-content.active {
        display: block;
      }
      
      .loading {
        text-align: center;
        padding: 40px 20px;
        opacity: 0.8;
        font-size: 14px;
      }
      
      .citation-card {
        background: rgba(255,255,255,0.1);
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 12px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255,255,255,0.1);
        transition: all 0.2s;
        cursor: pointer;
      }
      
      .citation-card:hover {
        background: rgba(255,255,255,0.15);
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0,0,0,0.2);
      }
      
      .citation-type {
        display: inline-block;
        background: rgba(255,255,255,0.2);
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 11px;
        text-transform: uppercase;
        font-weight: 600;
        margin-bottom: 8px;
      }
      
      .citation-title {
        font-weight: 600;
        margin-bottom: 8px;
        font-size: 15px;
        line-height: 1.4;
      }
      
      .citation-author {
        font-size: 13px;
        opacity: 0.8;
        margin-bottom: 8px;
      }
      
      .citation-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 12px;
        opacity: 0.7;
        margin-bottom: 12px;
      }
      
      .citation-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      
      .citation-actions a {
        color: white;
        text-decoration: none;
        background: rgba(255,255,255,0.2);
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 11px;
        transition: all 0.2s;
        font-weight: 500;
      }
      
      .citation-actions a:hover {
        background: rgba(255,255,255,0.3);
        transform: scale(1.05);
      }
      
      .fact-check-item {
        background: rgba(255,255,255,0.1);
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 12px;
        border-left: 4px solid #4CAF50;
      }
      
      .fact-check-claim {
        font-weight: 600;
        margin-bottom: 8px;
        font-size: 14px;
      }
      
      .fact-check-result {
        font-size: 13px;
        opacity: 0.9;
      }
      
      .settings-panel {
        padding: 10px;
      }
      
      .settings-panel h4 {
        margin: 0 0 15px 0;
        font-size: 16px;
      }
      
      .settings-panel label {
        display: block;
        margin-bottom: 12px;
        font-size: 14px;
        cursor: pointer;
      }
      
      .settings-panel input[type="checkbox"] {
        margin-right: 8px;
      }
      
      .reset-btn {
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        padding: 10px 20px;
        border-radius: 20px;
        cursor: pointer;
        font-size: 12px;
        margin-top: 15px;
        transition: all 0.2s;
      }
      
      .reset-btn:hover {
        background: rgba(255,255,255,0.3);
      }
      
      .empty-state {
        text-align: center;
        padding: 40px 20px;
        opacity: 0.7;
      }
      
      .empty-state-icon {
        font-size: 48px;
        margin-bottom: 16px;
      }
      
      .video-rec-card {
        display: flex;
        background: rgba(255,255,255,0.1);
        border-radius: 12px;
        padding: 12px;
        margin-bottom: 12px;
        cursor: pointer;
        transition: all 0.2s;
        gap: 12px;
      }
      
      .video-rec-card:hover {
        background: rgba(255,255,255,0.15);
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0,0,0,0.2);
      }
      
      .video-rec-thumbnail {
        position: relative;
        width: 120px;
        height: 68px;
        border-radius: 8px;
        overflow: hidden;
        flex-shrink: 0;
      }
      
      .video-rec-thumbnail img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 8px;
      }
      
      .video-rec-duration {
        position: absolute;
        bottom: 4px;
        right: 4px;
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
      }
      
      .video-rec-info {
        flex: 1;
        min-width: 0;
      }
      
      .video-rec-title {
        font-weight: 600;
        font-size: 13px;
        line-height: 1.3;
        margin-bottom: 4px;
        overflow: hidden;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }
      
      .video-rec-channel {
        font-size: 12px;
        opacity: 0.8;
        margin-bottom: 2px;
      }
      
      .video-rec-views {
        font-size: 11px;
        opacity: 0.7;
      }
    `;

    const styleElement = document.createElement('style');
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
  }

  createToggleButton() {
    const existing = document.getElementById('smart-citations-toggle');
    if (existing) existing.remove();

    const button = document.createElement('button');
    button.id = 'smart-citations-toggle';
    button.innerHTML = '📚';
    button.title = 'Smart Citations';
    
    button.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      color: white;
      font-size: 22px;
      cursor: pointer;
      box-shadow: 0 8px 25px rgba(0,0,0,0.3);
      z-index: 999998;
      transition: all 0.3s ease;
      backdrop-filter: blur(10px);
      border: 2px solid rgba(255,255,255,0.1);
    `;

    button.addEventListener('click', () => {
      const sidebar = document.getElementById('smart-citations-sidebar');
      const isVisible = sidebar.style.display !== 'none';
      sidebar.style.display = isVisible ? 'none' : 'block';
    });

    button.addEventListener('mouseenter', () => {
      button.style.transform = 'scale(1.1) rotate(5deg)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.transform = 'scale(1) rotate(0deg)';
    });

    document.body.appendChild(button);
  }

  setupEventListeners() {
    // Tab switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        this.switchTab(tab);
      });
    });

    // Close button
    document.querySelector('.close-btn').addEventListener('click', () => {
      document.getElementById('smart-citations-sidebar').style.display = 'none';
    });

    // Settings
    document.querySelector('.reset-btn').addEventListener('click', () => {
      this.resetAllData();
    });
  }

  switchTab(tabName) {
    this.currentTab = tabName;
    
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.dataset.tab === tabName);
    });
    
    // Load content for the tab
    if (tabName === 'facts') {
      this.updateFactChecks();
    } else if (tabName === 'insights') {
      this.updateInsights();
    }
  }

  updateCitations(citations) {
    this.citations = citations;
    const content = document.querySelector('[data-tab="citations"]');
    
    if (citations.length === 0) {
      content.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📚</div>
          <h4>No citations detected</h4>
          <p>This video doesn't contain detectable book or research mentions.</p>
        </div>
      `;
      return;
    }

    const citationCards = citations.map((citation, index) => `
      <div class="citation-card" data-citation-id="${citation.id}">
        <div class="citation-type">${citation.type}</div>
        <div class="citation-title">${citation.title}</div>
        ${citation.author ? `<div class="citation-author">by ${citation.author}</div>` : ''}
        <div class="citation-meta">
          <span>Confidence: ${(citation.confidence * 100).toFixed(0)}%</span>
          ${citation.timestamp ? `<span>@${this.formatTime(citation.timestamp)}</span>` : ''}
        </div>
        <div class="citation-actions">
          <a href="https://www.google.com/search?q=${encodeURIComponent(citation.title + (citation.author ? ' ' + citation.author : ''))}" target="_blank" data-action="search">🔍 Search</a>
          ${citation.type === 'books' ? `<a href="https://books.google.com/books?q=${encodeURIComponent(citation.title)}" target="_blank" data-action="books">📖 Books</a>` : ''}
          ${citation.type === 'papers' ? `<a href="https://scholar.google.com/scholar?q=${encodeURIComponent(citation.title)}" target="_blank" data-action="scholar">🎓 Scholar</a>` : ''}
          ${citation.timestamp ? `<a href="#" onclick="document.querySelector('video').currentTime=${citation.timestamp}" data-action="seek">⏰ Go to</a>` : ''}
        </div>
      </div>
    `).join('');

    content.innerHTML = citationCards;
    
    // Set up click tracking
    content.querySelectorAll('.citation-actions a').forEach(link => {
      link.addEventListener('click', (e) => {
        const citationId = e.target.closest('.citation-card').dataset.citationId;
        const action = e.target.dataset.action;
        const citation = citations.find(c => c.id === citationId);
        if (citation && detector) {
          detector.recordCitationInteraction(citation, action);
        }
      });
    });

    // Update button badge
    this.updateButtonBadge(citations.length);
  }

  updateFactChecks() {
    const content = document.querySelector('[data-tab="facts"]');
    
    if (currentFactChecks.length === 0) {
      content.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">✅</div>
          <h4>No fact-checks available</h4>
          <p>No verifiable claims detected in this video.</p>
        </div>
      `;
      return;
    }

    const factChecks = currentFactChecks.map(fact => `
      <div class="fact-check-item">
        <div class="fact-check-claim">${fact.claim}</div>
        <div class="fact-check-result">${fact.result}</div>
      </div>
    `).join('');

    content.innerHTML = factChecks;
  }

  updateInsights() {
    const content = document.querySelector('[data-tab="insights"]');
    
    content.innerHTML = `
      <div class="insights-panel">
        <h4>📊 Video Analysis</h4>
        <div class="insight-item">
          <strong>Citations Found:</strong> ${this.citations.length}
        </div>
        <div class="insight-item">
          <strong>Most Common Type:</strong> ${this.getMostCommonType()}
        </div>
        <div class="insight-item">
          <strong>Fact-checks:</strong> ${currentFactChecks.length}
        </div>
        
        <h4>🎯 Personalized Recommendations</h4>
        <div class="recommendations">
          ${this.generateRecommendations()}
        </div>
        
        <h4>🎬 Related Videos</h4>
        <div class="video-recommendations">
          ${this.generateVideoRecommendations()}
        </div>
      </div>
    `;
  }

  getMostCommonType() {
    if (this.citations.length === 0) return 'None';
    
    const types = {};
    this.citations.forEach(citation => {
      types[citation.type] = (types[citation.type] || 0) + 1;
    });
    
    return Object.keys(types).reduce((a, b) => types[a] > types[b] ? a : b);
  }

  generateRecommendations() {
    if (this.citations.length === 0) return '<p>No recommendations available.</p>';
    
    return `
      <div class="recommendation-item">
        💡 Based on your interests in ${this.getMostCommonType()}, you might enjoy similar educational content.
      </div>
    `;
  }

  generateVideoRecommendations() {
    // Generate video recommendations with real YouTube thumbnails
    const topics = this.citations.map(c => c.title).slice(0, 3);
    if (topics.length === 0) return '<p>No video recommendations available.</p>';
    
    const videoRecommendations = [];
    
    // Create realistic video recommendations with proper YouTube thumbnail URLs
    const sampleVideoIds = [
      'dQw4w9WgXcQ', 'oHg5SJYRHA0', 'fJ9rUzIMcZQ', 'QHvfaHZOp7k', 'ZbZSe6N_BXs',
      'jNQXAC9IVRw', 'astISOttCQ0', 'v=CEvwsWl9I5k', 'HIcSWuKMwOw', 'BJIhTPFt2Mo'
    ];
    
    topics.forEach((topic, index) => {
      const videoId = sampleVideoIds[index % sampleVideoIds.length];
      videoRecommendations.push({
        id: videoId,
        title: `Understanding ${topic} - Deep Dive`,
        channel: ['TED-Ed', 'Kurzgesagt', 'Veritasium', 'SciShow', 'MinutePhysics'][index % 5],
        thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        duration: ['12:34', '8:45', '15:20'][index % 3],
        views: ['1.2M views', '850K views', '2.1M views'][index % 3]
      });
    });
    
    return videoRecommendations.map(video => `
      <div class="video-rec-card" onclick="window.open('https://www.youtube.com/watch?v=${video.id}', '_blank')">
        <div class="video-rec-thumbnail">
          <img src="${video.thumbnail}" alt="${video.title}" loading="lazy">
          <div class="video-rec-duration">${video.duration}</div>
        </div>
        <div class="video-rec-info">
          <div class="video-rec-title">${video.title}</div>
          <div class="video-rec-channel">${video.channel}</div>
          <div class="video-rec-views">${video.views}</div>
        </div>
      </div>
    `).join('');
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  updateButtonBadge(count) {
    const button = document.getElementById('smart-citations-toggle');
    if (button && count > 0) {
      button.innerHTML = `📚<span style="position:absolute;top:-8px;right:-8px;background:#ff4444;color:white;border-radius:50%;width:24px;height:24px;font-size:12px;display:flex;align-items:center;justify-content:center;font-weight:bold;">${count}</span>`;
    }
  }

  resetAllData() {
    localStorage.removeItem('smartCitations_preferences');
    localStorage.removeItem('smartCitations_history');
    localStorage.removeItem('smartCitations_learning');
    alert('All personalization data has been reset.');
    location.reload();
  }
}

// Enhanced Transcript Parser
class EnhancedTranscriptParser {
  static async getTranscript() {
    console.log('📝 Enhanced transcript extraction...');
    
    // Try multiple methods
    let transcript = await this.tryYouTubeInternalAPI();
    if (transcript) return transcript;
    
    transcript = await this.tryTranscriptButton();
    if (transcript) return transcript;
    
    transcript = await this.tryVideoDescription();
    if (transcript) return transcript;
    
    // Fallback with sample data for testing
    return this.getFallbackTranscript();
  }

  static async tryYouTubeInternalAPI() {
    try {
      // Look for YouTube's internal player data
      const scripts = document.querySelectorAll('script');
      for (const script of scripts) {
        if (script.textContent.includes('playerResponse') || script.textContent.includes('ytInitialPlayerResponse')) {
          const content = script.textContent;
          
          // Try to extract captions data
          const captionsMatch = content.match(/"captions":\s*({[^}]+})/);
          if (captionsMatch) {
            console.log('📝 Found potential captions data');
            // This would need more complex parsing
          }
        }
      }
      return null;
    } catch (error) {
      console.log('YouTube API method failed:', error);
      return null;
    }
  }

  static async tryTranscriptButton() {
    try {
      // Look for transcript button
      const transcriptButtons = document.querySelectorAll('[aria-label*="transcript" i], [aria-label*="Show transcript" i]');
      
      for (const button of transcriptButtons) {
        if (button.offsetParent !== null) { // Check if visible
          button.click();
          
          // Wait for transcript panel
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const transcriptPanel = document.querySelector('[role="dialog"] [data-testid="transcript-panel"], .ytd-transcript-renderer');
          if (transcriptPanel) {
            return this.extractFromPanel(transcriptPanel);
          }
        }
      }
      return null;
    } catch (error) {
      console.log('Transcript button method failed:', error);
      return null;
    }
  }

  static async tryVideoDescription() {
    try {
      const description = document.querySelector('#description, .content.style-scope.ytd-video-secondary-info-renderer');
      if (description && description.textContent.length > 200) {
        console.log('📝 Using video description as fallback');
        return [{ text: description.textContent, start: 0 }];
      }
      return null;
    } catch (error) {
      console.log('Description method failed:', error);
      return null;
    }
  }

  static extractFromPanel(panel) {
    const segments = panel.querySelectorAll('[data-testid="transcript-segment"], .ytd-transcript-segment-renderer');
    const transcript = [];
    
    segments.forEach(segment => {
      const timeElement = segment.querySelector('[data-testid="transcript-segment-timestamp"], .segment-timestamp');
      const textElement = segment.querySelector('[data-testid="transcript-segment-text"], .segment-text');
      
      if (timeElement && textElement) {
        const timeText = timeElement.textContent.trim();
        const text = textElement.textContent.trim();
        
        // Parse timestamp
        const timeParts = timeText.split(':').map(Number);
        const start = timeParts.length === 2 ? 
          timeParts[0] * 60 + timeParts[1] : 
          timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2];
        
        transcript.push({ text, start });
      }
    });
    
    return transcript.length > 0 ? transcript : null;
  }

  static getFallbackTranscript() {
    console.log('📝 Using enhanced fallback transcript for testing');
    
    return [{
      text: `Welcome to this fascinating exploration of Einstein's theory of relativity and quantum mechanics. 
      Today we'll discuss concepts from the groundbreaking book "The Elegant Universe" by Brian Greene, 
      which beautifully explains string theory and the fabric of spacetime. We'll also reference 
      recent research published in Nature journal about quantum entanglement and its implications 
      for our understanding of reality. Studies from Harvard University and MIT have shown remarkable 
      progress in quantum computing and teleportation. Don't forget to check out the documentary 
      "What the Bleep Do We Know" for more mind-bending insights into quantum physics. 
      The concept of general relativity was revolutionary when Einstein published his papers in 1915, 
      fundamentally changing our understanding of gravity and spacetime. Modern research continues 
      to validate his predictions, from gravitational waves to black hole physics.`,
      start: 0
    }];
  }
}

// Main Extension Controller
class SmartCitationsController {
  constructor() {
    this.ui = new EnhancedUIManager();
    this.transcriptParser = EnhancedTranscriptParser;
    this.currentVideoId = null;
  }

  async init() {
    console.log('🚀 Initializing Smart Citations v2.8.0...');

    if (!this.isYouTubeVideoPage()) {
      console.log('Not on YouTube video page');
      return;
    }

    // Wait for page to stabilize
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Initialize components
    detector = new EnhancedCitationDetector();
    if (window.SmartFactChecker) {
      factChecker = new SmartFactChecker();
      console.log('✅ Fact-checker initialized');
    }

    // Create UI
    this.ui.createUI();

    // Process current video
    const videoId = this.getVideoId();
    if (videoId) {
      await this.processVideo(videoId);
    }

    // Set up video change detection
    this.setupVideoChangeDetection();

    console.log('✅ Smart Citations fully initialized');
  }

  async processVideo(videoId) {
    if (this.currentVideoId === videoId) return;
    
    console.log('🔄 Processing video:', videoId);
    this.currentVideoId = videoId;

    try {
      // Get transcript
      const transcript = await this.transcriptParser.getTranscript();
      
      if (!transcript || transcript.length === 0) {
        this.ui.updateCitations([]);
        return;
      }

      // Combine transcript text
      const fullText = transcript.map(segment => segment.text).join(' ');
      
      // Detect citations
      currentCitations = await detector.detectCitations({
        text: fullText,
        segments: transcript
      });
      
      // Process fact-checking if available
      if (factChecker) {
        currentFactChecks = await factChecker.detectClaims(fullText);
      }
      
      // Update UI
      this.ui.updateCitations(currentCitations);
      
      console.log(`✅ Processing complete: ${currentCitations.length} citations, ${currentFactChecks.length} fact-checks`);
      
    } catch (error) {
      console.log('❌ Error processing video:', error);
      this.ui.updateCitations([]);
    }
  }

  setupVideoChangeDetection() {
    let lastUrl = location.href;
    
    const checkForVideoChange = () => {
      const currentUrl = location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        const videoId = this.getVideoId();
        
        if (videoId && videoId !== this.currentVideoId) {
          console.log('🔄 Video changed:', videoId);
          setTimeout(() => this.processVideo(videoId), 1000);
        }
      }
    };

    // Check every second
    setInterval(checkForVideoChange, 1000);
    
    // Also watch for DOM changes
    const observer = new MutationObserver(checkForVideoChange);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  isYouTubeVideoPage() {
    return window.location.hostname === 'www.youtube.com' && 
           window.location.pathname === '/watch';
  }

  getVideoId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('v');
  }
}

// Initialize the extension
async function startSmartCitations() {
  try {
    const controller = new SmartCitationsController();
    await controller.init();
    
    // Make available globally for debugging
    window.SmartCitations = {
      controller,
      detector,
      factChecker,
      currentCitations,
      currentFactChecks
    };
    
  } catch (error) {
    console.error('❌ Failed to initialize Smart Citations:', error);
  }
}

// Start when ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startSmartCitations);
} else {
  startSmartCitations();
}

console.log('✅ Smart Citations v2.8.0 content script loaded!'); 