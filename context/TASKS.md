# Citation Cross-Reference Extension - Task Board

## Doing  
- [ ] Debug and fix timestamp extraction from YouTube transcript panel to resolve "Jump to 0:00" issue
- [ ] Test timestamp matching accuracy with various YouTube videos with different transcript sources
- [x] Add citation context and relevance explanations - show WHY each citation matters
- [x] Add real YouTube thumbnails to video recommendations instead of placeholder images
- [x] Make AI analysis more robust and consistent across all YouTube videos
- [x] Add retry logic and enhanced error handling for LLM API calls
- [x] Implement comprehensive fallback analysis system with high-quality citations
- [x] Enhance status indicators and user feedback during AI analysis
- [x] Refine LLM prompt and validation to eliminate generic citations like "algebra" and "mathematics"
- [x] Improve citation prioritization to rank content-rich citations above generic geographic locations
- [x] Implement accurate timestamp matching for citations using transcript segment analysis

## To Do

### Phase 1: Foundation (Weeks 1-2)

### Phase 2: Core Citation Features (Weeks 3-4)

### Phase 3: Video Discovery Feature (Weeks 5-6)

### Phase 4: Enhanced Detection (Weeks 7-8)
- [x] Test and validate LLM integration with real YouTube videos with transcripts
- [x] Update citation display logic to show LLM-generated citations with rich metadata
- [x] Implement robust error handling and fallbacks for when Ollama is unavailable
- [x] Create enhanced sidebar UI with LLM citation indicators and confidence scores
- [ ] Enhance background script to manage LLM analysis requests efficiently
- [ ] Add performance optimization with intelligent chunking and caching
- [ ] Add settings and configuration for LLM features in popup
- [ ] Implement context-aware citation matching
- [ ] Add confidence scoring for detected citations
- [ ] Create user feedback system for improving accuracy

### Phase 5: Platform Expansion (Weeks 9-10)
- [ ] Add support for podcast platforms (Spotify Web Player)
- [ ] Implement audio transcript processing
- [ ] Add support for other video platforms
- [ ] Create universal citation database
- [ ] Add cross-platform synchronization

### Phase 6: Fact-Checking Feature (Weeks 11-14)
- [ ] Design claim detection patterns for factual statements
- [ ] Integrate fact-checking APIs (Wikipedia, government data)
- [ ] Build fact verification engine with confidence scoring
- [ ] Create fact-check UI tab in sidebar
- [ ] Add geographic and cultural context for travel content
- [ ] Implement real-time claim verification
- [ ] Test fact-checking accuracy on educational videos

### Phase 7: Polish & Launch (Weeks 15-16)
- [ ] Implement user preferences and settings
- [ ] Add citation history and bookmarking
- [ ] Create onboarding tutorial
- [ ] Optimize performance and loading times
- [ ] Prepare Chrome Web Store submission
- [ ] Create user documentation

## Done
- [x] Project planning and goal definition
- [x] Technical architecture design
- [x] Project structure creation
- [x] Set up basic Chrome extension structure and manifest
- [x] Create Chrome extension manifest and basic popup
- [x] Implement YouTube transcript access
- [x] Create sidebar UI for displaying results
- [x] Build enhanced citation detection (advanced regex patterns)
- [x] Integrate Google Books API for book verification
- [x] Create citation categorization (books, papers, articles)
- [x] Add real source links (Google Books, Amazon, Search)
- [x] Test enhanced citation detection with real YouTube videos
- [x] Fix UI button visibility issue on video navigation
- [x] Add Wikipedia API as fallback for papers/studies
- [x] Add Google Scholar API for research papers
- [x] Add timestamp synchronization with video playback
- [x] Improve citation confidence scoring
- [x] Implement YouTube Search API integration
- [x] Add video mention detection patterns
- [x] Create video recommendation cards in sidebar
- [x] Add filtering for video results (duration, views, relevance)
- [x] Test video discovery accuracy
- [x] Upgrade to NLP-based entity recognition (added support for places, people, companies, technologies, entertainment, products, history, and sports)
- [x] Major citation detection overhaul - implemented intent-based detection with explicit citation context patterns only
- [x] Added place and people detection - now detects locations like Malta and famous people mentioned in videos
- [x] Added comprehensive new categories: companies (Apple, Google), technologies (AI, Blockchain), historical events (World War II, French Revolution), with vastly expanded coverage
- [x] Built LLM-enhanced citation detection system using Ollama for local, context-aware analysis
- [x] Created advanced test interface with YouTube URL input, custom text testing, and transcript display
- [x] Integrated free local LLM (Llama 3.2) for superior citation accuracy and contextual understanding
- [x] Implement LLM-enhanced citation detection with Ollama integration
- [x] Integrate LLM citation detector into main content script for real YouTube videos
- [x] Set up automatic CORS proxy management for seamless LLM integration
- [x] Enhance transcript processing pipeline to send complete data to Ollama for analysis
- [x] Make AI analysis robust and consistent with retry logic and enhanced fallback system
- [x] Add racing/sports citation detection as additional feature to existing working UI
- [x] Enhance LLM prompts with racing-specific examples and filtering rules

## Backlog Ideas
- [ ] Integration with note-taking apps (Notion, Obsidian)
- [ ] Export citations to bibliography formats
- [ ] Social sharing of discovered sources
- [ ] AI-powered content summarization
- [ ] Mobile app companion 