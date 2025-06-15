# Citation Cross-Reference Extension - Technical Plan

## Project Overview
A Chrome extension that automatically detects citations and video references in educational content, providing instant access to sources and related videos.

## Technical Architecture

### Core Components

#### 1. Content Script (`content.js`)
- **Purpose**: Runs on YouTube and podcast pages to extract transcripts and inject UI
- **Responsibilities**:
  - Access YouTube transcript data
  - Monitor video playback for real-time processing
  - Inject sidebar UI into the page
  - Handle user interactions with detected citations

#### 2. Background Script (`background.js`)
- **Purpose**: Handles API calls and data processing
- **Responsibilities**:
  - Make API calls to external services (Google Books, Scholar, YouTube)
  - Process and cache citation data
  - Manage extension state across tabs
  - Handle cross-origin requests

#### 3. Citation Detection Engine (`citation-detector.js`)
- **Purpose**: Core logic for finding and categorizing mentions
- **Responsibilities**:
  - Parse transcript text for citation patterns
  - Extract entity names (books, papers, videos)
  - Categorize detected citations by type
  - Score confidence levels

#### 4. API Integration Layer (`api-manager.js`)
- **Purpose**: Unified interface for all external APIs
- **Responsibilities**:
  - Google Books API integration
  - Google Scholar API integration
  - YouTube Search API integration
  - Wikipedia API integration
  - Rate limiting and error handling

#### 5. UI Components (`ui/`)
- **Purpose**: User interface elements
- **Components**:
  - Sidebar container
  - Citation cards
  - Video recommendation cards
  - Settings panel
  - Loading states

### Data Flow

```
1. User watches YouTube video
2. Content script extracts transcript
3. Citation detector processes text chunks
4. Background script queries APIs for verification
5. UI displays verified citations in sidebar
6. User clicks citation → opens source
7. User sees related videos → clicks to watch
```

### API Integrations

#### Google Books API
- **Endpoint**: `https://www.googleapis.com/books/v1/volumes`
- **Purpose**: Verify book titles and get metadata
- **Data**: Title, author, cover, description, links

#### Google Scholar API (Alternative: Semantic Scholar)
- **Endpoint**: `https://api.semanticscholar.org/graph/v1/paper/search`
- **Purpose**: Find academic papers and research
- **Data**: Title, authors, abstract, DOI, citation count

#### YouTube Data API
- **Endpoint**: `https://www.googleapis.com/youtube/v3/search`
- **Purpose**: Find videos mentioned in content
- **Data**: Video title, channel, thumbnail, duration

#### Wikipedia API
- **Endpoint**: `https://en.wikipedia.org/api/rest_v1/page/summary/`
- **Purpose**: Fallback for general topics and verification
- **Data**: Summary, main image, page URL

### Detection Patterns

#### Citation Triggers
```javascript
const CITATION_PATTERNS = {
  books: [
    /(?:book|novel|memoir|biography)(?:\s+called|\s+titled|\s+named)?\s*[""']([^""']+)[""']/gi,
    /(?:in|from)\s+[""']([^""']+)[""']\s+by\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
    /(?:author|writer)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:wrote|published)\s+[""']([^""']+)[""']/gi
  ],
  papers: [
    /(?:study|research|paper|article)\s+(?:published\s+)?(?:in\s+)?([A-Z][^.]+)/gi,
    /(?:journal|publication)\s+([A-Z][^,]+)/gi,
    /(?:researchers?|scientists?)\s+(?:at\s+)?([A-Z][^.]+)\s+(?:found|discovered|showed)/gi
  ],
  videos: [
    /(?:video|clip|interview|documentary)\s+(?:called|titled|named)\s*[""']([^""']+)[""']/gi,
    /(?:watch|see|check out)\s+(?:the\s+)?(?:video|clip)\s+[""']([^""']+)[""']/gi,
    /(?:YouTube|TED\s+talk|interview)\s+(?:with\s+)?([A-Z][^.]+)/gi
  ]
};
```

### File Structure
```
extension/
├── manifest.json
├── popup/
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── content/
│   ├── content.js
│   ├── citation-detector.js
│   └── ui-injector.js
├── background/
│   ├── background.js
│   └── api-manager.js
├── ui/
│   ├── sidebar.html
│   ├── sidebar.css
│   ├── citation-card.js
│   └── video-card.js
├── assets/
│   ├── icons/
│   └── images/
├── utils/
│   ├── storage.js
│   ├── transcript-parser.js
│   └── helpers.js
└── tests/
    ├── unit/
    └── integration/
```

### Development Phases

#### Phase 1: MVP (Weeks 1-2)
- Basic extension structure
- YouTube transcript access
- Simple book detection
- Basic sidebar UI

#### Phase 2: Core Features (Weeks 3-4)
- API integrations
- Citation verification
- Timestamp synchronization
- Enhanced UI

#### Phase 3: Video Discovery (Weeks 5-6)
- Video mention detection
- YouTube search integration
- Video recommendation cards
- Result filtering

#### Phase 4: Intelligence (Weeks 7-8)
- NLP-based detection
- Confidence scoring
- User feedback system
- Performance optimization

#### Phase 5: Expansion (Weeks 9-10)
- Multi-platform support
- Podcast integration
- Cross-platform sync
- Advanced features

#### Phase 6: Launch (Weeks 11-12)
- Polish and testing
- Documentation
- Chrome Web Store submission
- User onboarding

### Performance Considerations
- **Lazy Loading**: Only process transcript chunks as needed
- **Caching**: Store API results to avoid duplicate requests
- **Rate Limiting**: Respect API quotas and implement backoff
- **Memory Management**: Clean up unused data and listeners
- **Background Processing**: Use web workers for heavy computation

### Privacy & Security
- **No Data Collection**: All processing happens locally
- **API Key Security**: Store keys securely, rotate regularly
- **User Consent**: Clear permissions and data usage
- **HTTPS Only**: All API calls over secure connections

This plan provides a comprehensive roadmap for building a powerful, user-friendly citation and video discovery extension that fills a genuine gap in the educational content consumption market. 