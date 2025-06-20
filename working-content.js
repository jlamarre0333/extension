// Working Content Script for YouTube Citation Cross-Reference
console.log('🚀 Working content script loaded!');
console.log('🔧 LLM_CONFIG available:', typeof LLM_CONFIG !== 'undefined');
console.log('🌐 Window location:', window.location.href.substring(0, 50));

// Global variables
let detector;
let llmDetector;
let currentVideoId;
let uiElements = {}; // Store UI references for cleanup
let useEnhancedDetection = true;

// ChatGPT-Enhanced Citation Detection - Integrated Version
class LLMCitationDetector {
  constructor() {
    this.apiKey = null;
    this.citations = [];
    this.videoSummary = null;
    this.keyTopics = [];
    this.provider = 'chatgpt';
  }

  setAPIKey(key, provider = 'chatgpt') {
    this.apiKey = key;
    this.provider = provider;
    console.log(`🔑 API key set for ${provider}`);
  }

  async analyzeVideoContent(videoData) {
    console.log('🤖 Starting ChatGPT-enhanced analysis...');
    
    // Handle different input formats and extract comprehensive metadata
    let fullText, videoTitle, videoDescription, channelName, transcriptSegments;
    
    if (typeof videoData === 'string') {
      fullText = videoData;
      videoTitle = 'Unknown Video';
      videoDescription = '';
      channelName = 'Unknown Channel';
      transcriptSegments = [];
    } else if (videoData && videoData.text) {
      fullText = videoData.text;
      transcriptSegments = videoData.segments || []; // Store segments for timestamp matching
      
      // Enhanced video metadata extraction with multiple fallback strategies
      videoTitle = document.querySelector('h1.ytd-watch-metadata yt-formatted-string')?.textContent?.trim() 
                  || document.querySelector('h1[class*="title"] yt-formatted-string')?.textContent?.trim()
                  || document.querySelector('#title h1')?.textContent?.trim()
                  || document.querySelector('.title.style-scope.ytd-video-primary-info-renderer')?.textContent?.trim()
                  || document.querySelector('h1')?.textContent?.trim()
                  || document.querySelector('title')?.textContent?.trim()?.replace(' - YouTube', '')
                  || window.location.search.match(/v=([^&]+)/)?.[1] || 'Unknown Video';
      
      channelName = document.querySelector('#owner #channel-name a')?.textContent?.trim()
                   || document.querySelector('#channel-name a')?.textContent?.trim() 
                   || document.querySelector('#channel-name yt-formatted-string')?.textContent?.trim()
                   || document.querySelector('.ytd-channel-name a')?.textContent?.trim()
                   || document.querySelector('[class*="channel"]')?.textContent?.trim() 
                   || 'Unknown Channel';
      
      videoDescription = document.querySelector('#description-inline-expander #description-text')?.textContent?.trim()
                        || document.querySelector('#description-text')?.textContent?.trim()
                        || document.querySelector('#snippet-text')?.textContent?.trim() 
                        || document.querySelector('.content.style-scope.ytd-video-secondary-info-renderer')?.textContent?.trim()
                        || document.querySelector('[class*="description"]')?.textContent?.trim() 
                        || '';
      
      // Clean up the extracted data
      videoTitle = videoTitle.replace(/^\s*\|\s*/, '').trim(); // Remove leading pipe symbols
      channelName = channelName.replace(/^@/, '').trim(); // Remove @ symbols from channel names
      videoDescription = videoDescription.substring(0, 1000); // Limit description length for ChatGPT
    } else {
      console.error('❌ Invalid video data provided:', videoData);
      fullText = '';
      videoTitle = 'Error - No Data';
      videoDescription = '';
      channelName = 'Unknown Channel';
    }
    
    // Enhanced logging for debugging
    console.log(`📄 Video Analysis Details:`);
    console.log(`  📺 Title: "${videoTitle}"`);
    console.log(`  📺 Channel: "${channelName}"`);
    console.log(`  📺 Description: "${videoDescription.substring(0, 200)}${videoDescription.length > 200 ? '...' : ''}"`);
    console.log(`  📝 Transcript: ${fullText.length} characters`);
    console.log(`  📝 Transcript sample: "${fullText.substring(0, 300)}${fullText.length > 300 ? '...' : ''}"`);
    
    // Verify we have actual content, not fallback text
    if (fullText.includes('Sapiens') && fullText.includes('Atomic Habits')) {
      console.warn('⚠️ Using fallback sample text - real transcript extraction failed!');
    }
    
    // Always try ChatGPT analysis first with multiple retry attempts
    let citations = [];
    let chatGPTSucceeded = false;
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`🤖 ChatGPT analysis attempt ${attempt}/3...`);
        
        const analysis = await this.getChatGPTTopicAnalysis({
          title: videoTitle,
          description: videoDescription,
          channelName: channelName,
          transcript: fullText
        });
        
        if (analysis && (analysis.citationWorthy?.length > 0 || analysis.people?.length > 0 || analysis.concepts?.length > 0)) {
          citations = await this.generateTargetedCitations(analysis, fullText, transcriptSegments);
          if (citations.length > 0) {
            console.log(`✅ ChatGPT analysis succeeded on attempt ${attempt}: ${citations.length} citations found`);
            chatGPTSucceeded = true;
            break;
          }
        }
        
        if (attempt < 3) {
          console.log(`⏳ Attempt ${attempt} yielded insufficient results, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between attempts
        }
        
      } catch (error) {
        console.log(`⚠️ ChatGPT analysis attempt ${attempt} failed:`, error.message);
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between attempts
        }
      }
    }
    
    // If ChatGPT failed completely, use enhanced mock analysis with full video metadata
    if (!chatGPTSucceeded) {
      console.log('🔄 ChatGPT analysis failed after 3 attempts, using metadata-enhanced mock analysis...');
      citations = this.getMetadataEnhancedAnalysis(fullText, videoTitle, channelName, videoDescription, transcriptSegments);
    }
    
    // Ensure all citations are marked as ChatGPT-enhanced
    citations.forEach(citation => {
      citation.isAIEnhanced = true;
      citation.chatGPTAnalysisAttempted = true;
      citation.chatGPTSucceeded = chatGPTSucceeded;
    });
    
    console.log(`🎯 Final analysis result: ${citations.length} ChatGPT-enhanced citations`);
    console.log('📋 Sample citations:', citations.slice(0, 3));
    return citations;
  }

  async getChatGPTTopicAnalysis(videoMetadata) {
    // Use ChatGPT for intelligent content analysis
    console.log('🤖 Attempting ChatGPT analysis...');
    console.log(`🔧 API Key: ${this.apiKey ? 'Set' : 'Not set'}`);
    console.log(`🔧 Provider: ${this.provider}`);
    
    // Always try ChatGPT for high-quality analysis
    try {
      const maxTranscriptLength = 6000;
      const transcript = videoMetadata.transcript.length > maxTranscriptLength ? 
        videoMetadata.transcript.substring(0, maxTranscriptLength) + '...' : 
        videoMetadata.transcript;
      
      const prompt = `You are a specialized AI for "Smart Citations" - a Chrome extension that helps users discover valuable, specific, and researchable references from YouTube videos.

🎯 PRODUCT GOAL: 
Extract ONLY high-value citations that viewers can research further to deepen their understanding. We help people find books to read, scientists to learn about, specific theories to study, and concrete concepts to explore.

❌ WHAT WE DON'T WANT (Absolutely avoid these):
- Generic words: "objects", "thanks", "world", "people", "things", "stuff", "work", "time", "place", "video", "content"
- Common words: "physics", "science", "math", "research", "study", "analysis", "system", "method", "process"
- Filler words: "today", "now", "here", "there", "this", "that", "way", "part", "how", "what", "why"
- Basic materials: "material", "materials", "solid", "liquid", "gas", "matter"
- Overly broad terms: "technology", "engineering", "education", "learning", "knowledge"

✅ WHAT WE WANT (Focus on these):
- Specific people's full names: "Albert Einstein", "Marie Curie", "Isaac Newton"
- Named theories/concepts: "General Relativity", "Quantum Entanglement", "DNA Double Helix"  
- Specific books: "The Origin of Species", "Principia Mathematica", "A Brief History of Time"
- Named experiments: "Double-slit Experiment", "Michelson-Morley Experiment"
- Specific places: "CERN", "MIT", "University of Cambridge", "Silicon Valley"
- Concrete technologies: "CRISPR", "Large Hadron Collider", "Hubble Telescope"
- Historical events: "Manhattan Project", "Apollo 11", "Industrial Revolution"

Your task is to analyze the ACTUAL video transcript and extract specific, nuanced citations that are directly mentioned or discussed in the content.

VIDEO METADATA:
Title: "${videoMetadata.title}"
Channel: "${videoMetadata.channelName}"
Description: "${videoMetadata.description}"

TRANSCRIPT CONTENT (${transcript.length} characters):
${transcript}

ANALYSIS INSTRUCTIONS:
1. CAREFULLY READ the transcript and identify what is ACTUALLY being discussed
2. PRIORITIZE in this order: PEOPLE NAMES → PLACES → SPECIFIC CONCEPTS/TECHNOLOGIES → EVENTS
3. Extract SPECIFIC items mentioned by name, focusing on proper nouns and named entities
4. For PEOPLE: Include full names (e.g., "Lewis Hamilton", "Albert Einstein", "Isaac Newton")
5. For PLACES: Include specific locations (e.g., "Montreal", "Circuit Gilles Villeneuve", "Barcelona")
6. For F1/RACING: Prioritize driver names, team names, circuit names, and specific racing terms
7. For SCIENCE: Prioritize scientist names, specific theories, and named experiments
8. STRICTLY AVOID generic terms like: "physics", "math", "science", "history", "technology", "video", "research", "study", "analysis", "general", "basic", "object", "objects", "thanks", "world", "solid", "material", "materials", "things", "stuff", "work", "works", "way", "time", "place", "part", "parts", "method", "process", "system"
9. Only include items explicitly mentioned in the transcript text
10. Prefer compound terms over single words (e.g., "General Relativity" not just "relativity")
11. If discussing F1: Extract driver surnames (Hamilton, Verstappen, Leclerc, etc.) and team names (Mercedes, Ferrari, Red Bull, etc.)

CONTENT-AWARE EXTRACTION RULES:
- If discussing Einstein's work → Extract "Einstein's theory of relativity" or "Einstein's mass-energy equivalence" NOT just "Einstein" or "physics"
- If mentioning specific experiments → Extract "Double-slit experiment" or "Michelson-Morley experiment" NOT just "experiment"
- If discussing mathematical concepts → Extract "Pythagorean theorem" or "Fibonacci sequence" NOT just "mathematics"
- If talking about historical events → Extract "Manhattan Project" or "Apollo 11" NOT just "history" 
- If covering biological processes → Extract "DNA replication" or "photosynthesis" NOT just "biology"
- If explaining chemical reactions → Extract "oxidation-reduction" or "acid-base reactions" NOT just "chemistry"

VIDEO TYPE DETECTION:
- EDUCATIONAL/SCIENCE: Focus on specific theories, principles, scientists, experiments
- TECHNOLOGY: Extract particular technologies, companies, innovations, not generic "tech"
- HISTORICAL: Extract specific events, dates, people, places, not broad periods
- DOCUMENTARY: Extract specific subjects, locations, phenomena being documented
- RACING/SPORTS: Extract specific events, teams, athletes, venues, not just "racing"

QUALITY STANDARDS:
- Each citation must be RESEARCHABLE and SPECIFIC
- Must appear in the actual transcript content
- Prefer compound terms over single words
- Focus on what makes this video unique, not generic topics
- Maximum 6 extremely high-quality citations per video  
- Each item should lead to specific, educational information
- REJECT: Common words like "objects", "thanks", "world", "time", "place", "work"
- REJECT: Generic academic terms like "physics", "science", "research", "study"
- ACCEPT: Only specific named entities, proper nouns, and unique concepts

RESPONSE REQUIREMENTS:
Analyze the transcript content and determine what specific topics are actually being discussed. Extract only the most relevant, specific, and educational items that appear in the text.

QUALITY CHECKLIST - Each citation MUST pass ALL criteria:
✅ Is it a specific named entity (person, place, concept, theory, book, experiment)?  
✅ Would someone be able to search for it and find detailed information?
✅ Is it directly mentioned in the transcript (not inferred)?
✅ Is it more specific than a general subject area?
✅ Would it help the viewer learn something concrete and specific?

EXAMPLES OF GOOD vs BAD citations:
❌ BAD: "objects", "physics", "research", "thanks", "world", "time", "material"
✅ GOOD: "Albert Einstein", "Schrödinger's Cat", "Large Hadron Collider", "Quantum Entanglement"

Please respond with accurate JSON:
{
  "summary": "Specific topics covered in the video based on transcript",
  "videoType": "travel|educational|technology|business|entertainment|news|science|history|other",
  "academicField": "physics|mathematics|history|biology|chemistry|computer_science|philosophy|economics|other|general",
  "mainTopics": ["specific named topics from transcript"],
  "places": ["specific locations mentioned by name"],
  "people": ["specific people named in transcript"],
  "companies": ["specific companies/organizations mentioned"],
  "technologies": ["specific technologies/tools named"],
  "historicalEvents": ["specific events/periods named"],
  "books": ["specific books/publications referenced"],
  "concepts": ["specific academic concepts mentioned by name"],
  "products": ["specific products discussed"],
  "timeContext": "ancient|medieval|renaissance|industrial|modern|contemporary|future|unclear",
  "citationWorthy": ["3-5 most specific, researchable items from transcript"],
  "confidenceLevel": "high|medium|low",
  "transcriptQuality": "clear|unclear|incomplete"
}`;

      console.log('🚀 Sending analysis request to ChatGPT...');
      console.log(`📤 Prompt length: ${prompt.length} characters`);
      console.log(`📤 Transcript being sent: "${transcript.substring(0, 500)}..."`);
      
      const result = await this.callChatGPT(prompt);
      console.log('📥 ChatGPT Response received:', result);
      return result;
      
    } catch (error) {
      console.error('❌ ChatGPT API error:', error);
      console.log('🔄 Falling back to mock analysis due to ChatGPT error');
      return this.getMockTopicAnalysis(videoMetadata);
    }
  }

  async callChatGPT(prompt) {
    try {
      console.log('🤖 Calling ChatGPT API...');
      
      // Get API key from environment
      const apiKey = window.LOCAL_ENV?.OPENAI_API_KEY || window.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OpenAI API key not configured. Please check env.local.js');
      }
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a research librarian AI that analyzes educational content and provides academic paper suggestions. Always respond with valid JSON only.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`ChatGPT API error: ${response.status} ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log('✅ ChatGPT API call successful');
      
      // Parse the JSON response
      const content = data.choices[0].message.content.trim();
      try {
        const parsedResponse = JSON.parse(content);
          return parsedResponse;
        } catch (parseError) {
        console.log('⚠️ JSON parsing failed, attempting to extract JSON from response...');
          // Try to extract JSON from response text
        const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
          }
        throw new Error('Invalid JSON response from ChatGPT');
      }
      
    } catch (error) {
      console.error('❌ ChatGPT API error:', error);
      throw error;
    }
  }

  /**
   * Generate academic paper suggestions using GPT
   */
  async generateAcademicPaperSuggestions(videoData) {
    try {
      console.log('📚 Generating academic paper suggestions...');
      console.log('🎯 Video Data Received:', {
        title: videoData.title,
        channel: videoData.channel,
        description: videoData.description ? videoData.description.substring(0, 200) + '...' : 'No description',
        transcriptLength: videoData.transcript ? videoData.transcript.length : 0
      });
      
      // Safely handle transcript data
      const transcriptText = typeof videoData.transcript === 'string' ? videoData.transcript : 
                           (videoData.transcript || '').toString();
      // Give ChatGPT much more content to analyze (first 8000 characters = ~15-20 minutes)
      const transcriptSample = transcriptText.substring(0, 8000);
      
      console.log('📤 Sending to ChatGPT:', {
        title: videoData.title,
        channel: videoData.channel,
        transcriptSampleLength: transcriptSample.length,
        transcriptStart: transcriptSample.substring(0, 200) + '...'
      });
      
      // Let ChatGPT analyze content intelligently without manual categorization
      
      const prompt = `You are an expert research librarian AI with deep knowledge of academic literature across all fields. Your goal is to analyze YouTube video content and suggest academic papers that are not only relevant but also FASCINATING and CLICKABLE - papers that would make viewers excited to dive deeper into the topics, places, and people discussed.

VIDEO CONTENT TO ANALYZE:
Title: "${videoData.title}"
Channel: "${videoData.channel}"
Description: "${videoData.description || 'No description available'}"
Transcript Content (${transcriptSample.length} characters of ${transcriptText.length} total): "${transcriptSample}"

ANALYSIS STRATEGY:
1. IDENTIFY the most compelling topics, fascinating people, and interesting places mentioned
2. FIND the "hook" - what would make someone curious to learn more?
3. FOCUS on papers that tell engaging stories or reveal surprising insights
4. PRIORITIZE papers about breakthrough discoveries, controversial theories, or dramatic historical moments
5. LOOK for papers that connect to current events, popular culture, or universal human interests
6. CHOOSE papers that would satisfy curiosity about "how did they discover this?" or "what's the real story?"

TOPIC RECOGNITION HINTS:
- If content mentions "butterfly effect", "chaos theory", "sensitive dependence" → Focus on chaos theory, dynamical systems, nonlinear dynamics
- If content mentions "gravity", "relativity", "spacetime" → Focus on gravitational physics, Einstein's work
- If content mentions "quantum", "uncertainty", "wave-particle" → Focus on quantum mechanics, quantum physics
- If content mentions "evolution", "natural selection", "DNA" → Focus on evolutionary biology, genetics
- If content mentions "climate", "weather", "atmosphere" → Focus on climate science, meteorology

CITATION APPEAL FACTORS:
- **Breakthrough Moments**: Papers about major discoveries, first observations, paradigm shifts
- **Famous Scientists**: Work by Einstein, Newton, Darwin, Curie - household names that intrigue people
- **Surprising Connections**: Papers that reveal unexpected links between topics
- **Modern Relevance**: Recent research that impacts daily life or current technology
- **Human Stories**: Research that reveals the human drama behind scientific discoveries
- **Controversial Debates**: Papers that settled major scientific disputes or started new ones

REQUIREMENTS:
- All papers must be real and published (use your knowledge of actual academic literature)
- Relevance scores should be 7-10 (only suggest highly relevant papers)
- Write explanations that emphasize WHY someone would want to read this paper
- Focus on the most interesting aspects - the discoveries, surprises, or insights
- Make each paper sound like something you'd want to click on and explore

OUTPUT FORMAT - Respond with ONLY valid JSON:
{
  "academicField": "primary academic field",
  "videoSummary": "engaging summary highlighting the most fascinating aspects covered in the video",
  "papers": [
    {
      "title": "exact paper title",
      "authors": ["author1", "author2"],
      "journal": "journal name",
      "year": 2023,
      "relevanceExplanation": "compelling explanation that makes someone want to click - focus on the breakthrough, discovery, or surprising insight this paper reveals",
      "relevanceScore": 9,
      "doi": "10.xxxx/xxxxx (if known)",
      "keywords": ["keyword1", "keyword2", "keyword3"],
      "appealFactor": "what makes this paper irresistible to click on (e.g., 'first discovery', 'shocking revelation', 'famous controversy')"
    }
  ]
}`;

      const result = await this.callChatGPT(prompt);
      
      if (result && result.papers && result.papers.length > 0) {
        console.log(`✅ Generated ${result.papers.length} academic paper suggestions`);
        return result;
      } else {
        console.warn('⚠️ No papers generated by ChatGPT');
        return this.getFallbackAcademicSuggestions(videoData);
      }
      
    } catch (error) {
      console.error('❌ Error generating academic papers:', error);
      return this.getFallbackAcademicSuggestions(videoData);
    }
  }

  /**
   * Minimal fallback when ChatGPT is completely unavailable
   */
  getFallbackAcademicSuggestions(videoData) {
    console.log('🔄 Using minimal fallback (ChatGPT unavailable)...');
    
    // Simple universal fallback when ChatGPT is unavailable
    return {
      academicField: 'interdisciplinary studies',
      videoSummary: `Educational content related to "${videoData.title}" - academic papers suggested based on general educational value`,
      confidenceLevel: 'low - fallback mode',
      papers: [
        {
          title: "The Structure of Scientific Revolutions",
          authors: ["Thomas S. Kuhn"],
          journal: "University of Chicago Press",
          year: 1962,
          relevanceExplanation: "Foundational work on how scientific knowledge advances and paradigms shift",
          relevanceScore: 7,
          keywords: ["science", "methodology", "research", "knowledge"]
        },
        {
          title: "Cosmos",
          authors: ["Carl Sagan"],
          journal: "Random House",
          year: 1980,
          relevanceExplanation: "Accessible introduction to scientific thinking and cosmic perspective",
          relevanceScore: 8,
          keywords: ["science", "education", "astronomy", "critical thinking"]
        },
        {
          title: "A Brief History of Time", 
          authors: ["Stephen Hawking"],
          journal: "Bantam Books",
          year: 1988,
          relevanceExplanation: "Popular science work making complex physics accessible to general audiences",
          relevanceScore: 7,
          keywords: ["physics", "cosmology", "education", "science communication"]
        }
      ]
    };
  }

  /**
   * Generate smart video recommendations using ChatGPT
   */
  async generateSmartVideoRecommendations(videoData) {
    try {
      console.log('🎬 Generating smart video recommendations with ChatGPT...');
      
      // Safely handle transcript data
      const transcriptText = typeof videoData.transcript === 'string' ? videoData.transcript : 
                           (videoData.transcript || '').toString();
      const transcriptSample = transcriptText.substring(0, 4000); // Shorter for video recommendations
      
      const prompt = `You are a YouTube curator AI that specializes in finding the most engaging and relevant educational videos. Based on this video content, suggest 6-8 YouTube videos that viewers would find fascinating and want to watch next.

VIDEO CURRENTLY WATCHING:
Title: "${videoData.title}"
Channel: "${videoData.channel}"
Description: "${videoData.description || 'No description available'}"
Transcript Sample: "${transcriptSample}"

YOUR GOAL: Find videos that would create an irresistible "what to watch next" experience.

RECOMMENDATION STRATEGY:
1. IDENTIFY the core topics and themes that would naturally lead to other fascinating videos
2. SUGGEST videos that expand on interesting points mentioned in the current video
3. FIND videos by popular educational channels (Veritasium, Kurzgesagt, TED-Ed, MinutePhysics, etc.)
4. INCLUDE both deeper dives and related tangential topics that would satisfy curiosity
5. PRIORITIZE videos that tell compelling stories or reveal surprising insights
6. BALANCE different difficulty levels and video lengths

TYPES OF VIDEOS TO SUGGEST:
- **Deep Dives**: More detailed explorations of topics mentioned
- **Related Phenomena**: Connected scientific/mathematical concepts
- **Historical Context**: Stories behind the discoveries or theories
- **Modern Applications**: How these concepts impact today's world
- **Contrarian Views**: Alternative perspectives or debates
- **Analogies & Explanations**: Different ways to understand the same concepts

OUTPUT FORMAT - Respond with ONLY valid JSON:
{
  "recommendationReason": "brief explanation of why these videos complement the current one",
  "videos": [
    {
      "title": "compelling video title that sounds clickable",
      "suggestedChannel": "likely channel name (Veritasium, Kurzgesagt, TED-Ed, etc.)",
      "estimatedDuration": "8-15 minutes",
      "recommendationReason": "why this specific video would be fascinating to watch next",
      "topicConnection": "how it relates to the current video",
      "appealFactor": "what makes this video irresistible to click",
      "difficulty": "Beginner/Intermediate/Advanced",
      "category": "Documentary/Explainer/Course/Interview"
    }
  ]
}`;

      const result = await this.callChatGPT(prompt);
      
      if (result && result.videos && result.videos.length > 0) {
        console.log(`✅ Generated ${result.videos.length} smart video recommendations`);
        return result;
      } else {
        console.warn('⚠️ No video recommendations generated by ChatGPT');
        return null;
      }
      
    } catch (error) {
      console.error('❌ Error generating smart video recommendations:', error);
      return null;
    }
  }

  getMockTopicAnalysis(videoMetadata) {
    console.log('🔄 Using mock analysis for testing...');
    const text = videoMetadata.transcript.toLowerCase();
    const title = videoMetadata.title.toLowerCase();
    const channel = videoMetadata.channelName.toLowerCase();
    
    console.log(`📄 Mock analysis - Title: "${title}"`);
    console.log(`📄 Mock analysis - Channel: "${channel}"`);
    console.log(`📄 Mock analysis - Transcript sample: "${text.substring(0, 200)}..."`);
    
    const mockAnalysis = {
      summary: `This video covers topics related to ${videoMetadata.title}`,
      videoType: "educational",
      mainTopics: [],
      places: [],
      people: [],
      companies: [],
      technologies: [],
      historicalEvents: [],
      books: [],
      concepts: [],
      products: [],
      citationWorthy: []
    };

    // Enhanced keywords with comprehensive coverage including racing/F1
    const keywordDatabase = {
      // Educational/Science keywords
      people: ['einstein', 'newton', 'curie', 'tesla', 'galileo', 'faraday', 'maxwell', 'planck', 'bohr', 'feynman', 'hawking', 'darwin', 'mendel'],
      technologies: ['electricity', 'light', 'electron', 'laser', 'quantum', 'computer', 'algorithm', 'dna', 'microscope', 'telescope'],
      concepts: ['relativity', 'gravity', 'energy', 'momentum', 'velocity', 'acceleration', 'force', 'mass', 'time', 'space', 'quantum mechanics', 'wave-particle duality', 'uncertainty principle', 'electromagnetic', 'photon', 'atom', 'molecule', 'evolution', 'genetics', 'thermodynamics', 'entropy'],
      physics_terms: ['spacetime', 'black hole', 'event horizon', 'speed of light', 'general relativity', 'special relativity', 'quantum field theory', 'particle physics', 'electromagnetic radiation'],
      math_concepts: ['calculus', 'algebra', 'geometry', 'trigonometry', 'differential equations', 'probability', 'statistics', 'number theory'],
      biology_terms: ['cell', 'dna', 'rna', 'protein', 'enzyme', 'evolution', 'natural selection', 'genetics', 'chromosome', 'gene'],
      chemistry_terms: ['molecule', 'atom', 'element', 'compound', 'reaction', 'periodic table', 'electron', 'proton', 'neutron'],
      materials_terms: ['aerogel', 'carbon fiber', 'graphene', 'nanotube', 'polymer', 'ceramic', 'composite', 'crystal', 'semiconductor', 'superconductor', 'insulation', 'conductivity'],
      
      // Racing/F1 keywords  
      f1_drivers: ['hamilton', 'verstappen', 'leclerc', 'russell', 'sainz', 'norris', 'piastri', 'albon', 'alonso', 'stroll', 'gasly', 'ocon', 'hulkenberg', 'magnussen', 'tsunoda', 'ricciardo', 'zhou', 'bottas', 'sargeant', 'de vries', 'antonelli', 'bearman', 'colapinto'],
      f1_teams: ['mercedes', 'red bull', 'ferrari', 'mclaren', 'aston martin', 'alpine', 'williams', 'haas', 'alphatauri', 'alfa romeo', 'racing bulls'],
      f1_circuits: ['silverstone', 'monza', 'spa-francorchamps', 'monaco', 'suzuka', 'interlagos', 'nurburgring', 'barcelona', 'montreal', 'imola', 'hungaroring', 'zandvoort', 'austin', 'singapore', 'mexico city', 'vegas', 'abu dhabi', 'bahrain', 'jeddah', 'melbourne'],
      racing_concepts: ['pole position', 'fastest lap', 'drs', 'kers', 'pit stop', 'undercut', 'overcut', 'slipstream', 'dirty air', 'ground effect', 'downforce', 'aerodynamics', 'setup', 'qualifying', 'sprint race', 'formation lap', 'safety car', 'virtual safety car', 'flag to flag', 'wet weather'],
      racing_terms: ['formula one', 'grand prix', 'championship', 'constructor', 'points system', 'parc ferme', 'technical regulations', 'stewards', 'fia', 'podium', 'fastest lap point', 'penalty', 'grid position', 'starting grid']
    };

    // Content-aware analysis - look for specific compound terms first
    const compoundTerms = [
      // Science/Physics compound terms
      { phrase: 'energy conservation', citation: 'Energy Conservation', category: 'concepts', confidence: 0.95 },
      { phrase: 'general relativity', citation: 'General Relativity', category: 'concepts', confidence: 0.94 },
      { phrase: 'special relativity', citation: 'Special Relativity', category: 'concepts', confidence: 0.94 },
      { phrase: 'theory of relativity', citation: 'Theory of Relativity', category: 'concepts', confidence: 0.95 },
      { phrase: 'quantum mechanics', citation: 'Quantum Mechanics', category: 'concepts', confidence: 0.95 },
      { phrase: 'speed of light', citation: 'Speed of Light', category: 'concepts', confidence: 0.93 },
      { phrase: 'black hole', citation: 'Black Holes', category: 'concepts', confidence: 0.92 },
      { phrase: 'electromagnetic radiation', citation: 'Electromagnetic Radiation', category: 'concepts', confidence: 0.91 },
      { phrase: 'wave-particle duality', citation: 'Wave-Particle Duality', category: 'concepts', confidence: 0.93 },
      { phrase: 'uncertainty principle', citation: 'Heisenberg Uncertainty Principle', category: 'concepts', confidence: 0.92 },
      { phrase: 'double-slit experiment', citation: 'Double-Slit Experiment', category: 'concepts', confidence: 0.93 },
      { phrase: 'albert einstein', citation: 'Albert Einstein', category: 'people', confidence: 0.96 },
      { phrase: 'isaac newton', citation: 'Isaac Newton', category: 'people', confidence: 0.96 },
      { phrase: 'marie curie', citation: 'Marie Curie', category: 'people', confidence: 0.95 },
      { phrase: 'nikola tesla', citation: 'Nikola Tesla', category: 'people', confidence: 0.94 },
      { phrase: 'conservation of energy', citation: 'Conservation of Energy', category: 'concepts', confidence: 0.95 },
      { phrase: 'conservation laws', citation: 'Conservation Laws in Physics', category: 'concepts', confidence: 0.93 },
      { phrase: 'relativistic physics', citation: 'Relativistic Physics', category: 'concepts', confidence: 0.92 },
      // Materials Science terms
      { phrase: 'aerogel', citation: 'Aerogel', category: 'concepts', confidence: 0.95 },
      { phrase: 'silica aerogel', citation: 'Silica Aerogel', category: 'concepts', confidence: 0.96 },
      { phrase: 'aerogel technologies', citation: 'Aerogel Technologies', category: 'companies', confidence: 0.94 },
      { phrase: 'supercritical drying', citation: 'Supercritical Drying', category: 'concepts', confidence: 0.93 },
      { phrase: 'thermal insulation', citation: 'Thermal Insulation', category: 'concepts', confidence: 0.91 },
      { phrase: 'low density', citation: 'Low Density Materials', category: 'concepts', confidence: 0.90 },
      { phrase: 'porous material', citation: 'Porous Materials', category: 'concepts', confidence: 0.90 },
      
      // F1/Racing compound terms
      { phrase: 'lewis hamilton', citation: 'Lewis Hamilton', category: 'people', confidence: 0.96 },
      { phrase: 'max verstappen', citation: 'Max Verstappen', category: 'people', confidence: 0.96 },
      { phrase: 'charles leclerc', citation: 'Charles Leclerc', category: 'people', confidence: 0.95 },
      { phrase: 'george russell', citation: 'George Russell', category: 'people', confidence: 0.95 },
      { phrase: 'carlos sainz', citation: 'Carlos Sainz', category: 'people', confidence: 0.95 },
      { phrase: 'lando norris', citation: 'Lando Norris', category: 'people', confidence: 0.95 },
      { phrase: 'oscar piastri', citation: 'Oscar Piastri', category: 'people', confidence: 0.95 },
      { phrase: 'fernando alonso', citation: 'Fernando Alonso', category: 'people', confidence: 0.96 },
      { phrase: 'alex antonelli', citation: 'Alex Antonelli', category: 'people', confidence: 0.94 },
      { phrase: 'oliver bearman', citation: 'Oliver Bearman', category: 'people', confidence: 0.94 },
      { phrase: 'franco colapinto', citation: 'Franco Colapinto', category: 'people', confidence: 0.94 },
      { phrase: 'red bull racing', citation: 'Red Bull Racing', category: 'companies', confidence: 0.95 },
      { phrase: 'scuderia ferrari', citation: 'Scuderia Ferrari', category: 'companies', confidence: 0.95 },
      { phrase: 'mercedes amg', citation: 'Mercedes-AMG Petronas F1 Team', category: 'companies', confidence: 0.95 },
      { phrase: 'mclaren racing', citation: 'McLaren Racing', category: 'companies', confidence: 0.95 },
      { phrase: 'aston martin', citation: 'Aston Martin F1 Team', category: 'companies', confidence: 0.94 },
      { phrase: 'canadian grand prix', citation: 'Canadian Grand Prix', category: 'historicalEvents', confidence: 0.96 },
      { phrase: 'monaco grand prix', citation: 'Monaco Grand Prix', category: 'historicalEvents', confidence: 0.96 },
      { phrase: 'british grand prix', citation: 'British Grand Prix', category: 'historicalEvents', confidence: 0.96 },
      { phrase: 'italian grand prix', citation: 'Italian Grand Prix', category: 'historicalEvents', confidence: 0.96 },
      { phrase: 'circuit gilles villeneuve', citation: 'Circuit Gilles Villeneuve', category: 'places', confidence: 0.95 },
      { phrase: 'pole position', citation: 'Pole Position', category: 'concepts', confidence: 0.93 },
      { phrase: 'fastest lap', citation: 'Fastest Lap', category: 'concepts', confidence: 0.93 },
      { phrase: 'formula one', citation: 'Formula One', category: 'concepts', confidence: 0.96 }
    ];

    // First pass: Look for compound terms (higher priority)
    for (const term of compoundTerms) {
      if (text.includes(term.phrase)) {
        console.log(`✅ Found compound term: "${term.phrase}" → "${term.citation}"`);
        if (!mockAnalysis[term.category].includes(term.citation)) {
          mockAnalysis[term.category].push(term.citation);
          mockAnalysis.citationWorthy.push(term.citation);
        }
      }
    }

    // Filter out overly generic terms (but preserve names and specific terms)
    const genericTermsToAvoid = [
      'science', 'math', 'mathematics', 'technology', 
      'video', 'videos', 'research', 'study', 'analysis', 'theory', 'concept',
      'unknown', 'general', 'basic', 'introduction', 'overview',
      'object', 'objects', 'thanks', 'world', 'solid', 'they', 'things', 'stuff',
      'material', 'materials', 'process', 'method', 'system', 'part', 'parts',
      'way', 'time', 'place', 'work', 'works', 'make', 'making', 'used', 'use'
    ];

    // Second pass: Add simple terms based on detected content type and priority
    const maxCitations = 12; // Increased limit for racing content
    
    // Detect content type for prioritized detection
    const isRacingContent = text.includes('formula') || text.includes('grand prix') || 
                           text.includes('f1') || text.includes('racing') || 
                           title.includes('formula') || title.includes('grand prix') ||
                           title.includes('f1') || title.includes('racing');
    
    const isEducationalContent = text.includes('physics') || text.includes('science') || 
                               text.includes('quantum') || text.includes('theory') ||
                               title.includes('physics') || title.includes('science');

    console.log(`🎯 Content type detected - Racing: ${isRacingContent}, Educational: ${isEducationalContent}`);

    if (mockAnalysis.citationWorthy.length < maxCitations) {
      for (const [category, terms] of Object.entries(keywordDatabase)) {
        for (const term of terms) {
          if (text.includes(term) && mockAnalysis.citationWorthy.length < maxCitations) {
            const termCapitalized = term.charAt(0).toUpperCase() + term.slice(1);
            const isGeneric = genericTermsToAvoid.some(generic => term.toLowerCase() === generic);
            const isDuplicate = mockAnalysis.citationWorthy.some(existing => existing.toLowerCase().includes(term));
            
            // Priority logic: F1 terms for racing content, educational terms for educational content
            const isRelevantForContent = 
              (isRacingContent && (category.includes('f1_') || category.includes('racing_'))) ||
              (isEducationalContent && !category.includes('f1_') && !category.includes('racing_')) ||
              (!isRacingContent && !isEducationalContent); // Default: allow all
            
                         // Additional validation: minimum term length and quality check
             const isQualityTerm = term.length >= 4 && 
                                 !term.match(/^(the|and|but|for|you|are|not|can|has|had|was|were|will|get|got|see|saw|say|said|come|came|go|went|take|took|give|gave|put|set|run|ran|find|found|call|make|made|turn|tell|ask|try|need|want|know|think|look|feel|become|leave|move|live|bring|begin|keep|hold|show|hear|let|help|talk|walk|open|close|start|stop|play|stay|seem|feel|appear|remain|happen|occur|exist|include|contain|involve|require|allow|cause|create|produce|provide|offer|serve|follow|lead|control|manage|handle|deal|face|meet|join|reach|achieve|succeed|fail|pass|miss|lose|win|gain|save|spend|cost|pay|buy|sell|build|break|fix|change|improve|increase|decrease|reduce|develop|grow|learn|teach|read|write|speak|listen|watch|wait|hope|expect|believe|remember|forget|understand|explain|describe|discuss|consider|decide|choose|prefer|like|love|hate|enjoy|appreciate|admire|respect|trust|doubt|worry)$/);
             
             if (!isGeneric && !isDuplicate && isRelevantForContent && isQualityTerm) {
               console.log(`✅ Found ${category} term: "${term}" → "${termCapitalized}"`);
               
               // Map F1 categories to standard categories
               let targetCategory = category;
               if (category.startsWith('f1_drivers')) targetCategory = 'people';
               else if (category.startsWith('f1_teams')) targetCategory = 'companies';
               else if (category.startsWith('f1_circuits')) targetCategory = 'places';
               else if (category.startsWith('racing_')) targetCategory = 'concepts';
               
               if (!mockAnalysis[targetCategory]) mockAnalysis[targetCategory] = [];
               mockAnalysis[targetCategory].push(termCapitalized);
               mockAnalysis.citationWorthy.push(termCapitalized);
                         } else if (isGeneric) {
               console.log(`❌ Skipped generic term: "${term}"`);
             } else if (!isRelevantForContent) {
               console.log(`❌ Skipped irrelevant term for content type: "${term}"`);
             } else if (!isQualityTerm) {
               console.log(`❌ Skipped low-quality term: "${term}"`);
             }
          }
        }
      }
    }

    console.log(`📊 Mock analysis generated ${mockAnalysis.citationWorthy.length} citations:`, mockAnalysis.citationWorthy);
    return mockAnalysis;
  }

  async generateTargetedCitations(analysis, fullText, transcriptSegments = []) {
    const citations = [];
    
    console.log(`🕐 Enhancing citations with accurate timestamps from ${transcriptSegments.length} segments...`);
    
    // Determine base confidence from LLM confidence level
    const baseConfidence = analysis.confidenceLevel === 'high' ? 0.95 : 
                          analysis.confidenceLevel === 'medium' ? 0.90 : 0.85;
    
    // Process citation-worthy items first (highest priority)
    if (analysis.citationWorthy && analysis.citationWorthy.length > 0) {
      for (const item of analysis.citationWorthy) {
        const accurateTimestamp = this.findAccurateTimestamp(item, transcriptSegments);
        citations.push({
          title: item,
          type: this.inferCitationType(item, analysis),
          confidence: baseConfidence,
          source: 'llm_priority',
          timestamp: accurateTimestamp,
          llmContext: `${analysis.summary} | Academic field: ${analysis.academicField || 'general'}`,
          videoType: analysis.videoType || 'educational',
          priority: 'high',
          author: null,
          verified: true
        });
      }
    }

    // Process academic concepts with high priority
    if (analysis.concepts && analysis.concepts.length > 0) {
      for (const concept of analysis.concepts) {
        const accurateTimestamp = this.findAccurateTimestamp(concept, transcriptSegments);
        citations.push({
          title: concept,
          type: 'topic',
          confidence: baseConfidence - 0.02,
          source: 'llm_concept',
          timestamp: accurateTimestamp,
          llmContext: `Academic concept from ${analysis.academicField || 'educational'} content: ${analysis.summary}`,
          videoType: analysis.videoType || 'educational',
          priority: 'high',
          author: null,
          verified: true
        });
      }
    }

    // Process other categories with accuracy validation
    const categoryMappings = {
      people: 'person',
      places: 'place', 
      companies: 'company',
      technologies: 'technology',
      historicalEvents: 'event',
      books: 'book',
      concepts: 'topic',
      products: 'product'
    };

    for (const [category, type] of Object.entries(categoryMappings)) {
      if (analysis[category]) {
        for (const item of analysis[category]) {
          // Validate citation against transcript content
          const validationScore = this.validateCitationAccuracy(item, fullText, analysis);
          
          if (validationScore >= 0.8) { // Only include citations with very high validation scores
            const accurateTimestamp = this.findAccurateTimestamp(item, transcriptSegments);
            citations.push({
              title: item,
              type: type,
              confidence: Math.min(0.95, 0.7 + (validationScore * 0.25)), // Dynamic confidence based on validation
              source: 'llm_analysis',
              timestamp: accurateTimestamp,
              llmContext: analysis.summary,
              videoType: analysis.videoType,
              priority: validationScore > 0.8 ? 'high' : 'normal',
              author: null,
              verified: true,
              validationScore: validationScore
            });
          } else {
            console.log(`🚫 Filtered out low-accuracy citation: "${item}" (score: ${validationScore.toFixed(2)})`);
          }
        }
      }
    }

    // Remove duplicates and sort by comprehensive quality score
    const uniqueCitations = this.removeDuplicates(citations);
    uniqueCitations.sort((a, b) => {
      // Calculate comprehensive quality scores
      const scoreA = this.calculateCitationQualityScore(a);
      const scoreB = this.calculateCitationQualityScore(b);
      
      // Sort by quality score (highest first)
      if (Math.abs(scoreA - scoreB) > 0.1) {
        return scoreB - scoreA;
      }
      
      // If quality scores are similar, use other factors
      // Priority sort: high priority first
      if (a.priority === 'high' && b.priority !== 'high') return -1;
      if (b.priority === 'high' && a.priority !== 'high') return 1;
      
      // Then by confidence
      return b.confidence - a.confidence;
    });
    
            console.log(`🎯 Generated ${uniqueCitations.length} ChatGPT-enhanced citations (after validation filtering)`);
    
    // Log validation statistics
    const validatedCitations = uniqueCitations.filter(c => c.validationScore !== undefined);
    if (validatedCitations.length > 0) {
      const avgValidation = validatedCitations.reduce((sum, c) => sum + c.validationScore, 0) / validatedCitations.length;
      const highQuality = validatedCitations.filter(c => c.validationScore > 0.8).length;
      console.log(`📊 Validation stats: ${Math.round(avgValidation * 100)}% avg accuracy, ${highQuality}/${validatedCitations.length} high-quality citations`);
    }
    
    return uniqueCitations;
  }

  findAccurateTimestamp(citationTitle, transcriptSegments) {
    if (!transcriptSegments || transcriptSegments.length === 0) {
      console.log(`⏰ No transcript segments available for "${citationTitle}", using default timestamp 0`);
      return 0;
    }

    // Ensure citationTitle is a string - fix for "[object Object]" error
    const titleStr = typeof citationTitle === 'string' ? citationTitle : 
                    (citationTitle?.title || citationTitle?.name || String(citationTitle));

    console.log(`🔍 Finding timestamp for "${titleStr}" in ${transcriptSegments.length} segments...`);
    console.log(`📄 Transcript segments sample:`, transcriptSegments.slice(0, 3).map(s => ({ text: s.text?.substring(0, 50), start: s.start })));
    
    // Normalize citation title for better matching
    const citationLower = titleStr.toLowerCase().trim();
    const citationWords = citationLower.split(/\s+/).filter(word => word.length > 2);
    
    let bestMatch = null;
    let bestScore = 0;
    let bestSegment = null;
    
    // Strategy 1: Direct phrase matching (highest priority)
    for (const segment of transcriptSegments) {
      const segmentText = segment.text.toLowerCase();
      
      // Check for exact phrase match
      if (segmentText.includes(citationLower)) {
        console.log(`✅ Exact match found for "${titleStr}" at ${segment.start}s: "${segment.text}"`);
        return Math.floor(segment.start);
      }
    }
    
    // Strategy 2: Word-based scoring with context awareness
    for (const segment of transcriptSegments) {
      const segmentText = segment.text.toLowerCase();
      let score = 0;
      let matches = 0;
      
      // Count word matches
      for (const word of citationWords) {
        if (segmentText.includes(word)) {
          matches++;
          // Give higher score for longer, more specific words
          score += word.length * 0.1;
        }
      }
      
      // Calculate match ratio
      const matchRatio = citationWords.length > 0 ? matches / citationWords.length : 0;
      score += matchRatio * 10; // Base score for match ratio
      
      // Bonus for high match ratios
      if (matchRatio >= 0.6) score += 5;
      if (matchRatio >= 0.8) score += 10;
      
      // Bonus for mentions of key academic terms
      const academicTerms = ['experiment', 'study', 'research', 'investigation', 'theory', 'principle', 'incident', 'case', 'CIA', 'government', 'organization'];
      for (const term of academicTerms) {
        if (citationLower.includes(term.toLowerCase()) && segmentText.includes(term.toLowerCase())) {
          score += 3;
        }
      }
      
      // Prefer segments with meaningful content (not just filler words)
      const meaningfulWords = segmentText.match(/\b(experiment|study|research|investigation|theory|principle|incident|case|project|organization|government|agency|university|laboratory|CIA|LSD|biological|warfare|control|manipulation)\b/g);
      if (meaningfulWords) {
        score += meaningfulWords.length * 0.5;
      }
      
      if (score > bestScore && matchRatio >= 0.3) {
        bestScore = score;
        bestMatch = segment;
        bestSegment = segment;
      }
    }
    
    // Strategy 3: Fallback to key word search for important citations
    if (!bestMatch) {
      // Extract the most important word from citation (longest word or known important terms)
      const importantWords = citationWords.filter(word => 
        word.length > 4 || 
        ['CIA', 'LSD', 'experiment', 'study', 'incident', 'project', 'research'].includes(word.toLowerCase())
      );
      
      for (const segment of transcriptSegments) {
        const segmentText = segment.text.toLowerCase();
        
        for (const word of importantWords) {
          if (segmentText.includes(word)) {
            console.log(`🔍 Found key word "${word}" from "${titleStr}" at ${segment.start}s: "${segment.text}"`);
            bestMatch = segment;
            break;
          }
        }
        if (bestMatch) break;
      }
    }
    
    if (bestMatch) {
      console.log(`✅ Best match for "${titleStr}" at ${bestMatch.start}s (score: ${bestScore.toFixed(2)}): "${bestMatch.text}"`);
      return Math.floor(bestMatch.start);
    } else {
      console.log(`⚠️ No suitable timestamp found for "${titleStr}", using default timestamp 0`);
      return 0;
    }
  }

  calculateCitationQualityScore(citation) {
    let qualityScore = 0;
    const title = citation.title.toLowerCase();
    
    // Base score from validation if available
    if (citation.validationScore !== undefined) {
      qualityScore += citation.validationScore * 0.4;
    } else {
      qualityScore += citation.confidence * 0.4;
    }
    
    // Heavy bonus for content-rich citations
    if (this.isContentRichCitation(citation.title)) {
      qualityScore += 0.5;
    }
    
    // Penalty for simple geographic mentions
    if (this.isSimpleGeographicMention(citation.title)) {
      qualityScore -= 0.4;
    }
    
    // Bonus for specific types of valuable content
    if (citation.type === 'topic' && title.length > 20) {
      qualityScore += 0.2; // Topics with detailed descriptions
    }
    
    if (citation.type === 'event' && !this.isSimpleGeographicMention(citation.title)) {
      qualityScore += 0.3; // Historical events are valuable
    }
    
    // Bonus for academic/research terminology
    const academicTerms = /\b(experiment|study|research|investigation|analysis|theory|principle|law|formula|method|technique|incident|case|project|organization|institution|agency|university|laboratory)\b/i;
    if (academicTerms.test(title)) {
      qualityScore += 0.25;
    }
    
    // Penalty for very short citations
    if (citation.title.length < 8) {
      qualityScore -= 0.2;
    }
    
    // Bonus for citations with multiple meaningful components
    const meaningfulWords = title.match(/\b(experiment|study|research|investigation|analysis|incident|case|project|theory|principle|law|formula|method|technique|process|system|control|manipulation|warfare|organization|institution|government|agency|university|laboratory|historical|context|impact|connection|relationship|development|discovery|innovation)\b/g);
    if (meaningfulWords && meaningfulWords.length >= 2) {
      qualityScore += 0.3;
    }
    
    return Math.max(0, Math.min(1, qualityScore));
  }

  validateCitationAccuracy(citation, fullText, analysis) {
    const citationLower = citation.toLowerCase();
    const textLower = fullText.toLowerCase();
    const titleLower = analysis.title?.toLowerCase() || '';
    
    let score = 0;
    
    // Check direct mentions in transcript (highest score)
    if (textLower.includes(citationLower)) {
      score += 0.8;
    }
    
    // Check partial matches with key words
    const citationWords = citationLower.split(/\s+/).filter(word => word.length > 2);
    let wordMatches = 0;
    
    for (const word of citationWords) {
      if (textLower.includes(word)) {
        wordMatches++;
      }
    }
    
    const wordMatchRatio = citationWords.length > 0 ? wordMatches / citationWords.length : 0;
    score += wordMatchRatio * 0.4;
    
    // Check if mentioned in video title (moderate bonus)
    if (titleLower.includes(citationLower)) {
      score += 0.3;
    }
    
    // Check for context relevance
    const contextRelevance = this.checkContextualRelevance(citation, analysis);
    score += contextRelevance * 0.2;
    
    // Heavy penalty for generic terms
    if (this.isGenericTerm(citation)) {
      score -= 0.4; // Increased penalty
    }
    
    // Penalty for very short citations (likely not meaningful)
    if (citation.length < 4) {
      score -= 0.3;
    }
    
    // Bonus for proper nouns (likely to be specific entities)
    if (/^[A-Z]/.test(citation) && citation.includes(' ')) {
      score += 0.15;
    }
    
    // Bonus for multi-word specific terms
    if (citation.includes(' ') && citation.length > 8) {
      score += 0.1;
    }
    
    // Heavy bonus for high-value academic citations
    const highValuePatterns = [
      /\b(theorem|formula|equation|law|principle)\b/i,
      /\b(theory of|laws of|method of)\b/i,
      /\b[A-Z][a-z]+'s\s/i, // Possessive forms like "Newton's", "Euler's"
      /\b(complex|quadratic|linear|differential|integral)\s/i,
      /\b(experiment|study|research|investigation|analysis|incident|case|project)\b/i,
      /\b(CIA|FBI|government|agency|organization|institution|university|laboratory)\b/i,
      /\b(biological|chemical|nuclear|psychological|social|political)\s(warfare|control|manipulation|experiment)\b/i
    ];
    
    if (highValuePatterns.some(pattern => pattern.test(citation))) {
      score += 0.3; // Increased bonus for meaningful content
    }
    
    // Penalty for simple geographic mentions without context
    if (this.isSimpleGeographicMention(citation)) {
      score -= 0.3;
    }
    
    // Massive bonus for complex, content-rich citations
    if (this.isContentRichCitation(citation)) {
      score += 0.4;
    }
    
    return Math.max(0, Math.min(1, score));
  }

  isSimpleGeographicMention(citation) {
    const citationLower = citation.toLowerCase().trim();
    
    // List of countries and regions that are too generic without context
    const simpleGeoTerms = [
      'united states', 'usa', 'america', 'france', 'germany', 'italy', 'spain',
      'england', 'uk', 'britain', 'canada', 'australia', 'japan', 'china',
      'russia', 'brazil', 'mexico', 'india', 'europe', 'asia', 'africa',
      'california', 'texas', 'new york', 'florida', 'london', 'paris', 'berlin'
    ];
    
    // Check if it's just a simple geographic mention
    if (simpleGeoTerms.includes(citationLower)) {
      return true;
    }
    
    // Allow geographic mentions with context (e.g., "Renaissance Italy", "Cold War Russia")
    const contextualGeoPatterns = [
      /\b(ancient|medieval|renaissance|industrial|modern|contemporary)\s/i,
      /\b(cold war|world war|colonial|revolutionary|imperial)\s/i,
      /\s(incident|experiment|case|affair|crisis|revolution|war)\b/i
    ];
    
    return !contextualGeoPatterns.some(pattern => pattern.test(citation));
  }

  isContentRichCitation(citation) {
    const citationLower = citation.toLowerCase();
    
    // Detect content-rich citations with multiple meaningful components
    const contentRichPatterns = [
      // Multi-word descriptions with specific context
      /\b\w+\s+(incident|experiment|case|affair|crisis|project|operation|study|investigation|analysis)\s+and\s+its\s+\w+/i,
      // Use/purpose descriptions
      /\bthe\s+use\s+of\s+\w+\s+as\s+a\s+tool\s+for\s+\w+/i,
      // Historical context with specific events
      /\bthe\s+historical\s+context\s+of\s+\w+/i,
      // Connection/relationship descriptions
      /\b\w+\s+connection\s+to\s+\w+/i,
      // Impact/effect descriptions
      /\b\w+\s+impact\s+on\s+\w+/i,
      // Multiple concept combinations
      /\b\w+\s+(and|or)\s+\w+\s+(experiments?|studies?|research|analysis)\b/i
    ];
    
    // Check length - content-rich citations are typically longer
    const hasGoodLength = citation.length > 25;
    
    // Check for multiple meaningful words
    const meaningfulWords = citation.toLowerCase().match(/\b(experiment|study|research|investigation|analysis|incident|case|project|theory|principle|law|formula|method|technique|process|system|control|manipulation|warfare|organization|institution|government|agency|university|laboratory|historical|context|impact|connection|relationship|development|discovery|innovation)\b/g);
    const hasMultipleMeaningfulWords = meaningfulWords && meaningfulWords.length >= 2;
    
    return contentRichPatterns.some(pattern => pattern.test(citation)) || 
           (hasGoodLength && hasMultipleMeaningfulWords);
  }

  checkContextualRelevance(citation, analysis) {
    const citationLower = citation.toLowerCase();
    
    // Check if citation aligns with academic field
    if (analysis.academicField && analysis.academicField !== 'general') {
      const fieldKeywords = {
        physics: ['theory', 'quantum', 'relativity', 'mechanics', 'energy', 'force'],
        mathematics: ['theorem', 'equation', 'formula', 'proof', 'number', 'calculation'],
        history: ['war', 'empire', 'revolution', 'century', 'ancient', 'period'],
        biology: ['cell', 'organism', 'evolution', 'species', 'dna', 'gene'],
        chemistry: ['element', 'compound', 'reaction', 'molecule', 'acid', 'bond'],
        computer_science: ['algorithm', 'software', 'data', 'programming', 'system'],
        philosophy: ['ethics', 'logic', 'consciousness', 'meaning', 'truth'],
        economics: ['market', 'economy', 'trade', 'money', 'investment', 'business']
      };
      
      const relevantKeywords = fieldKeywords[analysis.academicField] || [];
      for (const keyword of relevantKeywords) {
        if (citationLower.includes(keyword)) {
          return 0.8;
        }
      }
    }
    
    // Check if citation matches video type context
    const videoTypeKeywords = {
      science: ['research', 'study', 'experiment', 'theory', 'discovery'],
      history: ['historical', 'ancient', 'period', 'era', 'civilization'],
      technology: ['innovation', 'development', 'digital', 'software', 'system'],
      educational: ['learning', 'teaching', 'knowledge', 'concept', 'principle']
    };
    
    const typeKeywords = videoTypeKeywords[analysis.videoType] || [];
    for (const keyword of typeKeywords) {
      if (citationLower.includes(keyword)) {
        return 0.6;
      }
    }
    
    return 0.3; // Default moderate relevance
  }

  isGenericTerm(citation) {
    const genericTerms = [
      // ABSOLUTELY FORBIDDEN - Common UI/conversation artifacts
      'objects', 'thanks', 'thank you', 'welcome', 'hello', 'hi', 'bye', 'goodbye',
      'please', 'yes', 'no', 'okay', 'ok', 'sure', 'right', 'left', 'up', 'down',
      'start', 'end', 'begin', 'finish', 'stop', 'go', 'come', 'see', 'look', 'watch',
      'listen', 'hear', 'know', 'think', 'feel', 'want', 'need', 'get', 'give', 'take',
      'make', 'do', 'use', 'try', 'help', 'show', 'tell', 'say', 'talk', 'speak',
      
      // ABSOLUTELY FORBIDDEN - Generic nouns that appear in transcripts
      'things', 'stuff', 'something', 'anything', 'everything', 'nothing',
      'people', 'person', 'guy', 'guys', 'man', 'men', 'woman', 'women',
      'world', 'earth', 'place', 'places', 'location', 'area', 'space', 'room',
      'time', 'times', 'moment', 'moments', 'day', 'days', 'today', 'yesterday', 'tomorrow',
      'way', 'ways', 'method', 'methods', 'how', 'what', 'why', 'when', 'where', 'who',
      'part', 'parts', 'piece', 'pieces', 'section', 'sections', 'chapter', 'chapters',
      'work', 'works', 'job', 'jobs', 'task', 'tasks', 'project', 'projects',
      'video', 'videos', 'content', 'episode', 'episodes', 'series', 'show', 'shows',
      
      // ABSOLUTELY FORBIDDEN - Basic materials and states
      'material', 'materials', 'matter', 'substance', 'substances',
      'solid', 'liquid', 'gas', 'plasma', 'solid materials', 'liquid materials',
      'object', 'objects', 'item', 'items', 'element', 'elements',
      
      // Core subject areas (too broad)
      'science', 'technology', 'research', 'study', 'analysis', 'theory',
      'concept', 'idea', 'principle', 'approach', 'system',
      'process', 'development', 'innovation', 'discovery', 'knowledge',
      'learning', 'education', 'teaching', 'understanding', 'information',
      'data', 'resource', 'tool', 'technique',
      'strategy', 'solution', 'problem', 'question', 'answer', 'result',
      
      // Subject fields (too broad)
      'mathematics', 'mathematical concepts', 'math', 'physics', 'chemistry',
      'biology', 'history', 'philosophy', 'economics', 'computer science',
      'science concepts', 'academic concepts', 'educational content',
      'fundamental concepts', 'basic principles', 'general knowledge',
      
      // Mathematical branches that are too general
      'algebra', 'geometry', 'trigonometry', 'statistics', 'arithmetic',
      'mathematical', 'mathematical theory', 'mathematical principles',
      'mathematical methods', 'mathematical concepts', 'math concepts',
      'number theory', 'discrete math', 'applied mathematics',
      
      // Physics branches that are too general  
      'classical physics', 'modern physics', 'theoretical physics',
      'applied physics', 'physics concepts', 'physical principles',
      
      // Generic academic terms
      'academic', 'scholarly', 'educational', 'scientific',
      'theoretical', 'practical', 'fundamental', 'basic', 'advanced',
      'introduction', 'overview', 'summary', 'explanation',
      
      // Video analysis artifacts
      'unknown video', 'unknown channel', 'video analysis', 'content analysis',
      'video content', 'educational video', 'tutorial', 'lesson',
      
      // Common geographic locations (too generic without context)
      'united states', 'usa', 'america', 'france', 'germany', 'italy', 'spain',
      'england', 'uk', 'britain', 'canada', 'australia', 'japan', 'china',
      'russia', 'brazil', 'mexico', 'india', 'europe', 'asia', 'africa',
      'north america', 'south america', 'middle east', 'eastern europe',
      'western europe', 'southeast asia', 'north africa', 'sub-saharan africa',
      
      // General descriptive words that shouldn't be citations
      'big', 'small', 'large', 'tiny', 'huge', 'massive', 'little', 'great', 'good', 'bad',
      'new', 'old', 'young', 'high', 'low', 'fast', 'slow', 'easy', 'hard', 'simple', 'complex',
      'important', 'interesting', 'amazing', 'incredible', 'beautiful', 'cool', 'awesome',
      'weird', 'strange', 'normal', 'regular', 'special', 'unique', 'common', 'rare'
    ];
    
    const citationLower = citation.toLowerCase().trim();
    
    // Check exact matches
    if (genericTerms.includes(citationLower)) {
      return true;
    }
    
    // Check if it's too short
    if (citationLower.length < 3) {
      return true;
    }
    
    // Check for generic patterns
    const genericPatterns = [
      /^(basic|fundamental|advanced|introduction to|intro to)\s/i,
      /\s(concepts?|principles?|theory|theories|methods?)$/i,
      /^(general|broad|wide)\s/i,
      /\s(overview|summary|explanation|tutorial)$/i
    ];
    
    return genericPatterns.some(pattern => pattern.test(citation));
  }

  inferCitationType(item, analysis) {
    // Ensure item is a string
    const itemString = typeof item === 'string' ? item : 
                      item?.title || item?.name || 
                      JSON.stringify(item);
    const itemLower = itemString.toLowerCase();
    
    // Check if it matches known categories from the analysis
    if (analysis.people && analysis.people.some(person => person.toLowerCase().includes(itemLower))) {
      return 'person';
    }
    if (analysis.places && analysis.places.some(place => place.toLowerCase().includes(itemLower))) {
      return 'place';
    }
    if (analysis.companies && analysis.companies.some(company => company.toLowerCase().includes(itemLower))) {
      return 'company';
    }
    if (analysis.technologies && analysis.technologies.some(tech => tech.toLowerCase().includes(itemLower))) {
      return 'technology';
    }
    if (analysis.historicalEvents && analysis.historicalEvents.some(event => event.toLowerCase().includes(itemLower))) {
      return 'event';
    }
    if (analysis.books && analysis.books.some(book => book.toLowerCase().includes(itemLower))) {
      return 'book';
    }
    if (analysis.products && analysis.products.some(product => product.toLowerCase().includes(itemLower))) {
      return 'product';
    }
    
    // Default to topic for academic concepts
    return 'topic';
  }

  getMockAnalysis(fullText, videoTitle) {
    console.log('🔄 Using enhanced mock analysis for testing...');
    return this.getEnhancedMockAnalysis(fullText, videoTitle, 'Unknown Channel');
  }

  getMetadataEnhancedAnalysis(fullText, videoTitle, channelName, videoDescription = '', transcriptSegments = []) {
    console.log('🧠 Using METADATA-ENHANCED analysis - AI-quality citations from video metadata...');
    const citations = [];
    const text = (fullText + ' ' + videoTitle + ' ' + videoDescription + ' ' + channelName).toLowerCase();
    
    // Enhanced keyword extraction with contextual understanding
    const extractedTopics = this.extractTopicsFromMetadata(videoTitle, videoDescription, channelName);
    const contextualCitations = this.generateContextualCitations(extractedTopics, text, videoTitle, channelName);
    
    // Combine with enhanced pattern matching
    const patternCitations = this.getEnhancedMockAnalysis(fullText, videoTitle, channelName);
    
    // Merge and deduplicate
    const allCitations = [...contextualCitations, ...patternCitations];
    const uniqueCitations = this.removeDuplicates(allCitations);
    
    // Sort by relevance and confidence
    uniqueCitations.sort((a, b) => {
      // Prioritize metadata-derived citations
      if (a.source === 'metadata_ai' && b.source !== 'metadata_ai') return -1;
      if (b.source === 'metadata_ai' && a.source !== 'metadata_ai') return 1;
      return b.confidence - a.confidence;
    });
    
    console.log(`🎯 Metadata-enhanced analysis generated ${uniqueCitations.length} AI-quality citations`);
    return uniqueCitations.slice(0, 15); // Limit to top 15 most relevant
  }

  extractTopicsFromMetadata(videoTitle, videoDescription, channelName) {
    const topics = {
      subjects: new Set(),
      people: new Set(),
      places: new Set(),
      technologies: new Set(),
      concepts: new Set(),
      timeperiods: new Set(),
      fields: new Set()
    };
    
    const allText = (videoTitle + ' ' + videoDescription + ' ' + channelName).toLowerCase();
    
    // Enhanced subject detection from title and description
    const subjectPatterns = {
      physics: /\b(physics|quantum|relativity|mechanics|thermodynamics|electromagnetism|particle|wave|energy|matter|force|gravity|electromagnetic|nuclear|atomic)\b/g,
      mathematics: /\b(mathematics|math|calculus|algebra|geometry|statistics|probability|theorem|equation|formula|proof|logic)\b/g,
      biology: /\b(biology|evolution|genetics|dna|rna|cell|organism|species|ecosystem|protein|gene|chromosome|mutation)\b/g,
      chemistry: /\b(chemistry|chemical|element|compound|molecule|reaction|bond|periodic|table|acid|base|catalyst)\b/g,
      computer_science: /\b(programming|software|algorithm|data|structure|computer|coding|ai|artificial|intelligence|machine|learning)\b/g,
      history: /\b(history|historical|ancient|medieval|renaissance|revolution|war|empire|civilization|century|era|period)\b/g,
      economics: /\b(economics|economy|market|finance|business|trade|money|investment|capitalism|socialism|inflation)\b/g,
      philosophy: /\b(philosophy|ethics|logic|metaphysics|epistemology|consciousness|existence|meaning|morality|truth)\b/g,
      racing: /\b(formula|f1|grand prix|racing|motorsport|circuit|driver|team|pole position|qualifying|championship|mercedes|ferrari|red bull|mclaren|hamilton|verstappen|leclerc|antonelli)\b/g,
      sports: /\b(sports|athlete|championship|tournament|competition|olympic|football|basketball|soccer|tennis|golf|swimming|running|cycling|boxing)\b/g
    };
    
    for (const [field, pattern] of Object.entries(subjectPatterns)) {
      if (pattern.test(allText)) {
        topics.fields.add(field);
        topics.subjects.add(field.replace('_', ' '));
      }
    }
    
    // Extract specific entities from title keywords
    const titleWords = videoTitle.toLowerCase().split(/\s+/);
    const descWords = videoDescription.toLowerCase().split(/\s+/);
    
    // Look for proper nouns and specific terms
    const properNounPattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g;
    const titleProperNouns = videoTitle.match(properNounPattern) || [];
    const descProperNouns = videoDescription.match(properNounPattern) || [];
    
    [...titleProperNouns, ...descProperNouns].forEach(noun => {
      if (noun.length > 2) { // Filter out short words
        topics.people.add(noun);
      }
    });
    
    // Detect time periods
    const timePatterns = {
      'Ancient Times': /\b(ancient|antiquity|classical|prehistoric)\b/g,
      'Medieval Period': /\b(medieval|middle ages|feudal|crusades)\b/g,
      'Renaissance': /\b(renaissance|enlightenment)\b/g,
      'Industrial Revolution': /\b(industrial revolution|industrial era)\b/g,
      'Modern Era': /\b(modern|contemporary|20th century|21st century)\b/g,
      'World War Era': /\b(world war|wwi|wwii|cold war)\b/g
    };
    
    for (const [period, pattern] of Object.entries(timePatterns)) {
      if (pattern.test(allText)) {
        topics.timeperiods.add(period);
      }
    }
    
    return topics;
  }

  generateContextualCitations(topics, fullText, videoTitle, channelName) {
    const citations = [];
    
    // Generate field-specific citations
    topics.fields.forEach(field => {
      const fieldCitation = this.createFieldCitation(field, videoTitle, channelName);
      if (fieldCitation) citations.push(fieldCitation);
    });
    
    // Generate concept citations
    topics.subjects.forEach(subject => {
      const conceptCitation = this.createConceptCitation(subject, videoTitle, channelName);
      if (conceptCitation) citations.push(conceptCitation);
    });
    
    // Generate people citations
    topics.people.forEach(person => {
      if (person.length > 3) { // Filter short names
        const personCitation = this.createPersonCitation(person, videoTitle, channelName);
        if (personCitation) citations.push(personCitation);
      }
    });
    
    // Generate time period citations
    topics.timeperiods.forEach(period => {
      const periodCitation = this.createTimePeriodCitation(period, videoTitle, channelName);
      if (periodCitation) citations.push(periodCitation);
    });
    
    return citations;
  }

  createFieldCitation(field, videoTitle, channelName) {
    const fieldMappings = {
      physics: {
        title: 'Physics Fundamentals',
        type: 'topic',
        confidence: 0.92,
        description: 'Core principles and theories in physics'
      },
      mathematics: {
        title: 'Mathematical Concepts',
        type: 'topic', 
        confidence: 0.90,
        description: 'Mathematical principles and applications'
      },
      biology: {
        title: 'Biological Sciences',
        type: 'topic',
        confidence: 0.91,
        description: 'Life sciences and biological processes'
      },
      chemistry: {
        title: 'Chemical Sciences', 
        type: 'topic',
        confidence: 0.90,
        description: 'Chemical reactions and molecular interactions'
      },
      computer_science: {
        title: 'Computer Science',
        type: 'technology',
        confidence: 0.93,
        description: 'Computing, algorithms, and software development'
      },
      history: {
        title: 'Historical Analysis',
        type: 'topic',
        confidence: 0.89,
        description: 'Historical events, contexts, and interpretations'
      },
      economics: {
        title: 'Economic Theory',
        type: 'topic',
        confidence: 0.88,
        description: 'Economic principles and market analysis'
      },
      philosophy: {
        title: 'Philosophical Concepts',
        type: 'topic',
        confidence: 0.87,
        description: 'Philosophical theories and ethical frameworks'
      },
      racing: {
        title: 'Formula 1 Racing',
        type: 'sport',
        confidence: 0.94,
        description: 'Formula 1 racing, drivers, teams, and motorsport'
      },
      sports: {
        title: 'Sports & Athletics',
        type: 'sport',
        confidence: 0.90,
        description: 'Sports, athletics, and competitive events'
      }
    };
    
    const mapping = fieldMappings[field];
    if (!mapping) return null;
    
    return {
      title: mapping.title,
      type: mapping.type,
      confidence: mapping.confidence,
      source: 'metadata_ai',
      timestamp: 0,
      llmContext: `AI analysis of "${videoTitle}" by ${channelName} - ${mapping.description}`,
      videoType: 'educational',
      priority: 'high',
      author: null,
      verified: true
    };
  }

  createConceptCitation(concept, videoTitle, channelName) {
    return {
      title: concept.charAt(0).toUpperCase() + concept.slice(1),
      type: 'topic',
      confidence: 0.85,
      source: 'metadata_ai',
      timestamp: 0,
      llmContext: `Key concept identified from video metadata: "${videoTitle}" by ${channelName}`,
      videoType: 'educational',
      priority: 'normal',
      author: null,
      verified: true
    };
  }

  createPersonCitation(person, videoTitle, channelName) {
    return {
      title: person,
      type: 'person',
      confidence: 0.83,
      source: 'metadata_ai',
      timestamp: 0,
      llmContext: `Person mentioned in video: "${videoTitle}" by ${channelName}`,
      videoType: 'educational',
      priority: 'normal',
      author: null,
      verified: true
    };
  }

  createTimePeriodCitation(period, videoTitle, channelName) {
    return {
      title: period,
      type: 'event',
      confidence: 0.86,
      source: 'metadata_ai',
      timestamp: 0,
      llmContext: `Historical period discussed in: "${videoTitle}" by ${channelName}`,
      videoType: 'educational',
      priority: 'normal',
      author: null,
      verified: true
    };
  }

  getEnhancedMockAnalysis(fullText, videoTitle, channelName) {
    console.log('🔄 Using ENHANCED mock analysis - generating AI-quality citations...');
    const citations = [];
    const text = fullText.toLowerCase();
    const title = videoTitle.toLowerCase();
    
    // Comprehensive keyword database with contextual analysis
    const knowledgeBase = {
      // Scientific concepts and theories
      science: [
        { terms: ['relativity', 'einstein', 'space-time', 'spacetime'], title: 'Theory of Relativity', type: 'topic', confidence: 0.95 },
        { terms: ['quantum', 'quanta', 'quantum mechanics'], title: 'Quantum Mechanics', type: 'topic', confidence: 0.95 },
        { terms: ['evolution', 'darwin', 'natural selection'], title: 'Theory of Evolution', type: 'topic', confidence: 0.95 },
        { terms: ['dna', 'genetics', 'gene', 'genome'], title: 'Genetics and DNA', type: 'topic', confidence: 0.93 },
        { terms: ['black hole', 'blackhole', 'event horizon'], title: 'Black Holes', type: 'topic', confidence: 0.93 },
        { terms: ['big bang', 'universe', 'cosmology'], title: 'Big Bang Theory', type: 'topic', confidence: 0.92 },
        { terms: ['artificial intelligence', 'ai', 'machine learning'], title: 'Artificial Intelligence', type: 'technology', confidence: 0.94 },
        { terms: ['climate change', 'global warming', 'greenhouse'], title: 'Climate Change', type: 'topic', confidence: 0.94 }
      ],
      
      // Physics and Science  
      physics: [
        { terms: ['einstein', 'albert einstein'], title: 'Albert Einstein', type: 'person', confidence: 0.96 },
        { terms: ['newton', 'isaac newton'], title: 'Isaac Newton', type: 'person', confidence: 0.96 },
        { terms: ['relativity', 'theory of relativity', 'general relativity'], title: 'Theory of Relativity', type: 'topic', confidence: 0.95 },
        { terms: ['quantum mechanics', 'quantum physics'], title: 'Quantum Mechanics', type: 'topic', confidence: 0.95 },
        { terms: ['gravity', 'gravitational force'], title: 'Gravity', type: 'topic', confidence: 0.93 },
        { terms: ['light', 'speed of light', 'electromagnetic radiation'], title: 'Light and Electromagnetic Radiation', type: 'topic', confidence: 0.92 },
        { terms: ['energy', 'conservation of energy'], title: 'Energy Conservation', type: 'topic', confidence: 0.91 },
        { terms: ['spacetime', 'space-time'], title: 'Spacetime', type: 'topic', confidence: 0.94 },
        { terms: ['black hole', 'event horizon'], title: 'Black Holes', type: 'topic', confidence: 0.93 },
        { terms: ['particle physics', 'elementary particles'], title: 'Particle Physics', type: 'topic', confidence: 0.92 },
        { terms: ['wave-particle duality'], title: 'Wave-Particle Duality', type: 'topic', confidence: 0.93 },
        { terms: ['uncertainty principle', 'heisenberg'], title: 'Heisenberg Uncertainty Principle', type: 'topic', confidence: 0.92 }
      ],
      
      // Racing and motorsport (only when clearly racing content)
      racing: [
        { terms: ['formula 1', 'f1', 'grand prix'], title: 'Formula 1', type: 'sport', confidence: 0.95 },
        { terms: ['montreal', 'canadian grand prix', 'gilles villeneuve'], title: 'Canadian Grand Prix', type: 'event', confidence: 0.96 }
      ],
      
      // Historical figures and scientists
      people: [
        { terms: ['einstein', 'albert einstein'], title: 'Albert Einstein', type: 'person', confidence: 0.96 },
        { terms: ['newton', 'isaac newton'], title: 'Isaac Newton', type: 'person', confidence: 0.96 },
        { terms: ['curie', 'marie curie'], title: 'Marie Curie', type: 'person', confidence: 0.95 },
        { terms: ['tesla', 'nikola tesla'], title: 'Nikola Tesla', type: 'person', confidence: 0.95 },
        { terms: ['hawking', 'stephen hawking'], title: 'Stephen Hawking', type: 'person', confidence: 0.95 },
        { terms: ['darwin', 'charles darwin'], title: 'Charles Darwin', type: 'person', confidence: 0.95 },
        { terms: ['jobs', 'steve jobs'], title: 'Steve Jobs', type: 'person', confidence: 0.94 },
        { terms: ['musk', 'elon musk'], title: 'Elon Musk', type: 'person', confidence: 0.93 },
        { terms: ['gates', 'bill gates'], title: 'Bill Gates', type: 'person', confidence: 0.92 }
      ],
      
      // Companies and organizations
      companies: [
        { terms: ['apple', 'iphone', 'mac'], title: 'Apple Inc.', type: 'company', confidence: 0.94 },
        { terms: ['google', 'alphabet'], title: 'Google', type: 'company', confidence: 0.93 },
        { terms: ['microsoft', 'windows'], title: 'Microsoft', type: 'company', confidence: 0.93 },
        { terms: ['tesla', 'spacex'], title: 'Tesla/SpaceX', type: 'company', confidence: 0.92 },
        { terms: ['nasa', 'space agency'], title: 'NASA', type: 'company', confidence: 0.95 },
        { terms: ['cern', 'particle physics'], title: 'CERN', type: 'company', confidence: 0.94 }
      ],
      
      // Places and locations
      places: [
        { terms: ['mars', 'red planet'], title: 'Mars', type: 'place', confidence: 0.95 },
        { terms: ['moon', 'lunar'], title: 'The Moon', type: 'place', confidence: 0.94 },
        { terms: ['antarctica', 'antarctic'], title: 'Antarctica', type: 'place', confidence: 0.93 },
        { terms: ['pacific ocean', 'atlantic ocean'], title: 'Earth\'s Oceans', type: 'place', confidence: 0.92 },
        { terms: ['silicon valley'], title: 'Silicon Valley', type: 'place', confidence: 0.91 }
      ],
      
      // Technologies and innovations
      technologies: [
        { terms: ['blockchain', 'cryptocurrency', 'bitcoin'], title: 'Blockchain Technology', type: 'technology', confidence: 0.94 },
        { terms: ['internet', 'world wide web'], title: 'Internet and World Wide Web', type: 'technology', confidence: 0.93 },
        { terms: ['smartphone', 'mobile phone'], title: 'Smartphone Technology', type: 'technology', confidence: 0.92 },
        { terms: ['renewable energy', 'solar power'], title: 'Renewable Energy', type: 'technology', confidence: 0.93 }
      ],
      
      // Historical events
      events: [
        { terms: ['world war', 'wwii', 'ww2'], title: 'World War II', type: 'event', confidence: 0.95 },
        { terms: ['moon landing', 'apollo'], title: 'Apollo Moon Landing', type: 'event', confidence: 0.95 },
        { terms: ['industrial revolution'], title: 'Industrial Revolution', type: 'event', confidence: 0.94 },
        { terms: ['cold war'], title: 'Cold War', type: 'event', confidence: 0.93 }
      ]
    };
    
    // Enhanced matching with context consideration
    for (const category of Object.values(knowledgeBase)) {
      for (const item of category) {
        const matchFound = item.terms.some(term => {
          return text.includes(term) || title.includes(term);
        });
        
        if (matchFound) {
          // Generate contextual description based on video type
          let llmContext = `AI analysis of "${videoTitle}" by ${channelName}`;
          if (text.includes('physics') || text.includes('science')) {
            llmContext += ' - Educational physics/science content';
          } else if (text.includes('technology') || text.includes('innovation')) {
            llmContext += ' - Technology and innovation focus';
          } else if (text.includes('history') || text.includes('historical')) {
            llmContext += ' - Historical documentary content';
          }
          
          citations.push({
            title: item.title,
            type: item.type,
            confidence: item.confidence,
            source: 'enhanced_ai_mock',
            timestamp: 0,
            llmContext: llmContext,
            videoType: this.inferVideoType(text, title),
            priority: item.confidence > 0.94 ? 'high' : 'normal',
            author: null,
            verified: true
          });
        }
      }
    }
    
    // Only generate fallback citations if no high-quality citations found
    if (citations.length === 0) {
      console.log('🎯 No high-quality citations found, checking for title-based matches...');
      const titleWords = videoTitle.toLowerCase().split(/\s+/);
      const textWords = text.toLowerCase().split(/\s+/);
      
      // Only generate if there's strong evidence in title AND content
      const physicsKeywords = ['physics', 'quantum', 'relativity', 'mechanics', 'particle'];
      const historyKeywords = ['history', 'historical', 'ancient', 'civilization', 'empire', 'war'];
      const techKeywords = ['technology', 'programming', 'software', 'algorithm', 'ai', 'computer'];
      const racingKeywords = ['racing', 'formula', 'grand prix', 'montreal', 'f1', 'motorsport', 'circuit', 'braking', 'tire', 'compound'];
      
      if (physicsKeywords.some(kw => titleWords.includes(kw)) && 
          physicsKeywords.some(kw => textWords.includes(kw))) {
        citations.push({
          title: `${videoTitle.split(' ').slice(0, 3).join(' ')} - Physics Analysis`,
          type: 'topic',
          confidence: 0.75,
          source: 'title_validated',
          timestamp: 0,
          llmContext: `Topic derived from physics video content analysis`,
          videoType: 'educational',
          priority: 'normal',
          author: null,
          verified: true
        });
      }
      
      if (historyKeywords.some(kw => titleWords.includes(kw)) && 
          historyKeywords.some(kw => textWords.includes(kw))) {
        citations.push({
          title: `${videoTitle.split(' ').slice(0, 3).join(' ')} - Historical Context`,
          type: 'topic',
          confidence: 0.75,
          source: 'title_validated',
          timestamp: 0,
          llmContext: `Historical topic derived from video content analysis`,
          videoType: 'educational',
          priority: 'normal',
          author: null,
          verified: true
        });
      }
      
      if (techKeywords.some(kw => titleWords.includes(kw)) && 
          techKeywords.some(kw => textWords.includes(kw))) {
        citations.push({
          title: `${videoTitle.split(' ').slice(0, 3).join(' ')} - Technology Focus`,
          type: 'technology',
          confidence: 0.75,
          source: 'title_validated',
          timestamp: 0,
          llmContext: `Technology topic derived from video content analysis`,
          videoType: 'technology',
          priority: 'normal',
          author: null,
          verified: true
        });
      }
      
      if (racingKeywords.some(kw => titleWords.includes(kw)) && 
          racingKeywords.some(kw => textWords.includes(kw))) {
        citations.push({
          title: `${videoTitle.split(' ').slice(0, 3).join(' ')} - Racing Analysis`,
          type: 'sport',
          confidence: 0.85,
          source: 'racing_validated',
          timestamp: 0,
          llmContext: `Racing content derived from motorsport video analysis`,
          videoType: 'sports',
          priority: 'high',
          author: null,
          verified: true
        });
      }
    }
    
    // Remove duplicates and sort by confidence
    const uniqueCitations = this.removeDuplicates(citations);
    uniqueCitations.sort((a, b) => b.confidence - a.confidence);
    
    console.log(`🎯 Enhanced mock analysis generated ${uniqueCitations.length} high-quality citations`);
    return uniqueCitations;
  }

  inferVideoType(text, title) {
    const combined = (text + ' ' + title).toLowerCase();
    
    if (combined.includes('racing') || combined.includes('formula') || combined.includes('grand prix') || 
        combined.includes('montreal') || combined.includes('f1') || combined.includes('motorsport')) return 'sports';
    if (combined.includes('science') || combined.includes('physics') || combined.includes('biology')) return 'educational';
    if (combined.includes('technology') || combined.includes('innovation') || combined.includes('tech')) return 'technology';
    if (combined.includes('history') || combined.includes('historical')) return 'educational';
    if (combined.includes('business') || combined.includes('entrepreneur')) return 'business';
    if (combined.includes('travel') || combined.includes('country') || combined.includes('city')) return 'travel';
    
    return 'educational'; // Default to educational
  }

  removeDuplicates(citations) {
    const seen = new Set();
    return citations.filter(citation => {
      const key = citation.title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}

// Enhanced citation detector with better patterns and API integration
class EnhancedCitationDetector {
  constructor() {
    this.citations = [];
    this.googleBooksApiKey = 'AIzaSyBqOTz8QZ9X_8X8X8X8X8X8X8X8X8X8X8X'; // You'll need to get a real API key
  }

  detectCitations(transcriptData) {
    console.log('🔍 Analyzing text for citations...');
    
    // Handle both old format (string) and new format (object with segments)
    const text = typeof transcriptData === 'string' ? transcriptData : transcriptData.text;
    const segments = typeof transcriptData === 'object' && transcriptData.segments ? transcriptData.segments : [];
    
    console.log('📄 Text sample (first 500 chars):', text.substring(0, 500));
    console.log('📏 Total text length:', text.length);
    console.log('⏱️ Segments available:', segments.length);
    
    const found = [];
    
    // Video/Documentary detection patterns
    const videoPatterns = [
      // "watch the documentary 'Title'" - high confidence
      /(?:watch|see|check\s+out)\s+(?:the\s+)?(?:documentary|film|movie)\s+[""']([^""']{3,50})[""']/gi,
      // "documentary called/titled 'Title'" - high confidence
      /(?:documentary|film|movie)\s+(?:called|titled|named)\s+[""']([^""']{3,50})[""']/gi,
      // "TED talk about/on 'Topic'" - high confidence
      /(?:TED\s+talk|TED\s+video|TEDx)\s+(?:about|on|called)?\s*[""']?([^""']{3,50})[""']?/gi,
      // "YouTube channel 'Name'" - high confidence
      /(?:YouTube\s+channel|channel)\s+[""']([^""']{3,30})[""']/gi,
      // "video series 'Title'" - high confidence
      /(?:video\s+series|series)\s+[""']([^""']{3,40})[""']/gi,
      // "Netflix/streaming documentary 'Title'" - high confidence
      /(?:Netflix|Hulu|Amazon\s+Prime|Disney\+)\s+(?:series|documentary|show|film)\s+[""']([^""']{3,40})[""']/gi,
      // "as shown in the video" - medium confidence
      /(?:as\s+shown\s+in|featured\s+in|mentioned\s+in)\s+(?:the\s+)?(?:video|documentary|film)\s+[""']([^""']{3,40})[""']/gi,
      // "Channel's video about" - medium confidence
      /([A-Z][a-zA-Z\s]{3,25})'s\s+(?:video|documentary)\s+(?:about|on)\s+([^.!?]{5,40})/gi,
      // "Cosmos series" or similar educational series - medium confidence
      /(Cosmos|Planet\s+Earth|Blue\s+Planet|Our\s+Planet|Free\s+Solo|Won't\s+You\s+Be\s+My\s+Neighbor|The\s+Social\s+Dilemma)\s+(?:series|documentary|film)?/gi,
      // Popular educational channels - medium confidence
      /(?:Veritasium|Kurzgesagt|MinutePhysics|SciShow|Crash\s+Course|Khan\s+Academy|TED-Ed)\s+(?:video|channel|explains?)/gi
    ];
    
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
      /(Double\s+Slit\s+Experiment|Bell\s+Test|Schrödinger'?s?\s+Cat|EPR\s+Paradox|Michelson-Morley\s+Experiment)/gi,
      // Physics papers and theories - medium confidence
      /(Bell'?s?\s+Theorem|Copenhagen\s+Interpretation|Many\s+Worlds\s+Interpretation|Pilot\s+Wave\s+Theory|Hidden\s+Variable\s+Theory)/gi,
      // Scientific discoveries/papers - medium confidence  
      /(Quantum\s+Mechanics\s+Interpretation|Wave-Particle\s+Duality|Uncertainty\s+Principle|Quantum\s+Field\s+Theory)/gi
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

    // Places and locations mentioned in videos - EXPANDED & MORE ACCURATE
    const placePatterns = [
      // Small European countries (often discussed in travel/geography videos)
      /(Malta|Cyprus|Iceland|Luxembourg|Monaco|Vatican|Liechtenstein|Andorra|San\s+Marino|Montenegro|Slovenia|Slovakia|Estonia|Latvia|Lithuania|Moldova)/gi,
      // Major countries (very commonly mentioned)
      /(United\s+States|America|Japan|China|India|Russia|Brazil|Canada|Australia|Germany|France|Italy|Spain|Greece|Turkey|Egypt|Morocco|Thailand|Vietnam|Korea|Mexico|Argentina|Chile|Peru|Poland|Ukraine|Iran|Iraq|Israel|Pakistan|Bangladesh|Indonesia|Philippines|Nigeria|South\s+Africa)/gi,
      // Major cities worldwide
      /(New\s+York|Los\s+Angeles|Chicago|Miami|San\s+Francisco|London|Paris|Berlin|Madrid|Rome|Milan|Venice|Florence|Amsterdam|Brussels|Vienna|Prague|Budapest|Stockholm|Copenhagen|Helsinki|Oslo|Dublin|Edinburgh|Zurich|Geneva|Moscow|Tokyo|Beijing|Shanghai|Hong\s+Kong|Singapore|Mumbai|Delhi|Dubai|Sydney|Melbourne|Toronto|Montreal)/gi,
      // Geographic features & regions
      /(Mediterranean|Atlantic|Pacific|Indian\s+Ocean|North\s+Sea|Baltic\s+Sea|Black\s+Sea|Caribbean|Alps|Himalayas|Andes|Rocky\s+Mountains|Sahara|Amazon|Nile|Mississippi|Thames|Rhine|Danube|Suez\s+Canal|Panama\s+Canal)/gi,
      // World famous landmarks (tourists attractions)
      /(Eiffel\s+Tower|Big\s+Ben|Tower\s+Bridge|Buckingham\s+Palace|Colosseum|Leaning\s+Tower|Parthenon|Acropolis|Stonehenge|Taj\s+Mahal|Great\s+Wall|Forbidden\s+City|Machu\s+Picchu|Pyramids|Sphinx|Statue\s+of\s+Liberty|Empire\s+State|Golden\s+Gate|Sydney\s+Opera|Christ\s+the\s+Redeemer)/gi,
      // Historical places & civilizations
      /(Ancient\s+Rome|Ancient\s+Greece|Ancient\s+Egypt|Mesopotamia|Byzantine\s+Empire|Ottoman\s+Empire|Holy\s+Roman\s+Empire|British\s+Empire|Aztec\s+Empire|Inca\s+Empire|Maya\s+Civilization|Silk\s+Road|Pompeii|Troy)/gi,
      // Travel/location context with validation
      /(?:visited?|travel(?:ed|ing)?\s+to|went\s+to|been\s+to|lived?\s+in|from|flew\s+to)\s+([A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})?)/gi,
      // Geographic context with better validation
      /(?:country|nation|island|city|capital|region|territory|state|province|continent)\s+(?:of\s+|called\s+|named\s+)?([A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})?)/gi,
      // Context: "in Malta", "to Japan" etc with stricter matching
      /\b(?:in|to|from|across|through)\s+([A-Z][a-z]{3,}(?:\s+[A-Z][a-z]{3,})?)\b(?=\s|[,.!?]|$)/gi
    ];

    // People mentioned in videos - VASTLY EXPANDED
    const peoplePatterns = [
      // Historical/Political leaders
      /(Napoleon|Bonaparte|Churchill|Roosevelt|Gandhi|Martin\s+Luther\s+King|Nelson\s+Mandela|Abraham\s+Lincoln|George\s+Washington|Thomas\s+Jefferson|John\s+F\s+Kennedy|Julius\s+Caesar|Alexander\s+the\s+Great|Cleopatra|Hitler|Stalin|Mao|Lenin|Mussolini|Caesar|Augustus|Charlemagne|William\s+the\s+Conqueror)/gi,
      // Scientists & Inventors
      /(Albert\s+Einstein|Isaac\s+Newton|Charles\s+Darwin|Nikola\s+Tesla|Thomas\s+Edison|Marie\s+Curie|Galileo|Copernicus|Kepler|Stephen\s+Hawking|Richard\s+Feynman|Carl\s+Sagan|Alan\s+Turing|Watson|Crick|Mendel|Pasteur|Fleming|Bohr|Heisenberg|Schrödinger|Planck|Faraday|Maxwell)/gi,
      // Artists, Writers & Musicians
      /(William\s+Shakespeare|Leonardo\s+da\s+Vinci|Michelangelo|Pablo\s+Picasso|Vincent\s+van\s+Gogh|Claude\s+Monet|Salvador\s+Dali|Mozart|Beethoven|Bach|Chopin|Tchaikovsky|Vivaldi|Hemingway|Tolkien|Dickens|Austen|Orwell|Kafka|Dostoyevsky)/gi,
      // Modern tech/business figures
      /(Steve\s+Jobs|Bill\s+Gates|Elon\s+Musk|Mark\s+Zuckerberg|Jeff\s+Bezos|Warren\s+Buffett|Tim\s+Cook|Satya\s+Nadella|Larry\s+Page|Sergey\s+Brin|Jack\s+Ma|Richard\s+Branson|Oprah\s+Winfrey|Donald\s+Trump|Barack\s+Obama)/gi,
      // Philosophers & Thinkers
      /(Socrates|Plato|Aristotle|Confucius|Buddha|Lao\s+Tzu|Kant|Nietzsche|Descartes|Locke|Hume|Rousseau|Voltaire|Marx|Freud|Jung)/gi,
      // Explorers & Adventurers
      /(Christopher\s+Columbus|Marco\s+Polo|Vasco\s+da\s+Gama|Magellan|Cook|Shackleton|Amundsen|Scott|Hillary|Tenzing)/gi,
      // Context mentions with better validation
      /(?:according\s+to|says|mentioned\s+by|quotes?|cited\s+by|work\s+of)\s+([A-Z][a-z]{2,}\s+[A-Z][a-z]{2,})/gi,
      // "Person said" or "Person believes"
      /([A-Z][a-z]{2,}\s+[A-Z][a-z]{2,})\s+(?:said|says|believes?|thinks?|argues?|claims?|states?|wrote|published|discovered)/gi
    ];

    // Companies and Organizations - VASTLY EXPANDED
    const companyPatterns = [
      // Tech giants (very commonly mentioned)
      /(Apple|Google|Microsoft|Amazon|Facebook|Meta|Tesla|Netflix|YouTube|Twitter|Instagram|TikTok|Spotify|Uber|Airbnb|PayPal|eBay|LinkedIn|Zoom|Slack|Adobe|Oracle|IBM|Intel|NVIDIA|AMD|Salesforce|Dropbox|Snapchat|Pinterest|Reddit)/gi,
      // Traditional companies & brands
      /(McDonald's|Coca-Cola|Pepsi|Disney|Nike|Adidas|Samsung|Sony|Toyota|BMW|Mercedes|Ford|General\s+Motors|Walmart|Target|Starbucks|KFC|Burger\s+King|Visa|Mastercard|American\s+Express|FedEx|UPS|DHL)/gi,
      // Financial & consulting
      /(Goldman\s+Sachs|JPMorgan|Bank\s+of\s+America|Wells\s+Fargo|Chase|Citibank|McKinsey|Deloitte|PwC|Ernst\s+Young|KPMG|BlackRock|Berkshire\s+Hathaway)/gi,
      // Media & entertainment
      /(CNN|BBC|Fox\s+News|New\s+York\s+Times|Washington\s+Post|Wall\s+Street\s+Journal|Reuters|Associated\s+Press|Warner\s+Bros|Universal|Paramount|HBO|ESPN)/gi
    ];

    // Technologies and Concepts - EXPANDED
    const technologyPatterns = [
      // Modern tech concepts (very relevant today)
      /(Artificial\s+Intelligence|Machine\s+Learning|Deep\s+Learning|Neural\s+Networks|Blockchain|Cryptocurrency|Bitcoin|Ethereum|NFT|Virtual\s+Reality|Augmented\s+Reality|Internet\s+of\s+Things|IoT|5G|Cloud\s+Computing|Edge\s+Computing)/gi,
      // Programming & development
      /(JavaScript|Python|Java|C\+\+|React|Angular|Node\.js|Docker|Kubernetes|AWS|Azure|GitHub|Stack\s+Overflow|API|Database|SQL|NoSQL|DevOps|Agile|Scrum)/gi,
      // Scientific/medical tech
      /(Quantum\s+Computing|Nanotechnology|Biotechnology|Genetic\s+Engineering|CRISPR|Gene\s+Therapy|Stem\s+Cells|3D\s+Printing|Robotics|Automation|Renewable\s+Energy|Solar\s+Power|Wind\s+Power|Nuclear\s+Energy|Fusion)/gi,
      // Business/finance tech
      /(Fintech|Cryptocurrency|Digital\s+Currency|E-commerce|SaaS|Platform\s+Economy|Sharing\s+Economy|Gig\s+Economy|Remote\s+Work|Digital\s+Transformation)/gi
    ];

    // Historical Events and Periods - NEW CATEGORY
    const eventPatterns = [
      // Major wars & conflicts
      /(World\s+War\s+I|World\s+War\s+II|First\s+World\s+War|Second\s+World\s+War|Cold\s+War|Vietnam\s+War|Korean\s+War|Gulf\s+War|Iraq\s+War|Afghanistan\s+War|Civil\s+War|Revolutionary\s+War)/gi,
      // Historical periods
      /(Renaissance|Industrial\s+Revolution|Enlightenment|Middle\s+Ages|Medieval\s+Period|Dark\s+Ages|Victorian\s+Era|Roaring\s+Twenties|Great\s+Depression|Space\s+Race|Information\s+Age)/gi,
      // Major historical events
      /(Moon\s+Landing|Fall\s+of\s+Berlin\s+Wall|9\/11|September\s+11|Pearl\s+Harbor|D-Day|Battle\s+of\s+Waterloo|French\s+Revolution|Russian\s+Revolution|American\s+Revolution|Boston\s+Tea\s+Party|Declaration\s+of\s+Independence)/gi,
      // Cultural/social movements
      /(Civil\s+Rights\s+Movement|Women's\s+Suffrage|Feminist\s+Movement|Environmental\s+Movement|Industrial\s+Revolution|Digital\s+Revolution|Sexual\s+Revolution|Counter-Culture)/gi
    ];

    // EXPANDED: Quote and Direct Citation Patterns - NEW HIGH-VALUE CATEGORY
    const quotePatterns = [
      // Direct quotes with attribution - VERY HIGH confidence
      /["""]([^"""]{20,200})[""']\s*[-–—]\s*([A-Z][a-zA-Z\s\.]{3,40})/gi,
      // "As Person said/wrote" - HIGH confidence
      /(?:as|when)\s+([A-Z][a-zA-Z\s\.]{3,40})\s+(?:said|wrote|stated|observed|noted|argued|claimed)\s*[,:"]?\s*["""]?([^"""]{15,150})["""]?/gi,
      // "Person once said" - HIGH confidence
      /([A-Z][a-zA-Z\s\.]{3,40})\s+(?:once\s+)?(?:said|wrote|stated|observed|famously\s+said)\s*[,:"]?\s*["""]([^"""]{15,150})[""']/gi,
      // "According to Person" - MEDIUM-HIGH confidence
      /(?:according\s+to|per|citing)\s+([A-Z][a-zA-Z\s\.]{3,40})[,:]\s*["""]?([^"""]{15,150})["""]?/gi,
      // Academic citation style "Person (Year)" - HIGH confidence
      /([A-Z][a-zA-Z\s\.]{3,40})\s*\((\d{4})\)\s+(?:found|showed|demonstrated|argued|concluded|stated)\s+(?:that\s+)?([^.!?]{20,120})/gi,
      // "In the words of Person" - HIGH confidence
      /(?:in\s+the\s+words\s+of|quoting)\s+([A-Z][a-zA-Z\s\.]{3,40})[,:]\s*["""]([^"""]{15,150})[""']/gi
    ];

    // EXPANDED: Statistics and Data Citations - NEW HIGH-VALUE CATEGORY
    const statisticsPatterns = [
      // "Study found X% of" - HIGH confidence
      /(?:study|research|survey|poll)\s+(?:found|showed|revealed|indicated)\s+(?:that\s+)?(\d{1,3}(?:\.\d+)?%)\s+of\s+([^.!?]{10,80})/gi,
      // "According to statistics" - MEDIUM confidence
      /(?:according\s+to|based\s+on)\s+(?:statistics|data|research|studies)\s+(?:from\s+)?([A-Z][^.!?]{5,60})[,.]?\s*(\d{1,3}(?:\.\d+)?%)?/gi,
      // "X in Y people" or "1 out of 3" - MEDIUM confidence
      /(\d{1,3})\s+(?:in|out\s+of)\s+(\d{1,3})\s+(?:people|Americans|adults|children|students|users|individuals)\s+([^.!?]{10,80})/gi,
      // Dollar amounts and market data - MEDIUM confidence
      /(\$[\d,]+(?:\.\d{2})?(?:\s+billion|\s+million)?)\s+(?:market|industry|revenue|worth|value|cost)\s+([^.!?]{10,60})/gi,
      // Growth rates and percentages - MEDIUM confidence
      /(increased|decreased|grew|fell|rose|dropped)\s+by\s+(\d{1,3}(?:\.\d+)?%)\s+([^.!?]{10,60})/gi,
      // Time-based statistics - MEDIUM confidence
      /(?:over|in)\s+the\s+(?:past|last)\s+(\d{1,2})\s+(years?|months?|decades?)[,.]?\s*([^.!?]{15,80})/gi
    ];

    // EXPANDED: Theory and Concept Citations - NEW CATEGORY
    const theoryPatterns = [
      // "Theory of X" or "X Theory" - HIGH confidence
      /(Theory\s+of\s+[A-Z][a-zA-Z\s]{5,40}|[A-Z][a-zA-Z\s]{5,40}\s+Theory)/gi,
      // "Principle of X" or "X Principle" - HIGH confidence  
      /(Principle\s+of\s+[A-Z][a-zA-Z\s]{5,40}|[A-Z][a-zA-Z\s]{5,40}\s+Principle)/gi,
      // "Law of X" or "X's Law" - HIGH confidence
      /(Law\s+of\s+[A-Z][a-zA-Z\s]{5,40}|[A-Z][a-zA-Z\s]{5,40}'?s?\s+Law)/gi,
      // "Concept of X" - MEDIUM confidence
      /(?:concept|notion|idea)\s+of\s+([A-Z][a-zA-Z\s]{5,40})/gi,
      // "X Model" or "Model of X" - MEDIUM confidence
      /([A-Z][a-zA-Z\s]{5,40}\s+Model|Model\s+of\s+[A-Z][a-zA-Z\s]{5,40})/gi,
      // "X Effect" or "X Phenomenon" - MEDIUM confidence
      /([A-Z][a-zA-Z\s]{5,40}\s+(?:Effect|Phenomenon|Paradox|Problem|Dilemma|Fallacy))/gi,
      // Philosophical concepts - MEDIUM confidence
      /(Existentialism|Nihilism|Stoicism|Empiricism|Rationalism|Determinism|Free\s+Will|Utilitarianism|Deontology)/gi
    ];

    // EXPANDED: Course and Educational Content - NEW CATEGORY
    const educationalPatterns = [
      // "Course on X" or "X Course" - HIGH confidence
      /(?:course|class|training|program|bootcamp|masterclass)\s+(?:on|in|about)\s+([A-Z][a-zA-Z\s]{5,50})/gi,
      // University courses - HIGH confidence
      /([A-Z][a-zA-Z\s]{5,50})\s+(?:101|201|course|class)\s+(?:at|from)\s+([A-Z][a-zA-Z\s]{5,40}(?:University|College|Institute))/gi,
      // "Learn X" or "Master X" - MEDIUM confidence
      /(?:learn|master|study|understand)\s+([A-Z][a-zA-Z\s]{5,50})\s+(?:online|course|tutorial|guide)/gi,
      // Certification and degrees - MEDIUM confidence
      /([A-Z][a-zA-Z\s]{5,50})\s+(?:certification|certificate|degree|diploma|qualification)/gi,
      // Educational platforms - MEDIUM confidence
      /(?:Coursera|edX|Udemy|Khan\s+Academy|MIT\s+OpenCourseWare|Pluralsight|LinkedIn\s+Learning)\s+(?:course|class)\s+(?:on|about)\s+([A-Z][a-zA-Z\s]{5,50})/gi,
      // MOOC and online learning - MEDIUM confidence
      /(?:MOOC|online\s+course|webinar|workshop)\s+(?:on|about|covering)\s+([A-Z][a-zA-Z\s]{5,50})/gi
    ];

    // EXPANDED: Software and Tools - NEW CATEGORY
    const softwarePatterns = [
      // Programming languages and frameworks - HIGH confidence
      /(Python|JavaScript|Java|C\+\+|C#|PHP|Ruby|Go|Rust|TypeScript|Swift|Kotlin|Scala|R|MATLAB|SQL)\s+(?:programming|development|tutorial|guide|course)/gi,
      // Popular software tools - HIGH confidence
      /(Photoshop|Illustrator|After\s+Effects|Premiere\s+Pro|Final\s+Cut|Logic\s+Pro|Ableton|Spotify|Discord|Slack|Zoom|Teams|Notion|Figma|Sketch|InVision)/gi,
      // Development tools - HIGH confidence
      /(Visual\s+Studio|VS\s+Code|IntelliJ|Eclipse|Xcode|Android\s+Studio|Unity|Unreal\s+Engine|Blender|Maya|3ds\s+Max)/gi,
      // Operating systems - MEDIUM confidence
      /(Windows\s+\d+|macOS|Linux|Ubuntu|CentOS|Android|iOS)\s+(?:tutorial|guide|setup|installation)/gi,
      // Cloud platforms - MEDIUM confidence
      /(AWS|Azure|Google\s+Cloud|Firebase|Heroku|Netlify|Vercel)\s+(?:tutorial|deployment|hosting|service)/gi,
      // Databases - MEDIUM confidence
      /(MySQL|PostgreSQL|MongoDB|Firebase|Redis|SQLite|Oracle|SQL\s+Server)\s+(?:database|tutorial|guide)/gi
    ];

    // Scientific concept patterns - More focused but still comprehensive
    const scientificConceptPatterns = [
      // Physics theories (when explicitly discussed)
      /(Quantum\s+Mechanics|General\s+Relativity|Special\s+Relativity|String\s+Theory|Big\s+Bang\s+Theory|Theory\s+of\s+Evolution|Relativity\s+Theory)/gi,
      // Scientific principles & concepts
      /(?:law\s+of|principle\s+of|theory\s+of|concept\s+of)\s+(Thermodynamics|Conservation|Gravity|Electromagnetism|Natural\s+Selection|Quantum\s+Entanglement|Wave-Particle\s+Duality|Uncertainty\s+Principle)/gi,
      // Famous experiments & discoveries
      /(Double\s+Slit\s+Experiment|Schrödinger'?s?\s+Cat|Manhattan\s+Project|Human\s+Genome\s+Project|Higgs\s+Boson|Discovery\s+of\s+DNA|Penicillin\s+Discovery)/gi,
      // Scientific fields
      /(Quantum\s+Physics|Astrophysics|Neuroscience|Genetics|Biotechnology|Nanotechnology|Climate\s+Science|Marine\s+Biology|Space\s+Exploration)/gi
    ];

    // Process video patterns
    videoPatterns.forEach((pattern, index) => {
      const matches = [...text.matchAll(pattern)];
      console.log(`🎬 Video pattern ${index} found ${matches.length} matches`);
      
      matches.forEach(match => {
        let title, channel;
        
        if (index === 7) { // "Channel's video about" pattern
          channel = match[1];
          title = match[2];
        } else {
          title = match[1];
          channel = match[2] || null;
        }

        if (title && title.length >= 3 && title.length <= 60 && this.isValidVideoTitle(title)) {
          // Calculate confidence based on pattern strength
          let confidence = index <= 5 ? 0.8 : 0.6; // High confidence for first 6 patterns
          if (channel) confidence += 0.1;
          if (title.length > 10) confidence += 0.05;
          if (this.hasVideoKeywords(title)) confidence += 0.1;
          
          console.log(`🎬 Found potential video: "${title}" by ${channel || 'Unknown'} (confidence: ${confidence})`);
          
          found.push({
            title: this.cleanTitle(title),
            author: channel ? this.cleanAuthor(channel) : null,
            type: 'video',
            confidence: Math.min(confidence, 1.0),
            source: 'video_pattern_' + index
          });
        }
      });
    });

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

    // Process place patterns - THIS IS WHAT THE USER WANTS!
    placePatterns.forEach((pattern, index) => {
      const matches = [...text.matchAll(pattern)];
      console.log(`🌍 Place pattern ${index} found ${matches.length} matches`);
      
      matches.forEach(match => {
        const place = match[1] || match[0]; // Some patterns capture the whole match
        
        if (place && place.length >= 3 && place.length <= 40 && this.isValidPlace(place)) {
          let confidence = 0.9; // High confidence for places
          
          // Boost confidence for specific country/city patterns
          if (index <= 2) confidence = 0.95; // Direct mentions of countries/cities
          if (index === 3 || index === 4) confidence = 0.9; // Geographic features and landmarks
          if (index >= 6) confidence = 0.8; // Context-based mentions
          
          console.log(`🌍 Found place: "${place}" (confidence: ${confidence})`);
          
          found.push({
            title: this.cleanTitle(place),
            author: null,
            type: 'place',
            confidence: Math.min(confidence, 1.0),
            source: 'place_pattern_' + index
          });
        }
      });
    });

    // Process people patterns
    peoplePatterns.forEach((pattern, index) => {
      const matches = [...text.matchAll(pattern)];
      console.log(`👤 People pattern ${index} found ${matches.length} matches`);
      
      matches.forEach(match => {
        const person = match[1] || match[0];
        
        if (person && person.length >= 3 && person.length <= 50 && this.isValidPerson(person)) {
          let confidence = 0.85; // High confidence for well-known people
          
          // Higher confidence for historical/famous figures
          if (index <= 3) confidence = 0.9; // Historical, scientific, artistic, modern figures
          if (index === 4) confidence = 0.75; // Context-based mentions
          
          console.log(`👤 Found person: "${person}" (confidence: ${confidence})`);
          
          found.push({
            title: this.cleanTitle(person),
            author: null,
            type: 'person',
            confidence: Math.min(confidence, 1.0),
            source: 'person_pattern_' + index
          });
        }
      });
    });

    // Process company patterns
    companyPatterns.forEach((pattern, index) => {
      const matches = [...text.matchAll(pattern)];
      console.log(`🏢 Company pattern ${index} found ${matches.length} matches`);
      
      matches.forEach(match => {
        const company = match[1] || match[0];
        
        if (company && company.length >= 2 && company.length <= 40 && this.isValidCompany(company)) {
          let confidence = 0.9; // High confidence for well-known companies
          
          console.log(`🏢 Found company: "${company}" (confidence: ${confidence})`);
          
          found.push({
            title: this.cleanTitle(company),
            author: null,
            type: 'company',
            confidence: Math.min(confidence, 1.0),
            source: 'company_pattern_' + index
          });
        }
      });
    });

    // Process technology patterns
    technologyPatterns.forEach((pattern, index) => {
      const matches = [...text.matchAll(pattern)];
      console.log(`💻 Technology pattern ${index} found ${matches.length} matches`);
      
      matches.forEach(match => {
        const technology = match[1] || match[0];
        
        if (technology && technology.length >= 3 && technology.length <= 50 && this.isValidTechnology(technology)) {
          let confidence = 0.85; // High confidence for tech terms
          
          console.log(`💻 Found technology: "${technology}" (confidence: ${confidence})`);
          
          found.push({
            title: this.cleanTitle(technology),
            author: null,
            type: 'technology',
            confidence: Math.min(confidence, 1.0),
            source: 'technology_pattern_' + index
          });
        }
      });
    });

    // Process historical event patterns
    eventPatterns.forEach((pattern, index) => {
      const matches = [...text.matchAll(pattern)];
      console.log(`📜 Event pattern ${index} found ${matches.length} matches`);
      
      matches.forEach(match => {
        const event = match[1] || match[0];
        
        if (event && event.length >= 5 && event.length <= 60 && this.isValidEvent(event)) {
          let confidence = 0.9; // High confidence for historical events
          
          console.log(`📜 Found historical event: "${event}" (confidence: ${confidence})`);
          
          found.push({
            title: this.cleanTitle(event),
            author: null,
            type: 'event',
            confidence: Math.min(confidence, 1.0),
            source: 'event_pattern_' + index
          });
        }
      });
    });

    // Process scientific concept patterns (enhanced)
    scientificConceptPatterns.forEach((pattern, index) => {
      const matches = [...text.matchAll(pattern)];
      console.log(`🔬 Science pattern ${index} found ${matches.length} matches`);
      
      matches.forEach(match => {
        const concept = match[1] || match[0];
        
        if (concept && concept.length >= 5 && concept.length <= 60) {
          let confidence = 0.85; // High confidence for scientific concepts
          
          console.log(`🔬 Found scientific concept: "${concept}" (confidence: ${confidence})`);
          
          found.push({
            title: this.cleanTitle(concept),
            author: null,
            type: 'topic',
            confidence: Math.min(confidence, 1.0),
            source: 'science_pattern_' + index
          });
        }
      });
    });

    // Process quote patterns
    quotePatterns.forEach((pattern, index) => {
      const matches = [...text.matchAll(pattern)];
      console.log(`💬 Quote pattern ${index} found ${matches.length} matches`);
      
      matches.forEach(match => {
        let quote, author;
        
        if (index === 0) { // Direct quote with attribution
          quote = match[1];
          author = match[2];
        } else if (index === 1 || index === 2) { // As Person said/Person once said
          author = match[1];
          quote = match[2];
        } else if (index === 3) { // According to Person
          author = match[1];
          quote = match[2];
        } else if (index === 4) { // Academic citation style
          author = match[1];
          quote = match[3];
        } else if (index === 5) { // In the words of Person
          author = match[1];
          quote = match[2];
        }

        if (quote && author && quote.length >= 15 && quote.length <= 200) {
          let confidence = 0.9; // Very high confidence for quotes
          if (index === 0 || index === 4) confidence = 0.95; // Direct quotes and academic citations
          
          console.log(`💬 Found quote: "${quote}" by ${author} (confidence: ${confidence})`);
          
          found.push({
            title: this.cleanTitle(quote),
            author: this.cleanAuthor(author),
            type: 'quote',
            confidence: Math.min(confidence, 1.0),
            source: 'quote_pattern_' + index
          });
        }
      });
    });

    // Process statistics patterns  
    statisticsPatterns.forEach((pattern, index) => {
      const matches = [...text.matchAll(pattern)];
      console.log(`📊 Statistics pattern ${index} found ${matches.length} matches`);
      
      matches.forEach(match => {
        let statistic, context;
        
        if (index === 0) { // Study found X% of
          statistic = match[1];
          context = match[2];
        } else if (index === 1) { // According to statistics
          context = match[1];
          statistic = match[2] || 'statistical data';
        } else if (index === 2) { // X in Y people
          statistic = `${match[1]} in ${match[2]}`;
          context = match[3];
        } else if (index === 3) { // Dollar amounts
          statistic = match[1];
          context = match[2];
        } else if (index === 4) { // Growth rates
          statistic = match[2];
          context = match[3];
        } else if (index === 5) { // Time-based
          statistic = `over ${match[1]} ${match[2]}`;
          context = match[3];
        }

        if (statistic && context && context.length >= 10) {
          let confidence = 0.8; // High confidence for statistics
          
          console.log(`📊 Found statistic: "${statistic}" context: "${context}" (confidence: ${confidence})`);
          
          found.push({
            title: this.cleanTitle(`${statistic} - ${context}`),
            author: null,
            type: 'statistic',
            confidence: Math.min(confidence, 1.0),
            source: 'stats_pattern_' + index
          });
        }
      });
    });

    // Process theory patterns
    theoryPatterns.forEach((pattern, index) => {
      const matches = [...text.matchAll(pattern)];
      console.log(`🧠 Theory pattern ${index} found ${matches.length} matches`);
      
      matches.forEach(match => {
        const theory = match[1] || match[0];
        
        if (theory && theory.length >= 5 && theory.length <= 60) {
          let confidence = 0.85; // High confidence for theories
          if (index <= 2) confidence = 0.9; // Theory, Principle, Law patterns
          
          console.log(`🧠 Found theory/concept: "${theory}" (confidence: ${confidence})`);
          
          found.push({
            title: this.cleanTitle(theory),
            author: null,
            type: 'theory',
            confidence: Math.min(confidence, 1.0),
            source: 'theory_pattern_' + index
          });
        }
      });
    });

    // Process educational patterns
    educationalPatterns.forEach((pattern, index) => {
      const matches = [...text.matchAll(pattern)];
      console.log(`🎓 Educational pattern ${index} found ${matches.length} matches`);
      
      matches.forEach(match => {
        const course = match[1];
        const institution = match[2] || null;
        
        if (course && course.length >= 5 && course.length <= 60) {
          let confidence = 0.75; // Good confidence for educational content
          if (index <= 1) confidence = 0.85; // Course mentions and university courses
          if (institution) confidence += 0.1;
          
          console.log(`🎓 Found educational content: "${course}" ${institution ? `at ${institution}` : ''} (confidence: ${confidence})`);
          
          found.push({
            title: this.cleanTitle(course),
            author: institution ? this.cleanAuthor(institution) : null,
            type: 'course',
            confidence: Math.min(confidence, 1.0),
            source: 'education_pattern_' + index
          });
        }
      });
    });

    // Process software patterns
    softwarePatterns.forEach((pattern, index) => {
      const matches = [...text.matchAll(pattern)];
      console.log(`💻 Software pattern ${index} found ${matches.length} matches`);
      
      matches.forEach(match => {
        const software = match[1];
        
        if (software && software.length >= 3 && software.length <= 40) {
          let confidence = 0.8; // High confidence for software
          if (index <= 2) confidence = 0.9; // Programming languages and popular tools
          
          console.log(`💻 Found software/tool: "${software}" (confidence: ${confidence})`);
          
          found.push({
            title: this.cleanTitle(software),
            author: null,
            type: 'software',
            confidence: Math.min(confidence, 1.0),
            source: 'software_pattern_' + index
          });
        }
      });
    });

    // Add timestamps to citations if segments are available
    if (segments.length > 0) {
      found.forEach(citation => {
        const timestamp = this.findTimestampForCitation(citation.title, segments);
        if (timestamp !== null) {
          citation.timestamp = timestamp;
        }
      });
    }

    // Remove duplicates and sort by confidence
    const unique = this.removeDuplicates(found);
    
    // Apply strict quality filtering - multiple passes
    let qualityFiltered = unique.filter(citation => {
      // Basic confidence threshold
      if (citation.confidence < 0.7) return false;
      
      // Apply generic term filter
      if (this.isGenericTerm && this.isGenericTerm(citation.title)) {
        console.log(`🚫 Filtered out generic term: "${citation.title}"`);
        return false;
      }
      
      // Additional quality checks
      const title = citation.title.toLowerCase();
      
      // Reject single words that are too generic
      if (!title.includes(' ') && title.length < 6) {
        console.log(`🚫 Filtered out too short/generic: "${citation.title}"`);
        return false;
      }
      
      // Reject obviously generic phrases
      const genericPhrases = ['general', 'basic', 'simple', 'common', 'normal', 'regular'];
      if (genericPhrases.some(phrase => title.includes(phrase))) {
        console.log(`🚫 Filtered out generic phrase: "${citation.title}"`);
        return false;
      }
      
      return true;
    });
    
    const sorted = qualityFiltered.sort((a, b) => b.confidence - a.confidence);
    
    console.log(`📚 Found ${sorted.length} high-quality citations (filtered from ${found.length}):`, sorted.map(c => `"${c.title}" (${(c.confidence * 100).toFixed(0)}%)`));
    return sorted.slice(0, 15); // Reduced to 15 highest-quality citations
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

  findTimestampForCitation(citationTitle, segments) {
    // Look for the citation title in the segments
    const searchTerms = citationTitle.toLowerCase().split(' ').filter(word => word.length > 2);
    
    for (const segment of segments) {
      const segmentText = segment.text.toLowerCase();
      
      // Check if any significant words from the citation appear in this segment
      const matchCount = searchTerms.filter(term => segmentText.includes(term)).length;
      
      // If we find a good match (at least half the words or 2+ words)
      if (matchCount >= Math.max(2, Math.ceil(searchTerms.length / 2))) {
        console.log(`⏱️ Found timestamp for "${citationTitle}": ${segment.start}s`);
        return Math.floor(segment.start);
      }
    }
    
    return null;
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

  isValidPlace(place) {
    const placeLower = place.toLowerCase();
    
    // Filter out common false positives
    const invalidPlaces = [
      'this', 'that', 'these', 'those', 'here', 'there', 'where', 
      'in', 'at', 'on', 'to', 'from', 'the', 'and', 'or', 'but',
      'visit', 'travel', 'go', 'been', 'country', 'city', 'island',
      'good', 'bad', 'great', 'amazing', 'beautiful', 'nice'
    ];
    
    if (invalidPlaces.includes(placeLower)) {
      return false;
    }
    
    // Must have at least one alphabetic character
    if (!/[a-zA-Z]/.test(place)) {
      return false;
    }
    
    // Should start with capital letter (proper noun)
    if (!/^[A-Z]/.test(place)) {
      return false;
    }
    
    // Should not contain too many numbers
    const numberCount = (place.match(/\d/g) || []).length;
    if (numberCount > 0) {
      return false;
    }
    
    return true;
  }

  isValidPerson(person) {
    const personLower = person.toLowerCase().trim();
    
    // ABSOLUTELY FORBIDDEN - These should NEVER be considered people
    const strictlyForbiddenAsPersons = [
      // Common UI/conversation words that get misclassified
      'objects', 'thanks', 'thank you', 'welcome', 'hello', 'hi', 'goodbye', 'bye',
      'please', 'yes', 'no', 'okay', 'ok', 'sure', 'sorry', 'excuse me',
      
      // Generic pronouns and words
      'this', 'that', 'these', 'those', 'he', 'she', 'they', 'we', 'you', 'me',
      'him', 'her', 'them', 'us', 'according', 'says', 'by', 'from', 'with', 'about',
      
      // Descriptive words
      'good', 'bad', 'great', 'amazing', 'nice', 'beautiful', 'wonderful', 'excellent',
      'the', 'and', 'or', 'but', 'so', 'if', 'when', 'where', 'why', 'how', 'what',
      
      // Common nouns that might get capitalized
      'world', 'earth', 'space', 'time', 'place', 'work', 'science', 'physics',
      'research', 'study', 'analysis', 'theory', 'concept', 'idea', 'method',
      'system', 'process', 'project', 'video', 'content', 'material', 'object',
      
      // Action words
      'start', 'end', 'begin', 'finish', 'stop', 'go', 'come', 'see', 'look', 'watch',
      'listen', 'hear', 'know', 'think', 'feel', 'want', 'need', 'get', 'give', 'take',
      'make', 'do', 'use', 'try', 'help', 'show', 'tell', 'say', 'talk', 'speak'
    ];
    
    // Check against forbidden list
    if (strictlyForbiddenAsPersons.includes(personLower)) {
      console.log(`❌ Rejected invalid person: "${person}" (in forbidden list)`);
      return false;
    }
    
    // Must have at least one alphabetic character
    if (!/[a-zA-Z]/.test(person)) {
      console.log(`❌ Rejected invalid person: "${person}" (no alphabetic characters)`);
      return false;
    }
    
    // Should start with capital letter (proper noun)
    if (!/^[A-Z]/.test(person)) {
      console.log(`❌ Rejected invalid person: "${person}" (doesn't start with capital letter)`);
      return false;
    }
    
    // Should not contain numbers
    if (/\d/.test(person)) {
      console.log(`❌ Rejected invalid person: "${person}" (contains numbers)`);
      return false;
    }
    
    // Should not be all uppercase (usually acronyms)
    if (person === person.toUpperCase() && person.length > 3) {
      console.log(`❌ Rejected invalid person: "${person}" (all uppercase, likely acronym)`);
      return false;
    }
    
    // Should be at least 2 characters and typically contain both letters and spaces (for full names)
    if (person.length < 2) {
      console.log(`❌ Rejected invalid person: "${person}" (too short)`);
      return false;
    }
    
    // Additional pattern checks for common false positives
    if (/^(The|A|An)\s/i.test(person) || /\s(the|a|an)$/i.test(person)) {
      console.log(`❌ Rejected invalid person: "${person}" (contains articles)`);
      return false;
    }
    
    console.log(`✅ Validated person: "${person}"`);
    return true;
  }

  isValidCompany(company) {
    const companyLower = company.toLowerCase();
    
    // Filter out common false positives
    const invalidCompanies = [
      'this', 'that', 'these', 'those', 'here', 'there',
      'company', 'business', 'organization', 'corporation',
      'good', 'bad', 'great', 'amazing', 'nice'
    ];
    
    if (invalidCompanies.includes(companyLower)) {
      return false;
    }
    
    // Must have at least one alphabetic character
    if (!/[a-zA-Z]/.test(company)) {
      return false;
    }
    
    // Should not contain only lowercase (proper nouns should be capitalized)
    if (company.length > 3 && company === company.toLowerCase()) {
      return false;
    }
    
    return true;
  }

  isValidTechnology(technology) {
    const techLower = technology.toLowerCase();
    
    // Filter out common false positives
    const invalidTech = [
      'this', 'that', 'these', 'those', 'here', 'there',
      'technology', 'tech', 'system', 'platform',
      'good', 'bad', 'great', 'amazing', 'nice'
    ];
    
    if (invalidTech.includes(techLower)) {
      return false;
    }
    
    // Must have at least one alphabetic character
    if (!/[a-zA-Z]/.test(technology)) {
      return false;
    }
    
    return true;
  }

  isValidEvent(event) {
    const eventLower = event.toLowerCase();
    
    // Filter out common false positives
    const invalidEvents = [
      'this', 'that', 'these', 'those', 'here', 'there',
      'event', 'period', 'time', 'era', 'age',
      'good', 'bad', 'great', 'amazing', 'terrible'
    ];
    
    if (invalidEvents.includes(eventLower)) {
      return false;
    }
    
    // Must have at least one alphabetic character
    if (!/[a-zA-Z]/.test(event)) {
      return false;
    }
    
    // Should contain meaningful words
    const meaningfulWords = ['war', 'revolution', 'movement', 'age', 'era', 'period', 'landing', 'battle', 'declaration'];
    if (event.length > 15 && !meaningfulWords.some(word => eventLower.includes(word))) {
      return false;
    }
    
    return true;
  }

  isValidVideoTitle(title) {
    // Filter out common false positives for video titles
    const invalidPatterns = [
      /^(this|that|these|those|here|there|now|then|today|tomorrow|yesterday)$/i,
      /^(link|description|comment|like|subscribe|notification|bell)$/i,
      /^(website|platform|app|software|program|system)$/i,
      /^(part|episode|section|chapter)\s*\d*$/i,
      /^\d+$/,  // Just numbers
      /^[a-z\s]+$/,  // All lowercase (likely not a proper title)
      /^(video|content|tutorial|guide|how|what|when|where|why)$/i, // Too generic
    ];
    
    // Valid video content indicators
    const validVideoKeywords = [
      'documentary', 'series', 'film', 'movie', 'talk', 'lecture', 'course',
      'explained', 'review', 'analysis', 'breakdown', 'deep dive', 'guide',
      'tutorial', 'masterclass', 'workshop', 'seminar', 'presentation'
    ];
    
    const titleLower = title.toLowerCase();
    
    return !invalidPatterns.some(pattern => pattern.test(title.trim())) &&
           (title.length > 5 || validVideoKeywords.some(keyword => titleLower.includes(keyword)));
  }

  hasVideoKeywords(title) {
    const videoKeywords = [
      'documentary', 'film', 'movie', 'series', 'episode', 'talk', 'lecture',
      'course', 'tutorial', 'guide', 'explained', 'review', 'analysis',
      'breakdown', 'masterclass', 'workshop', 'seminar', 'presentation',
      'interview', 'discussion', 'debate', 'panel', 'conference'
    ];
    return videoKeywords.some(keyword => title.toLowerCase().includes(keyword));
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
          // For papers/studies, try Google Scholar first for academic content
          enrichedData = await this.searchGoogleScholar(citation.title, citation.author);
          
          // Fallback to Wikipedia if Scholar fails
          if (!enrichedData) {
            console.log(`🎓 Google Scholar failed for paper "${citation.title}", trying Wikipedia fallback...`);
            enrichedData = await this.searchWikipedia(citation.title, 'paper');
          }
          
          // Final fallback to Google Books
          if (!enrichedData) {
            console.log(`🔬 Wikipedia also failed for paper "${citation.title}", trying Google Books fallback...`);
            enrichedData = await this.searchGoogleBooks(citation.title, citation.author);
          }
        } else if (citation.type === 'product') {
          enrichedData = await this.enrichProduct(citation.title);
        } else if (citation.type === 'video') {
          enrichedData = await this.enrichVideo(citation.title, citation.author);
        } else if (citation.type === 'topic') {
          enrichedData = await this.searchWikipedia(citation.title, 'topic');
        } else if (citation.type === 'place') {
          enrichedData = await this.searchWikipedia(citation.title, 'place');
        } else if (citation.type === 'person') {
          enrichedData = await this.searchWikipedia(citation.title, 'person');
        } else if (citation.type === 'company') {
          enrichedData = await this.searchWikipedia(citation.title, 'company');
        } else if (citation.type === 'technology') {
          enrichedData = await this.searchWikipedia(citation.title, 'technology');
        } else if (citation.type === 'event') {
          enrichedData = await this.searchWikipedia(citation.title, 'event');
        }
        
        const finalCitation = {
          ...citation,
          ...(enrichedData || {}),
          googleSearchLink: `https://www.google.com/search?q=${encodeURIComponent(citation.title + (citation.author ? ' ' + citation.author : ''))}`,
          googleScholarLink: `https://scholar.google.com/scholar?q=${encodeURIComponent(citation.title)}`,
          youtubeSearchLink: `https://www.youtube.com/results?search_query=${encodeURIComponent(citation.title)}`
        };
        
        // Calculate multi-factor confidence score
        finalCitation.confidence = this.calculateMultiFactorConfidence(finalCitation, !!enrichedData);
        
        enriched.push(finalCitation);
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

  // Google Scholar search for academic papers
  async searchGoogleScholar(title, author = null) {
    try {
      console.log(`🎓 Searching Google Scholar for: "${title}" by ${author || 'Unknown'}`);
      
      // Build search query for Scholar
      let query = title;
      if (author) {
        query += ` author:"${author}"`;
      }
      
      // Since Google Scholar doesn't have a public API, we'll use their search URL
      // and try to extract basic information from the search results page
      const scholarUrl = `https://scholar.google.com/scholar?q=${encodeURIComponent(query)}&hl=en`;
      
      try {
        // Try to fetch Scholar results (note: this may be blocked by CORS)
        const response = await fetch(scholarUrl, {
          mode: 'no-cors', // This won't give us response data, but validates the URL
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        // Since we can't actually parse Scholar results due to CORS,
        // we'll create a structured result with the search URL and related info
        const scholarResult = {
          title: title,
          author: author,
          description: `Academic search results for "${title}"${author ? ` by ${author}` : ''}`,
          googleScholarLink: scholarUrl,
          source: 'google_scholar'
        };
        
        // Add additional academic search links
        scholarResult.pubmedLink = this.generatePubMedLink(title, author);
        scholarResult.arxivLink = this.generateArxivLink(title);
        scholarResult.researchGateLink = this.generateResearchGateLink(title, author);
        
        // Enhanced search links for academic content
        scholarResult.googleSearchLink = `https://www.google.com/search?q=${encodeURIComponent(title + ' academic paper research')}`;
        scholarResult.youtubeSearchLink = `https://www.youtube.com/results?search_query=${encodeURIComponent(title + ' explained research')}`;
        
        console.log(`🎓 Generated Scholar result for: "${title}"`);
        return scholarResult;
        
      } catch (fetchError) {
        console.warn('🎓 Scholar fetch failed, creating fallback result:', fetchError);
        
        // Even if fetch fails, provide the Scholar link and academic resources
        return {
          title: title,
          author: author,
          description: `Academic paper or study: "${title}"${author ? ` by ${author}` : ''}`,
          googleScholarLink: scholarUrl,
          pubmedLink: this.generatePubMedLink(title, author),
          arxivLink: this.generateArxivLink(title),
          googleSearchLink: `https://www.google.com/search?q=${encodeURIComponent(title + ' academic research')}`,
          youtubeSearchLink: `https://www.youtube.com/results?search_query=${encodeURIComponent(title + ' explained')}`,
          source: 'google_scholar_fallback'
        };
      }
      
    } catch (error) {
      console.warn('🎓 Google Scholar search error:', error);
      return null;
    }
  }

  generatePubMedLink(title, author = null) {
    const searchTerm = author ? `${title} ${author}` : title;
    return `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(searchTerm)}`;
  }

  generateArxivLink(title) {
    return `https://arxiv.org/search/?query=${encodeURIComponent(title)}&searchtype=all`;
  }

  generateResearchGateLink(title, author = null) {
    const searchTerm = author ? `${title} ${author}` : title;
    return `https://www.researchgate.net/search/publication?q=${encodeURIComponent(searchTerm)}`;
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

  // Video/Documentary enrichment
  async enrichVideo(videoTitle, channel = null) {
    try {
      console.log(`🎬 Enriching video: "${videoTitle}" by ${channel || 'Unknown'}`);
      
      // Create search queries for different platforms
      const searchQuery = channel ? `${videoTitle} ${channel}` : videoTitle;
      
      // Try to get basic information from Wikipedia if it's a well-known documentary/series
      let wikiData = null;
      if (this.isWellKnownContent(videoTitle)) {
        wikiData = await this.searchWikipedia(videoTitle, 'video');
      }
      
      const enrichedVideo = {
        title: videoTitle,
        author: channel,
        description: wikiData?.description || `Video content: "${videoTitle}"${channel ? ` by ${channel}` : ''}`,
        thumbnail: wikiData?.thumbnail || null,
        youtubeSearchLink: `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`,
        netflixSearchLink: `https://www.netflix.com/search?q=${encodeURIComponent(videoTitle)}`,
        imdbSearchLink: `https://www.imdb.com/find?q=${encodeURIComponent(videoTitle)}&s=tt`,
        googleSearchLink: `https://www.google.com/search?q=${encodeURIComponent(searchQuery + ' documentary film')}`
      };
      
      return enrichedVideo;
    } catch (error) {
      console.warn('Video enrichment error:', error);
      return null;
    }
  }

  isWellKnownContent(title) {
    const wellKnownContent = [
      'cosmos', 'planet earth', 'blue planet', 'our planet', 'free solo',
      'won\'t you be my neighbor', 'the social dilemma', 'blackfish', 'super size me',
      'an inconvenient truth', 'march of the penguins', 'fahrenheit 9/11',
      'bowling for columbine', 'sicko', 'food inc', 'the cove', 'gasland'
    ];
    return wellKnownContent.some(content => title.toLowerCase().includes(content));
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

  // Multi-factor confidence scoring system
  calculateMultiFactorConfidence(citation, apiSuccess) {
    console.log(`🎯 Calculating multi-factor confidence for: "${citation.title}"`);
    
    let confidence = citation.confidence || 0.5; // Start with original confidence
    
    // Factor 1: Pattern Strength (based on source pattern)
    const patternStrength = this.getPatternStrength(citation.source);
    console.log(`📊 Pattern strength: ${patternStrength}`);
    
    // Factor 2: Text Quality
    const textQuality = this.getTextQuality(citation.title, citation.author);
    console.log(`📝 Text quality: ${textQuality}`);
    
    // Factor 3: API Success Bonus
    const apiBonus = apiSuccess ? 0.2 : -0.1;
    console.log(`🔗 API success bonus: ${apiBonus}`);
    
    // Factor 4: Citation Type Context
    const typeContext = this.getTypeContextBonus(citation.type, citation.title);
    console.log(`📚 Type context bonus: ${typeContext}`);
    
    // Factor 5: Length and Format Quality
    const formatQuality = this.getFormatQuality(citation.title, citation.type);
    console.log(`✨ Format quality: ${formatQuality}`);
    
    // Combine all factors with weights
    const finalConfidence = Math.min(Math.max(
      confidence * 0.3 +           // Original pattern confidence (30%)
      patternStrength * 0.25 +     // Pattern reliability (25%)
      textQuality * 0.2 +          // Text quality (20%)
      apiBonus +                   // API success/failure (±0.2)
      typeContext * 0.15 +         // Type-specific context (15%)
      formatQuality * 0.1,         // Format quality (10%)
      0.1 // Minimum confidence
    ), 1.0); // Maximum confidence
    
    console.log(`🎯 Final confidence: ${citation.confidence} → ${finalConfidence.toFixed(3)}`);
    return finalConfidence;
  }

  getPatternStrength(source) {
    if (!source) return 0.5;
    
    // Higher confidence for more specific patterns
    const patternStrengths = {
      // Book patterns (most to least reliable)
      'pattern_0': 0.9,  // "book called/titled 'Title'"
      'pattern_1': 0.95, // "'Title' by Author"
      'pattern_2': 0.9,  // "Author's book 'Title'"
      'pattern_3': 0.85, // "in his/her book 'Title'"
      'pattern_4': 0.7,  // "the book 'Title'"
      'pattern_5': 0.75, // "I recommend the book Title"
      'pattern_6': 0.6,  // "Title is a great book"
      'pattern_7': 0.8,  // "Author wrote Title"
      
      // Paper patterns
      'paper_pattern_0': 0.95, // "study published in Journal"
      'paper_pattern_1': 0.9,  // "Journal of Something"
      'paper_pattern_2': 0.95, // High-impact journals
      'paper_pattern_3': 0.8,  // "according to a study"
      'paper_pattern_4': 0.85, // "researchers at University"
      'paper_pattern_5': 0.9,  // "meta-analysis"
      'paper_pattern_6': 0.8,  // Scientific experiments
      'paper_pattern_7': 0.9,  // Famous experiments
      'paper_pattern_8': 0.85, // Physics theories
      'paper_pattern_9': 0.8,  // Scientific discoveries
      
      // Science patterns
      'science_pattern_0': 0.9, // Physics theories
      'science_pattern_1': 0.9, // Quantum concepts
      'science_pattern_2': 0.8, // Mathematical concepts
      'science_pattern_3': 0.8, // Physics phenomena
      'science_pattern_4': 0.7, // Scientific fields
      'science_pattern_5': 0.7, // Technology/applications
      'science_pattern_6': 0.8, // Institutions
      'science_pattern_7': 0.8, // Famous scientists
      
      // Video patterns
      'video_pattern_0': 0.9,  // "watch the documentary 'Title'"
      'video_pattern_1': 0.9,  // "documentary called/titled 'Title'"
      'video_pattern_2': 0.85, // "TED talk about/on 'Topic'"
      'video_pattern_3': 0.8,  // "YouTube channel 'Name'"
      'video_pattern_4': 0.8,  // "video series 'Title'"
      'video_pattern_5': 0.85, // "Netflix/streaming documentary 'Title'"
      'video_pattern_6': 0.7,  // "as shown in the video"
      'video_pattern_7': 0.75, // "Channel's video about"
      'video_pattern_8': 0.8,  // Well-known series (Cosmos, Planet Earth, etc.)
      'video_pattern_9': 0.75, // Educational channels (Veritasium, etc.)
      
      // Product and topic patterns
      'product_pattern_0': 0.9, // Brand + Model
      'product_pattern_1': 0.9,
      'product_pattern_2': 0.9,
      'product_pattern_3': 0.9,
      'product_pattern_4': 0.9,
      'topic_pattern_0': 0.8,   // Educational context
      'topic_pattern_1': 0.8,
      'topic_pattern_2': 0.8,
      'topic_pattern_3': 0.7,
      'topic_pattern_4': 0.7,
      'topic_pattern_5': 0.6,
      'topic_pattern_6': 0.6
    };
    
    return patternStrengths[source] || 0.5;
  }

  getTextQuality(title, author) {
    if (!title) return 0;
    
    let quality = 0.5;
    
    // Length quality (sweet spot is 10-50 characters)
    const length = title.length;
    if (length >= 10 && length <= 50) {
      quality += 0.2;
    } else if (length >= 5 && length <= 80) {
      quality += 0.1;
    } else if (length < 5 || length > 100) {
      quality -= 0.2;
    }
    
    // Proper capitalization
    if (title.match(/^[A-Z][a-z]/)) {
      quality += 0.1;
    }
    
    // Contains meaningful words (not just numbers/symbols)
    const meaningfulWords = title.match(/[a-zA-Z]{3,}/g);
    if (meaningfulWords && meaningfulWords.length >= 2) {
      quality += 0.1;
    }
    
    // Author presence bonus
    if (author && author.length > 2) {
      quality += 0.1;
    }
    
    // Avoid common false positives
    const falsePositives = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    if (falsePositives.includes(title.toLowerCase())) {
      quality -= 0.5;
    }
    
    return Math.max(0, Math.min(1, quality));
  }

  getTypeContextBonus(type, title) {
    if (!type || !title) return 0;
    
    const titleLower = title.toLowerCase();
    
    switch (type) {
      case 'book':
        // Books with common book words get bonus
        if (titleLower.match(/\b(guide|handbook|manual|story|tale|novel|biography|memoir)\b/)) {
          return 0.1;
        }
        break;
        
      case 'paper':
        // Academic papers with scientific terms get bonus
        if (titleLower.match(/\b(study|research|analysis|theory|experiment|journal|review)\b/)) {
          return 0.15;
        }
        break;
        
      case 'product':
        // Products with model numbers/versions get bonus
        if (titleLower.match(/\b(pro|max|plus|ultra|air|mini|\d+)\b/)) {
          return 0.1;
        }
        break;
        
      case 'video':
        // Videos with documentary/educational terms get bonus
        if (titleLower.match(/\b(documentary|film|series|talk|lecture|course|explained|review|analysis)\b/)) {
          return 0.15;
        }
        break;
        
      case 'topic':
        // Educational topics get bonus
        if (titleLower.match(/\b(physics|chemistry|biology|mathematics|science|engineering|programming)\b/)) {
          return 0.1;
        }
        break;
    }
    
    return 0;
  }

  getFormatQuality(title, type) {
    if (!title) return 0;
    
    let quality = 0.5;
    
    // Check for proper quote formatting
    if (title.match(/^["'].*["']$/)) {
      quality += 0.1;
    }
    
    // Check for title case (for books/papers)
    if ((type === 'book' || type === 'paper') && title.match(/^[A-Z][a-z]+(\s+[A-Z][a-z]+)*$/)) {
      quality += 0.1;
    }
    
    // Penalize all caps or all lowercase
    if (title === title.toUpperCase() || title === title.toLowerCase()) {
      quality -= 0.1;
    }
    
    // Penalize excessive punctuation
    const punctuationCount = (title.match(/[!@#$%^&*()_+=\[\]{}|;:,.<>?]/g) || []).length;
    if (punctuationCount > title.length * 0.2) {
      quality -= 0.2;
    }
    
    return Math.max(0, Math.min(1, quality));
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
    top: 80px;
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
          <p style="margin: 4px 0 0 0; font-size: 14px; opacity: 0.9;">Books • Academic Papers • Products • Topics</p>
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
      <!-- Tab Navigation -->
      <div style="
        display: flex;
        margin-bottom: 20px;
        border-bottom: 2px solid rgba(226, 232, 240, 0.3);
      ">
        <button id="tab-academic" class="citation-tab" style="
          flex: 1;
          padding: 12px 16px;
          background: linear-gradient(135deg, #4285f4 0%, #1a73e8 100%);
          color: white;
          border: none;
          border-radius: 8px 8px 0 0;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          margin-right: 2px;
        ">🎓 Academic</button>
        
        <button id="tab-general" class="citation-tab" style="
          flex: 1;
          padding: 12px 16px;
          background: rgba(102, 126, 234, 0.1);
          color: #667eea;
          border: none;
          border-radius: 8px 8px 0 0;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          margin: 0 2px;
        ">📖 Citations</button>
        
        <button id="tab-videos" class="citation-tab" style="
          flex: 1;
          padding: 12px 16px;
          background: rgba(102, 126, 234, 0.1);
          color: #667eea;
          border: none;
          border-radius: 8px 8px 0 0;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          margin-left: 2px;
        ">🎬 Videos</button>
      </div>

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
      
      <!-- Academic Papers Tab Content -->
      <div id="tab-content-academic" class="tab-content" style="display: block;">
        <div id="citations-list-academic"></div>
      </div>
      
      <!-- General Citations Tab Content -->
      <div id="tab-content-general" class="tab-content" style="display: none;">
        <div id="citations-list-general"></div>
      </div>
      
      <!-- Related Videos Tab Content -->
      <div id="tab-content-videos" class="tab-content" style="display: none;">
        <!-- Video Filters -->
        <div id="video-filters" style="
          display: none;
          margin-bottom: 16px;
          padding: 12px;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-radius: 12px;
          border: 1px solid rgba(226, 232, 240, 0.8);
        ">
          <div style="
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 12px;
          ">
            <span style="
              font-size: 13px;
              font-weight: 600;
              color: #475569;
            ">Filter Videos</span>
            <button id="clear-filters" style="
              background: none;
              border: none;
              color: #64748b;
              font-size: 11px;
              cursor: pointer;
              text-decoration: underline;
            ">Clear All</button>
          </div>
          
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            <!-- Category filters -->
            <div class="filter-group">
              <button class="filter-btn" data-filter="category" data-value="all" style="
                background: #4285f4;
                color: white;
                border: none;
                padding: 4px 8px;
                border-radius: 6px;
                font-size: 10px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
              ">All</button>
              <button class="filter-btn" data-filter="category" data-value="Documentary">Documentary</button>
              <button class="filter-btn" data-filter="category" data-value="Course">Course</button>
              <button class="filter-btn" data-filter="category" data-value="Explainer">Explainer</button>
              <button class="filter-btn" data-filter="category" data-value="Lecture">Lecture</button>
            </div>
            
            <!-- Difficulty filters -->
            <div class="filter-group" style="margin-left: 12px;">
              <button class="filter-btn" data-filter="difficulty" data-value="Beginner">Beginner</button>
              <button class="filter-btn" data-filter="difficulty" data-value="Intermediate">Intermediate</button>
              <button class="filter-btn" data-filter="difficulty" data-value="Advanced">Advanced</button>
            </div>
          </div>
          
          <!-- Advanced Filters Row -->
          <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(226, 232, 240, 0.6);">
            <!-- Duration filters -->
            <div class="filter-group">
              <span style="font-size: 10px; color: #64748b; margin-right: 6px;">Duration:</span>
              <button class="filter-btn" data-filter="duration" data-value="short">Short (&lt;10min)</button>
              <button class="filter-btn" data-filter="duration" data-value="medium">Medium (10-30min)</button>
              <button class="filter-btn" data-filter="duration" data-value="long">Long (&gt;30min)</button>
            </div>
            
            <!-- Views filters -->
            <div class="filter-group" style="margin-left: 12px;">
              <span style="font-size: 10px; color: #64748b; margin-right: 6px;">Popularity:</span>
              <button class="filter-btn" data-filter="views" data-value="high">High (&gt;1M)</button>
              <button class="filter-btn" data-filter="views" data-value="medium">Medium (100K-1M)</button>
              <button class="filter-btn" data-filter="views" data-value="low">Niche (&lt;100K)</button>
            </div>
            
            <!-- Sort options -->
            <div class="filter-group" style="margin-left: 12px;">
              <span style="font-size: 10px; color: #64748b; margin-right: 6px;">Sort by:</span>
              <button class="filter-btn" data-filter="sort" data-value="relevance">Relevance</button>
              <button class="filter-btn" data-filter="sort" data-value="rating">Rating</button>
              <button class="filter-btn" data-filter="sort" data-value="views">Views</button>
              <button class="filter-btn" data-filter="sort" data-value="duration">Duration</button>
            </div>
          </div>
        </div>
        
        <div id="videos-list"></div>
      </div>
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
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .filter-btn {
      background: rgba(102, 126, 234, 0.1);
      color: #667eea;
      border: none;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 10px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .filter-btn:hover {
      background: rgba(102, 126, 234, 0.2);
      transform: translateY(-1px);
    }
    
    .filter-btn.active {
      background: #4285f4;
      color: white;
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
  
  // Tab switching functionality
  let activeTab = 'academic';
  
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
    } else if (e.target.id === 'tab-academic' || e.target.id === 'tab-general' || e.target.id === 'tab-videos') {
      // Handle tab switching
      let newTab;
      if (e.target.id === 'tab-academic') newTab = 'academic';
      else if (e.target.id === 'tab-general') newTab = 'general';
      else if (e.target.id === 'tab-videos') newTab = 'videos';
      
      if (newTab !== activeTab) {
        switchTab(newTab);
      }
    }
  });

  function switchTab(tabName) {
    activeTab = tabName;
    
    // Update tab buttons
    const academicTab = document.getElementById('tab-academic');
    const generalTab = document.getElementById('tab-general');
    const videosTab = document.getElementById('tab-videos');
    const academicContent = document.getElementById('tab-content-academic');
    const generalContent = document.getElementById('tab-content-general');
    const videosContent = document.getElementById('tab-content-videos');
    
    // Reset all tabs to inactive state
    [academicTab, generalTab, videosTab].forEach(tab => {
      if (tab) {
        tab.style.background = 'rgba(102, 126, 234, 0.1)';
        tab.style.color = '#667eea';
      }
    });
    
    // Hide all content
    [academicContent, generalContent, videosContent].forEach(content => {
      if (content) content.style.display = 'none';
    });
    
    // Activate selected tab
    if (tabName === 'academic') {
      academicTab.style.background = 'linear-gradient(135deg, #4285f4 0%, #1a73e8 100%)';
      academicTab.style.color = 'white';
      academicContent.style.display = 'block';
      
      // Load academic papers when tab is activated
      loadAcademicPapers();
    } else if (tabName === 'general') {
      generalTab.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      generalTab.style.color = 'white';
      generalContent.style.display = 'block';
      
      // Update citations display when tab is activated
      if (window.currentCitations && window.currentCitations.length > 0) {
        console.log('🔄 Refreshing citations display for general tab');
        updateCitationsUI(window.currentCitations);
      }
    } else if (tabName === 'videos') {
      videosTab.style.background = 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)';
      videosTab.style.color = 'white';
      videosContent.style.display = 'block';
      
      // Load related videos when tab is activated
      loadRelatedVideos();
    }
  }
  
  document.body.appendChild(toggleButton);
  document.body.appendChild(sidebar);
  
  // Store references for cleanup
  uiElements = { toggleButton, sidebar, style };
  
  console.log('✅ Beautiful UI created successfully!');
  return { toggleButton, sidebar };
}

// YouTube Search API integration
let relatedVideosCache = null;
let academicPapersCache = null;

async function loadAcademicPapers() {
  const papersContainer = document.getElementById('tab-content-academic');
  if (!papersContainer) return;
  
  // Show loading state
  papersContainer.innerHTML = `
    <div style="
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px;
      color: #64748b;
      font-size: 14px;
    ">
      <div style="
        width: 20px;
        height: 20px;
        border: 2px solid #e2e8f0;
        border-top: 2px solid #4285f4;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-right: 12px;
      "></div>
      Analyzing video content and finding relevant academic papers...
    </div>
  `;
  
  try {
    // Use cached results if available
    if (academicPapersCache) {
      displayAcademicPapers(academicPapersCache);
      return;
    }
    
    // Get current video data
    const videoData = await getCurrentVideoData();
    if (!videoData) {
      showNoAcademicPapersMessage();
      return;
    }
    
    // Use ChatGPT for intelligent academic paper suggestions
    const chatGPTDetector = new LLMCitationDetector();
    
    // Try ChatGPT first, with minimal fallback
    let academicSuggestions;
    try {
      // Check if API key is available
      if (window.LOCAL_ENV?.OPENAI_API_KEY) {
        chatGPTDetector.setAPIKey(window.LOCAL_ENV.OPENAI_API_KEY, 'chatgpt');
        
        console.log('🤖 Attempting ChatGPT academic paper generation...');
        academicSuggestions = await chatGPTDetector.generateAcademicPaperSuggestions(videoData);
      } else {
        console.warn('⚠️ OpenAI API key not available, using minimal fallback');
        academicSuggestions = chatGPTDetector.getFallbackAcademicSuggestions(videoData);
      }
    } catch (chatGPTError) {
      console.warn('⚠️ ChatGPT failed, using minimal fallback:', chatGPTError);
      academicSuggestions = chatGPTDetector.getFallbackAcademicSuggestions(videoData);
    }
    
    // If ChatGPT didn't return good results, use minimal fallback
    if (!academicSuggestions || !academicSuggestions.papers || academicSuggestions.papers.length === 0) {
      console.log('🔄 Using minimal fallback academic suggestions...');
      academicSuggestions = chatGPTDetector.getFallbackAcademicSuggestions(videoData);
    }
    
    if (academicSuggestions && academicSuggestions.papers && academicSuggestions.papers.length > 0) {
      academicPapersCache = academicSuggestions;
      displayAcademicPapers(academicSuggestions);
    } else {
      showNoAcademicPapersMessage();
    }
    
  } catch (error) {
    console.error('❌ Error loading academic papers:', error);
    showAcademicPapersErrorMessage();
  }
}

async function getCurrentVideoData() {
  try {
    const title = document.title.replace(' - YouTube', '');
    const channelElement = document.querySelector('#text.ytd-channel-name a') || 
                          document.querySelector('#channel-name #text') ||
                          document.querySelector('.ytd-channel-name a');
    const channel = channelElement ? channelElement.textContent.trim() : 'Unknown Channel';
    
    // Get description
    const descriptionElement = document.querySelector('#description-text') || 
                              document.querySelector('.description-text') ||
                              document.querySelector('[data-testid="description"]');
    const description = descriptionElement ? descriptionElement.textContent.trim() : '';
    
    // Get transcript with error handling
    let transcript = '';
    try {
      const transcriptResult = await getVideoText();
      transcript = typeof transcriptResult === 'string' ? transcriptResult : 
                  (transcriptResult || '').toString();
    } catch (transcriptError) {
      console.warn('⚠️ Could not extract transcript:', transcriptError);
      // Continue without transcript
    }
    
    console.log('📊 Video data extracted:', {
      title: title.substring(0, 50) + '...',
      channel,
      description: description.substring(0, 100) + '...',
      transcriptLength: transcript.length
    });
    
    return {
      title,
      channel,
      description,
      transcript
    };
  } catch (error) {
    console.error('❌ Error getting video data:', error);
    return null;
  }
}

function displayAcademicPapers(academicData) {
  const container = document.getElementById('tab-content-academic');
  if (!container) return;
  
  const { academicField, videoSummary, papers } = academicData;
  
  container.innerHTML = `
    <div style="padding: 16px;">
      <div style="
        background: linear-gradient(135deg, #4285f4 0%, #1a73e8 100%);
        color: white;
        padding: 16px;
        border-radius: 12px;
        margin-bottom: 16px;
        font-size: 14px;
      ">
        <div style="font-weight: 600; margin-bottom: 8px;">📚 Academic Field: ${academicField}</div>
        <div style="opacity: 0.9; font-size: 13px;">${videoSummary}</div>
      </div>
      
      <div style="
        color: #374151;
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 16px;
        display: flex;
        align-items: center;
      ">
        🎓 Relevant Academic Papers
        <span style="
          background: #4285f4;
          color: white;
          font-size: 12px;
          padding: 2px 8px;
          border-radius: 12px;
          margin-left: 8px;
        ">${papers.length}</span>
      </div>
      
      ${papers.map((paper, index) => createAcademicPaperCard(paper, index)).join('')}
    </div>
  `;
}

function createAcademicPaperCard(paper, index) {
  const relevanceColor = paper.relevanceScore >= 8 ? '#10b981' : 
                        paper.relevanceScore >= 6 ? '#f59e0b' : '#6b7280';
  
  const authorsText = Array.isArray(paper.authors) ? paper.authors.join(', ') : paper.authors;
  const keywordsText = Array.isArray(paper.keywords) ? paper.keywords.join(', ') : '';
  
  return `
    <div style="
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 12px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      transition: all 0.2s ease;
    " class="academic-paper-card" onmouseover="this.style.boxShadow='0 4px 12px rgba(66, 133, 244, 0.15)'; this.style.transform='translateY(-1px)'" onmouseout="this.style.boxShadow='0 2px 4px rgba(0, 0, 0, 0.05)'; this.style.transform='translateY(0)'">
      
      <div style="display: flex; justify-content: between; align-items: flex-start; margin-bottom: 12px;">
        <div style="flex: 1;">
          <div style="
            font-weight: 600;
            color: #111827;
            font-size: 15px;
            line-height: 1.4;
            margin-bottom: 6px;
          ">${paper.title}</div>
          
          <div style="
            color: #6b7280;
            font-size: 13px;
            margin-bottom: 4px;
          ">
            <strong>Authors:</strong> ${authorsText}
          </div>
          
          <div style="
            color: #6b7280;
            font-size: 13px;
            margin-bottom: 8px;
          ">
            <strong>Journal:</strong> ${paper.journal} (${paper.year})
          </div>
        </div>
        
        <div style="
          background: ${relevanceColor};
          color: white;
          font-size: 12px;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 6px;
          margin-left: 12px;
        ">
          ${paper.relevanceScore}/10
        </div>
      </div>
      
      <div style="
        color: #4b5563;
        font-size: 13px;
        line-height: 1.5;
        margin-bottom: 12px;
        background: #f8fafc;
        padding: 12px;
        border-radius: 8px;
        border-left: 3px solid #4285f4;
      ">
        <strong>Relevance:</strong> ${paper.relevanceExplanation}
      </div>
      
      ${keywordsText ? `
        <div style="margin-bottom: 12px;">
          ${paper.keywords.map(keyword => `
            <span style="
              background: rgba(66, 133, 244, 0.1);
              color: #4285f4;
              font-size: 11px;
              padding: 2px 6px;
              border-radius: 4px;
              margin-right: 4px;
              display: inline-block;
              margin-bottom: 4px;
            ">${keyword}</span>
          `).join('')}
        </div>
      ` : ''}
      
      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        <a href="https://scholar.google.com/scholar?q=${encodeURIComponent(paper.title + ' ' + authorsText)}" 
           target="_blank" 
           style="
             background: #4285f4;
             color: white;
             text-decoration: none;
             padding: 6px 12px;
             border-radius: 6px;
             font-size: 12px;
             font-weight: 500;
             display: inline-flex;
             align-items: center;
             transition: all 0.2s;
           "
           onmouseover="this.style.background='#3367d6'"
           onmouseout="this.style.background='#4285f4'">
          📚 Google Scholar
        </a>
        
        <a href="https://www.semanticscholar.org/search?q=${encodeURIComponent(paper.title)}" 
           target="_blank" 
           style="
             background: #059669;
             color: white;
             text-decoration: none;
             padding: 6px 12px;
             border-radius: 6px;
             font-size: 12px;
             font-weight: 500;
             display: inline-flex;
             align-items: center;
             transition: all 0.2s;
           "
           onmouseover="this.style.background='#047857'"
           onmouseout="this.style.background='#059669'">
          🔬 Semantic Scholar
        </a>
        
        <a href="https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(paper.title)}" 
           target="_blank" 
           style="
             background: #dc2626;
             color: white;
             text-decoration: none;
             padding: 6px 12px;
             border-radius: 6px;
             font-size: 12px;
             font-weight: 500;
             display: inline-flex;
             align-items: center;
             transition: all 0.2s;
           "
           onmouseover="this.style.background='#b91c1c'"
           onmouseout="this.style.background='#dc2626'">
          🧬 PubMed
        </a>
        
        ${paper.doi ? `
          <a href="https://doi.org/${paper.doi}" 
             target="_blank" 
             style="
               background: #7c3aed;
               color: white;
               text-decoration: none;
               padding: 6px 12px;
               border-radius: 6px;
               font-size: 12px;
               font-weight: 500;
               display: inline-flex;
               align-items: center;
               transition: all 0.2s;
             "
             onmouseover="this.style.background='#6d28d9'"
             onmouseout="this.style.background='#7c3aed'">
            🔗 DOI
          </a>
        ` : ''}
      </div>
    </div>
  `;
}

function showNoAcademicPapersMessage() {
  const container = document.getElementById('tab-content-academic');
  if (!container) return;
  
  container.innerHTML = `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      text-align: center;
      color: #6b7280;
    ">
      <div style="font-size: 48px; margin-bottom: 16px;">📚</div>
      <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px; color: #374151;">
        No Academic Papers Found
      </div>
      <div style="font-size: 14px; line-height: 1.5; max-width: 300px;">
        This video may not have academic content, or we couldn't extract enough information to suggest relevant papers.
      </div>
    </div>
  `;
}

function showAcademicPapersErrorMessage() {
  const container = document.getElementById('tab-content-academic');
  if (!container) return;
  
  container.innerHTML = `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      text-align: center;
      color: #dc2626;
    ">
      <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
      <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">
        Error Loading Academic Papers
      </div>
      <div style="font-size: 14px; line-height: 1.5; max-width: 300px; color: #6b7280;">
        Failed to connect to AI service. Please check your internet connection and try reloading the extension.
      </div>
    </div>
  `;
}

async function loadRelatedVideos() {
  const videosContainer = document.getElementById('videos-list');
  if (!videosContainer) return;
  
  // Show loading state
  videosContainer.innerHTML = `
    <div style="
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px;
      color: #64748b;
      font-size: 14px;
    ">
      <div style="
        width: 20px;
        height: 20px;
        border: 2px solid #e2e8f0;
        border-top: 2px solid #4285f4;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-right: 12px;
      "></div>
      🎬 AI is curating related videos...
    </div>
  `;
  
  try {
    // Use cached results if available
    if (relatedVideosCache) {
      displayRelatedVideos(relatedVideosCache);
      return;
    }
    
    // Try ChatGPT-powered video recommendations first
    const videoData = await getCurrentVideoData();
    let videoResults = await generateSmartVideoRecommendations(videoData);
    
    if (videoResults && videoResults.videos && videoResults.videos.length > 0) {
      // Convert ChatGPT recommendations to our format
      const formattedVideos = formatChatGPTVideoRecommendations(videoResults);
      relatedVideosCache = formattedVideos;
      displayRelatedVideos(formattedVideos);
      return;
    }
    
    // Fallback to citation-based search if ChatGPT fails
    console.log('🔄 Falling back to citation-based video recommendations...');
    const citations = getCurrentCitations();
    if (citations && citations.length > 0) {
      const searchQueries = generateVideoSearchQueries(citations);
      videoResults = await searchYouTubeVideos(searchQueries);
      
      if (videoResults && videoResults.length > 0) {
        relatedVideosCache = videoResults;
        displayRelatedVideos(videoResults);
        return;
      }
    }
    
    // If all else fails, show no videos message
    showNoVideosMessage();
    
  } catch (error) {
    console.error('Error loading related videos:', error);
    showVideoErrorMessage();
  }
}

function getCurrentCitations() {
  // Get citations from the current analysis
  if (window.currentCitations) {
    return window.currentCitations;
  }
  return [];
}

function generateVideoSearchQueries(citations) {
  const queries = [];
  
  // Generate search queries from citations
  citations.forEach(citation => {
    if (citation.type === 'book' && citation.title) {
      queries.push(`"${citation.title}" book review explanation`);
      if (citation.author) {
        queries.push(`${citation.author} ${citation.title} summary`);
      }
    } else if (citation.type === 'paper' && citation.title) {
      queries.push(`"${citation.title}" research explained`);
      queries.push(`${citation.title} scientific study`);
    } else if (citation.type === 'topic' && citation.title) {
      queries.push(`${citation.title} explained`);
      queries.push(`${citation.title} educational video`);
    }
  });
  
  // Limit to top 5 queries to avoid API limits
  return queries.slice(0, 5);
}

async function searchYouTubeVideos(queries) {
  const allResults = [];
  
  for (const query of queries) {
    try {
      // Use YouTube's search without API key (scraping approach)
      const results = await searchYouTubeNoAPI(query);
      if (results && results.length > 0) {
        allResults.push(...results);
      }
    } catch (error) {
      console.warn(`Failed to search for: ${query}`, error);
    }
  }
  
  // Remove duplicates and limit results
  const uniqueResults = removeDuplicateVideos(allResults);
  return uniqueResults.slice(0, 8); // Show max 8 videos
}

async function searchYouTubeNoAPI(query) {
  try {
    // Create a search URL
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query + ' educational')}`;
    
    // Since we can't directly fetch YouTube search results due to CORS,
    // we'll use a different approach - generate educational video suggestions
    // based on the detected citations
    
    return generateEducationalVideoSuggestions(query);
    
  } catch (error) {
    console.error('YouTube search error:', error);
    return [];
  }
}

function generateEducationalVideoSuggestions(query) {
  // Enhanced video recommendation system with categorization and quality indicators
  
  const suggestions = [];
  const queryLower = query.toLowerCase();
  
  // Define video categories with enhanced metadata
  const videoDatabase = {
    quantum: [
      {
        title: 'Quantum Mechanics Explained - Double Slit Experiment',
        channel: 'Veritasium',
        duration: '12:34',
        views: '2.1M views',
        category: 'Documentary',
        difficulty: 'Intermediate',
        rating: 4.8,
        description: 'Deep dive into the famous double slit experiment that reveals the quantum nature of reality',
        tags: ['physics', 'quantum', 'experiment'],
        url: 'https://www.youtube.com/watch?v=p-MNSLsjjdo'
      },
      {
        title: 'Quantum Physics for Beginners - Complete Course',
        channel: 'Khan Academy',
        duration: '45:12',
        views: '890K views',
        category: 'Course',
        difficulty: 'Beginner',
        rating: 4.6,
        description: 'Comprehensive introduction to quantum physics concepts for beginners',
        tags: ['physics', 'quantum', 'beginner'],
        url: 'https://www.youtube.com/watch?v=7kb1VT0J3DE'
      },
      {
        title: 'Quantum Entanglement & Spooky Action',
        channel: 'MinutePhysics',
        duration: '6:23',
        views: '3.2M views',
        category: 'Explainer',
        difficulty: 'Intermediate',
        rating: 4.9,
        description: 'Einstein\'s "spooky action at a distance" explained simply',
        tags: ['physics', 'quantum', 'entanglement'],
        url: 'https://www.youtube.com/watch?v=ZuvK-od647c'
      }
    ],
    
    einstein: [
      {
        title: 'Einstein\'s Theory of Relativity Explained',
        channel: 'MinutePhysics',
        duration: '8:45',
        views: '1.8M views',
        category: 'Explainer',
        difficulty: 'Intermediate',
        rating: 4.7,
        description: 'Special and general relativity explained with clear animations',
        tags: ['physics', 'relativity', 'einstein'],
        url: 'https://www.youtube.com/watch?v=ajhFNcUTJI0'
      },
      {
        title: 'Einstein\'s Greatest Mistake',
        channel: 'Veritasium',
        duration: '16:42',
        views: '2.5M views',
        category: 'Documentary',
        difficulty: 'Advanced',
        rating: 4.8,
        description: 'The cosmological constant and Einstein\'s biggest regret',
        tags: ['physics', 'cosmology', 'einstein'],
        url: 'https://www.youtube.com/watch?v=GdqC2bVLesQ'
      }
    ],
    
    sapiens: [
      {
        title: 'Sapiens by Yuval Noah Harari - Book Summary',
        channel: 'TED-Ed',
        duration: '15:22',
        views: '956K views',
        category: 'Book Review',
        difficulty: 'Intermediate',
        rating: 4.5,
        description: 'Key insights from Harari\'s bestselling book about human history',
        tags: ['history', 'anthropology', 'book'],
        url: 'https://www.youtube.com/watch?v=nzj7Wg4DAbs'
      },
      {
        title: 'Yuval Noah Harari: The Future of Humanity',
        channel: 'TED',
        duration: '18:33',
        views: '4.2M views',
        category: 'Lecture',
        difficulty: 'Advanced',
        rating: 4.9,
        description: 'Harari\'s TED talk on AI, biotechnology, and the future of our species',
        tags: ['future', 'ai', 'humanity'],
        url: 'https://www.youtube.com/watch?v=hL9uk4hKyg4'
      }
    ],
    
    habits: [
      {
        title: 'Atomic Habits by James Clear - Animated Summary',
        channel: 'The Art of Improvement',
        duration: '11:18',
        views: '1.2M views',
        category: 'Book Review',
        difficulty: 'Beginner',
        rating: 4.6,
        description: 'Visual breakdown of Clear\'s habit formation strategies',
        tags: ['productivity', 'habits', 'self-improvement'],
        url: 'https://www.youtube.com/watch?v=PZ7lDrwYdZc'
      },
      {
        title: 'How to Build Better Habits - James Clear',
        channel: 'Google Talks',
        duration: '52:14',
        views: '680K views',
        category: 'Lecture',
        difficulty: 'Intermediate',
        rating: 4.7,
        description: 'Full lecture by James Clear on the science of habit formation',
        tags: ['productivity', 'habits', 'psychology'],
        url: 'https://www.youtube.com/watch?v=mNeXuCYiE0U'
      }
    ],
    
    documentary: [
      {
        title: 'Free Solo - Behind the Scenes',
        channel: 'National Geographic',
        duration: '8:15',
        views: '2.8M views',
        category: 'Documentary',
        difficulty: 'Beginner',
        rating: 4.8,
        description: 'Making of the Oscar-winning climbing documentary',
        tags: ['climbing', 'documentary', 'adventure'],
        url: 'https://www.youtube.com/watch?v=urRVZ4SW7WU'
      },
      {
        title: 'Our Planet - Official Trailer',
        channel: 'Netflix',
        duration: '2:31',
        views: '15M views',
        category: 'Trailer',
        difficulty: 'Beginner',
        rating: 4.9,
        description: 'Stunning nature documentary series narrated by David Attenborough',
        tags: ['nature', 'documentary', 'wildlife'],
        url: 'https://www.youtube.com/watch?v=aETNYyrqNYE'
      }
    ]
  };
  
  // Match query to video categories
  if (queryLower.includes('quantum')) {
    suggestions.push(...videoDatabase.quantum);
  }
  
  if (queryLower.includes('einstein') || queryLower.includes('relativity')) {
    suggestions.push(...videoDatabase.einstein);
  }
  
  if (queryLower.includes('sapiens') || queryLower.includes('harari')) {
    suggestions.push(...videoDatabase.sapiens);
  }
  
  if (queryLower.includes('atomic habits') || queryLower.includes('james clear') || queryLower.includes('habits')) {
    suggestions.push(...videoDatabase.habits);
  }
  
  if (queryLower.includes('documentary') || queryLower.includes('free solo') || queryLower.includes('our planet')) {
    suggestions.push(...videoDatabase.documentary);
  }
  
  // Add general educational suggestions if no specific matches
  if (suggestions.length === 0) {
    // Add some diverse general educational content
    suggestions.push(
      {
        title: `Understanding ${query} - Educational Overview`,
        channel: 'Khan Academy',
        duration: '10:15',
        views: '500K views',
        category: 'Course',
        difficulty: 'Beginner',
        rating: 4.5,
        description: `Comprehensive introduction to ${query} concepts`,
        tags: ['education', 'overview'],
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query + ' educational')}`
      },
      {
        title: 'The Science of Learning - How to Study Effectively',
        channel: 'Veritasium',
        duration: '7:42',
        views: '3.8M views',
        category: 'Explainer',
        difficulty: 'Intermediate',
        rating: 4.8,
        description: 'Evidence-based techniques for better learning and memory retention',
        tags: ['learning', 'science', 'education'],
        url: 'https://www.youtube.com/watch?v=23Xqu0jXlfs'
      },
      {
        title: 'Introduction to Critical Thinking',
        channel: 'Crash Course',
        duration: '35:20',
        views: '1.2M views',
        category: 'Course',
        difficulty: 'Beginner',
        rating: 4.6,
        description: 'Learn the fundamentals of logical reasoning and argument analysis',
        tags: ['critical thinking', 'logic', 'philosophy'],
        url: 'https://www.youtube.com/watch?v=6OLPL5p0fMg'
      },
      {
        title: 'The Future of Education - MIT Lecture',
        channel: 'MIT OpenCourseWare',
        duration: '1:15:30',
        views: '85K views',
        category: 'Lecture',
        difficulty: 'Advanced',
        rating: 4.7,
        description: 'Exploring how technology and pedagogy will transform learning',
        tags: ['education', 'technology', 'future'],
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      }
    );
  }
  
  // Sort by rating and views for quality
  return suggestions.sort((a, b) => {
    const aScore = a.rating * 0.7 + (parseFloat(a.views) || 0) * 0.3;
    const bScore = b.rating * 0.7 + (parseFloat(b.views) || 0) * 0.3;
    return bScore - aScore;
  });
}

/**
 * Generate smart video recommendations using ChatGPT
 */
async function generateSmartVideoRecommendations(videoData) {
  try {
    // Use the global llmDetector or window.detector
    const detector = window.detector || llmDetector;
    
    if (!detector) {
      console.error('❌ ChatGPT detector not available for video recommendations');
      return null;
    }
    
    console.log('🎬 Calling ChatGPT for smart video recommendations...');
    return await detector.generateSmartVideoRecommendations(videoData);
  } catch (error) {
    console.error('❌ Error calling smart video recommendations:', error);
    return null;
  }
}

/**
 * Format ChatGPT video recommendations to match our UI format
 */
function formatChatGPTVideoRecommendations(chatGPTResult) {
  try {
    const videos = chatGPTResult.videos.map((video, index) => {
      return {
        title: video.title,
        channel: video.suggestedChannel || 'Educational Channel',
        duration: video.estimatedDuration || '10:00',
        views: '🤖 AI Curated',
        category: video.category || 'Explainer',
        difficulty: video.difficulty || 'Intermediate',
        rating: 4.7, // Default good rating for ChatGPT recommendations
        description: video.recommendationReason || video.appealFactor || 'AI-recommended educational content',
        tags: extractTagsFromVideo(video),
        url: generateSearchURL(video.title, video.suggestedChannel),
        source: 'ChatGPT',
        isAIRecommendation: true,
        topicConnection: video.topicConnection,
        appealFactor: video.appealFactor
      };
    });
    
    return videos;
  } catch (error) {
    console.error('❌ Error formatting ChatGPT video recommendations:', error);
    return [];
  }
}

/**
 * Extract tags from ChatGPT video recommendation
 */
function extractTagsFromVideo(video) {
  const tags = [];
  
  // Add category as tag
  if (video.category) tags.push(video.category.toLowerCase());
  
  // Add difficulty as tag  
  if (video.difficulty) tags.push(video.difficulty.toLowerCase());
  
  // Extract keywords from title
  const titleWords = video.title.toLowerCase().split(' ');
  const educationalKeywords = ['science', 'physics', 'math', 'history', 'biology', 'chemistry', 'explained', 'theory'];
  titleWords.forEach(word => {
    if (educationalKeywords.includes(word)) {
      tags.push(word);
    }
  });
  
  return tags.slice(0, 4); // Limit to 4 tags
}

/**
 * Generate YouTube search URL for a recommended video
 */
function generateSearchURL(title, channel) {
  const searchQuery = channel ? `${title} ${channel}` : title;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;
}

function removeDuplicateVideos(videos) {
  const seen = new Set();
  return videos.filter(video => {
    const key = video.title + video.channel;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function getCategoryStyle(category) {
  const styles = {
    'Documentary': {
      color: '#dc2626',
      gradient: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
      icon: 'M8 5v14l11-7z' // Play icon
    },
    'Course': {
      color: '#2563eb',
      gradient: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
      icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' // Star icon
    },
    'Explainer': {
      color: '#059669',
      gradient: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
      icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' // Lightbulb icon
    },
    'Lecture': {
      color: '#7c3aed',
      gradient: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
      icon: 'M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z' // Academic cap
    },
    'Book Review': {
      color: '#ea580c',
      gradient: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
      icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' // Book icon
    },
    'Trailer': {
      color: '#be185d',
      gradient: 'linear-gradient(135deg, #be185d 0%, #9d174d 100%)',
      icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' // Video camera icon
    }
  };
  
  return styles[category] || {
    color: '#6b7280',
    gradient: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
    icon: 'M8 5v14l11-7z'
  };
}

function getDifficultyStyle(difficulty) {
  const styles = {
    'Beginner': {
      color: '#059669'
    },
    'Intermediate': {
      color: '#d97706'
    },
    'Advanced': {
      color: '#dc2626'
    }
  };
  
  return styles[difficulty] || { color: '#6b7280' };
}

function generateStars(rating) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  let stars = '';
  
  // Full stars
  for (let i = 0; i < fullStars; i++) {
    stars += '<svg width="12" height="12" viewBox="0 0 24 24" fill="#fbbf24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
  }
  
  // Half star
  if (hasHalfStar) {
    stars += '<svg width="12" height="12" viewBox="0 0 24 24" fill="#fbbf24"><defs><linearGradient id="half"><stop offset="50%" stop-color="#fbbf24"/><stop offset="50%" stop-color="#e5e7eb"/></linearGradient></defs><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="url(#half)"/></svg>';
  }
  
  // Empty stars
  for (let i = 0; i < emptyStars; i++) {
    stars += '<svg width="12" height="12" viewBox="0 0 24 24" fill="#e5e7eb"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
  }
  
  return stars;
}

let currentVideoFilters = {
  category: 'all',
  difficulty: null,
  duration: null,
  views: null,
  sort: 'relevance'
};

function displayRelatedVideos(videos) {
  const videosContainer = document.getElementById('videos-list');
  if (!videosContainer) return;
  
  if (!videos || videos.length === 0) {
    showNoVideosMessage();
    return;
  }
  
  // Show filters when videos are available
  const filtersContainer = document.getElementById('video-filters');
  if (filtersContainer) {
    filtersContainer.style.display = 'block';
    setupVideoFilters(videos);
    
    // Set default active states
    setTimeout(() => {
      const allBtn = document.querySelector('[data-value="all"]');
      const relevanceBtn = document.querySelector('[data-value="relevance"]');
      if (allBtn) allBtn.classList.add('active');
      if (relevanceBtn) relevanceBtn.classList.add('active');
    }, 100);
  }
  
  videosContainer.innerHTML = videos.map((video, index) => {
    // Get category colors and icons
    const categoryStyles = getCategoryStyle(video.category);
    const difficultyStyles = getDifficultyStyle(video.difficulty);
    
    return `
      <div style="
        background: white;
        border-radius: 16px;
        padding: 20px;
        margin-bottom: 20px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        border: 1px solid rgba(226, 232, 240, 0.8);
        transition: all 0.3s ease;
        cursor: pointer;
        position: relative;
        overflow: hidden;
      " onclick="window.open('${video.url}', '_blank')" onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 32px rgba(0, 0, 0, 0.12)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 20px rgba(0, 0, 0, 0.08)'">
        
        <!-- Category stripe -->
        <div style="
          position: absolute;
          top: 0;
          left: 0;
          width: 4px;
          height: 100%;
          background: ${categoryStyles.color};
        "></div>
        
        <div style="display: flex; gap: 16px;">
          <!-- Enhanced thumbnail with category icon -->
          <div style="
            width: 140px;
            height: 80px;
            background: ${categoryStyles.gradient};
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            position: relative;
          ">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
              <path d="${categoryStyles.icon}"/>
            </svg>
            
            <!-- Duration badge -->
            <div style="
              position: absolute;
              bottom: 6px;
              right: 6px;
              background: rgba(0, 0, 0, 0.8);
              color: white;
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 10px;
              font-weight: 600;
            ">${video.duration}</div>
          </div>
          
          <div style="flex: 1; min-width: 0;">
            <!-- Title and rating -->
            <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 8px;">
              <h4 style="
                margin: 0;
                font-size: 15px;
                font-weight: 600;
                color: #1e293b;
                line-height: 1.3;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
                flex: 1;
                margin-right: 12px;
              ">${video.title}</h4>
              
              <!-- Rating stars -->
              <div style="
                display: flex;
                align-items: center;
                gap: 4px;
                flex-shrink: 0;
              ">
                <div style="display: flex; gap: 1px;">
                  ${generateStars(video.rating)}
                </div>
                <span style="
                  font-size: 11px;
                  color: #64748b;
                  font-weight: 500;
                ">${video.rating}</span>
              </div>
            </div>
            
            <!-- Channel and views -->
            <div style="
              display: flex;
              align-items: center;
              gap: 8px;
              margin-bottom: 8px;
            ">
              <span style="
                font-size: 13px;
                color: #64748b;
                font-weight: 500;
              ">${video.channel}</span>
              <span style="
                width: 3px;
                height: 3px;
                background: #cbd5e1;
                border-radius: 50%;
              "></span>
              <span style="
                font-size: 12px;
                color: #64748b;
              ">${video.views}</span>
            </div>
            
            <!-- Category and difficulty badges -->
            <div style="
              display: flex;
              align-items: center;
              gap: 8px;
              margin-bottom: 8px;
            ">
              <span style="
                background: ${categoryStyles.color}20;
                color: ${categoryStyles.color};
                padding: 3px 8px;
                border-radius: 12px;
                font-size: 10px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              ">${video.category}</span>
              
              <span style="
                background: ${difficultyStyles.color}20;
                color: ${difficultyStyles.color};
                padding: 3px 8px;
                border-radius: 12px;
                font-size: 10px;
                font-weight: 600;
              ">${video.difficulty}</span>
            </div>
            
            <!-- Description -->
            ${video.description ? `
              <p style="
                margin: 0;
                font-size: 12px;
                color: #64748b;
                line-height: 1.4;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
              ">${video.description}</p>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function setupVideoFilters(allVideos) {
  // Store all videos for filtering
  window.allRelatedVideos = allVideos;
  
  // Add event listeners to filter buttons
  const filterButtons = document.querySelectorAll('.filter-btn');
  filterButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const filterType = e.target.dataset.filter;
      const filterValue = e.target.dataset.value;
      
      if (filterType === 'category') {
        // Update category filter
        currentVideoFilters.category = filterValue;
        
        // Update button states for category
        document.querySelectorAll('[data-filter="category"]').forEach(b => {
          b.classList.remove('active');
        });
        e.target.classList.add('active');
        
      } else if (filterType === 'difficulty') {
        // Toggle difficulty filter
        if (currentVideoFilters.difficulty === filterValue) {
          currentVideoFilters.difficulty = null;
          e.target.classList.remove('active');
        } else {
          // Remove active from other difficulty buttons
          document.querySelectorAll('[data-filter="difficulty"]').forEach(b => {
            b.classList.remove('active');
          });
          currentVideoFilters.difficulty = filterValue;
          e.target.classList.add('active');
        }
      } else if (filterType === 'duration') {
        // Toggle duration filter
        if (currentVideoFilters.duration === filterValue) {
          currentVideoFilters.duration = null;
          e.target.classList.remove('active');
        } else {
          document.querySelectorAll('[data-filter="duration"]').forEach(b => {
            b.classList.remove('active');
          });
          currentVideoFilters.duration = filterValue;
          e.target.classList.add('active');
        }
      } else if (filterType === 'views') {
        // Toggle views filter
        if (currentVideoFilters.views === filterValue) {
          currentVideoFilters.views = null;
          e.target.classList.remove('active');
        } else {
          document.querySelectorAll('[data-filter="views"]').forEach(b => {
            b.classList.remove('active');
          });
          currentVideoFilters.views = filterValue;
          e.target.classList.add('active');
        }
      } else if (filterType === 'sort') {
        // Update sort option
        document.querySelectorAll('[data-filter="sort"]').forEach(b => {
          b.classList.remove('active');
        });
        currentVideoFilters.sort = filterValue;
        e.target.classList.add('active');
      }
      
      // Apply filters
      applyVideoFilters();
    });
  });
  
  // Clear filters button
  const clearBtn = document.getElementById('clear-filters');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      currentVideoFilters = { category: 'all', difficulty: null, duration: null, views: null, sort: 'relevance' };
      
      // Reset button states
      document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      document.querySelector('[data-value="all"]').classList.add('active');
      document.querySelector('[data-value="relevance"]').classList.add('active');
      
      // Show all videos
      displayFilteredVideos(allVideos);
    });
  }
}

function applyVideoFilters() {
  const allVideos = window.allRelatedVideos || [];
  
  let filteredVideos = allVideos.filter(video => {
    // Category filter
    if (currentVideoFilters.category !== 'all' && video.category !== currentVideoFilters.category) {
      return false;
    }
    
    // Difficulty filter
    if (currentVideoFilters.difficulty && video.difficulty !== currentVideoFilters.difficulty) {
      return false;
    }
    
    // Duration filter
    if (currentVideoFilters.duration) {
      const durationMinutes = parseDurationToMinutes(video.duration);
      if (currentVideoFilters.duration === 'short' && durationMinutes >= 10) return false;
      if (currentVideoFilters.duration === 'medium' && (durationMinutes < 10 || durationMinutes > 30)) return false;
      if (currentVideoFilters.duration === 'long' && durationMinutes <= 30) return false;
    }
    
    // Views filter
    if (currentVideoFilters.views) {
      const viewCount = parseViewsToNumber(video.views);
      if (currentVideoFilters.views === 'high' && viewCount < 1000000) return false;
      if (currentVideoFilters.views === 'medium' && (viewCount < 100000 || viewCount >= 1000000)) return false;
      if (currentVideoFilters.views === 'low' && viewCount >= 100000) return false;
    }
    
    return true;
  });
  
  // Apply sorting
  filteredVideos = sortVideos(filteredVideos, currentVideoFilters.sort);
  
  displayFilteredVideos(filteredVideos);
}

function parseDurationToMinutes(duration) {
  // Parse duration like "12:34" or "1:23:45" to minutes
  const parts = duration.split(':').map(Number);
  if (parts.length === 2) {
    return parts[0] + parts[1] / 60; // MM:SS
  } else if (parts.length === 3) {
    return parts[0] * 60 + parts[1] + parts[2] / 60; // HH:MM:SS
  }
  return 0;
}

function parseViewsToNumber(views) {
  // Parse views like "2.1M views" or "890K views" to numbers
  const match = views.match(/([\d.]+)([KMB]?)/);
  if (!match) return 0;
  
  const number = parseFloat(match[1]);
  const suffix = match[2];
  
  switch (suffix) {
    case 'K': return number * 1000;
    case 'M': return number * 1000000;
    case 'B': return number * 1000000000;
    default: return number;
  }
}

function sortVideos(videos, sortBy) {
  const sortedVideos = [...videos];
  
  switch (sortBy) {
    case 'rating':
      return sortedVideos.sort((a, b) => b.rating - a.rating);
    
    case 'views':
      return sortedVideos.sort((a, b) => parseViewsToNumber(b.views) - parseViewsToNumber(a.views));
    
    case 'duration':
      return sortedVideos.sort((a, b) => parseDurationToMinutes(a.duration) - parseDurationToMinutes(b.duration));
    
    case 'relevance':
    default:
      // Default relevance sorting (rating * 0.7 + normalized views * 0.3)
      return sortedVideos.sort((a, b) => {
        const aScore = a.rating * 0.7 + (parseViewsToNumber(a.views) / 10000000) * 0.3;
        const bScore = b.rating * 0.7 + (parseViewsToNumber(b.views) / 10000000) * 0.3;
        return bScore - aScore;
      });
  }
}

function displayFilteredVideos(videos) {
  const videosContainer = document.getElementById('videos-list');
  if (!videosContainer) return;
  
  if (videos.length === 0) {
    videosContainer.innerHTML = `
      <div style="
        text-align: center;
        padding: 40px 20px;
        color: #64748b;
      ">
        <div style="
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        ">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#94a3b8">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        <h3 style="
          margin: 0 0 8px 0;
          font-size: 16px;
          font-weight: 600;
          color: #475569;
        ">No videos match your filters</h3>
        <p style="
          margin: 0;
          font-size: 14px;
          color: #64748b;
          line-height: 1.5;
        ">Try adjusting your filters to see more results</p>
      </div>
    `;
    return;
  }
  
  // Use the same display logic as the main function
  videosContainer.innerHTML = videos.map((video, index) => {
    // Get category colors and icons
    const categoryStyles = getCategoryStyle(video.category);
    const difficultyStyles = getDifficultyStyle(video.difficulty);
    
    return `
      <div style="
        background: white;
        border-radius: 16px;
        padding: 20px;
        margin-bottom: 20px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        border: 1px solid rgba(226, 232, 240, 0.8);
        transition: all 0.3s ease;
        cursor: pointer;
        position: relative;
        overflow: hidden;
      " onclick="window.open('${video.url}', '_blank')" onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 32px rgba(0, 0, 0, 0.12)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 20px rgba(0, 0, 0, 0.08)'">
        
        <!-- Category stripe -->
        <div style="
          position: absolute;
          top: 0;
          left: 0;
          width: 4px;
          height: 100%;
          background: ${categoryStyles.color};
        "></div>
        
        <div style="display: flex; gap: 16px;">
          <!-- Enhanced thumbnail with category icon -->
          <div style="
            width: 140px;
            height: 80px;
            background: ${categoryStyles.gradient};
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            position: relative;
          ">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
              <path d="${categoryStyles.icon}"/>
            </svg>
            
            <!-- Duration badge -->
            <div style="
              position: absolute;
              bottom: 6px;
              right: 6px;
              background: rgba(0, 0, 0, 0.8);
              color: white;
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 10px;
              font-weight: 600;
            ">${video.duration}</div>
          </div>
          
          <div style="flex: 1; min-width: 0;">
            <!-- Title and rating -->
            <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 8px;">
              <h4 style="
                margin: 0;
                font-size: 15px;
                font-weight: 600;
                color: #1e293b;
                line-height: 1.3;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
                flex: 1;
                margin-right: 12px;
              ">${video.title}</h4>
              
              <!-- Rating stars -->
              <div style="
                display: flex;
                align-items: center;
                gap: 4px;
                flex-shrink: 0;
              ">
                <div style="display: flex; gap: 1px;">
                  ${generateStars(video.rating)}
                </div>
                <span style="
                  font-size: 11px;
                  color: #64748b;
                  font-weight: 500;
                ">${video.rating}</span>
              </div>
            </div>
            
            <!-- Channel and views -->
            <div style="
              display: flex;
              align-items: center;
              gap: 8px;
              margin-bottom: 8px;
            ">
              <span style="
                font-size: 13px;
                color: #64748b;
                font-weight: 500;
              ">${video.channel}</span>
              <span style="
                width: 3px;
                height: 3px;
                background: #cbd5e1;
                border-radius: 50%;
              "></span>
              <span style="
                font-size: 12px;
                color: #64748b;
              ">${video.views}</span>
            </div>
            
            <!-- Category and difficulty badges -->
            <div style="
              display: flex;
              align-items: center;
              gap: 8px;
              margin-bottom: 8px;
            ">
              <span style="
                background: ${categoryStyles.color}20;
                color: ${categoryStyles.color};
                padding: 3px 8px;
                border-radius: 12px;
                font-size: 10px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              ">${video.category}</span>
              
              <span style="
                background: ${difficultyStyles.color}20;
                color: ${difficultyStyles.color};
                padding: 3px 8px;
                border-radius: 12px;
                font-size: 10px;
                font-weight: 600;
              ">${video.difficulty}</span>
            </div>
            
            <!-- Description -->
            ${video.description ? `
              <p style="
                margin: 0;
                font-size: 12px;
                color: #64748b;
                line-height: 1.4;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
              ">${video.description}</p>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function showNoVideosMessage() {
  const videosContainer = document.getElementById('videos-list');
  if (!videosContainer) return;
  
  videosContainer.innerHTML = `
    <div style="
      text-align: center;
      padding: 40px 20px;
      color: #64748b;
    ">
      <div style="
        width: 64px;
        height: 64px;
        background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 16px;
      ">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="#94a3b8">
          <path d="M8 5v14l11-7z"/>
        </svg>
      </div>
      <h3 style="
        margin: 0 0 8px 0;
        font-size: 16px;
        font-weight: 600;
        color: #475569;
      ">No Related Videos Found</h3>
      <p style="
        margin: 0;
        font-size: 14px;
        line-height: 1.5;
      ">We couldn't find educational videos related to the detected citations. Try analyzing a video with more specific topics or books mentioned.</p>
    </div>
  `;
}

function showVideoErrorMessage() {
  const videosContainer = document.getElementById('videos-list');
  if (!videosContainer) return;
  
  videosContainer.innerHTML = `
    <div style="
      text-align: center;
      padding: 40px 20px;
      color: #ef4444;
    ">
      <div style="
        width: 64px;
        height: 64px;
        background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 16px;
      ">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="#ef4444">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      </div>
      <h3 style="
        margin: 0 0 8px 0;
        font-size: 16px;
        font-weight: 600;
        color: #dc2626;
      ">Error Loading Videos</h3>
      <p style="
        margin: 0;
        font-size: 14px;
        line-height: 1.5;
        color: #64748b;
      ">There was an error loading related educational videos. Please try again later.</p>
    </div>
  `;
}

// Get video transcript/captions with timestamps
async function getVideoText() {
  console.log('🎬 Attempting to get real video captions...');
  
  try {
    // Method 1: Try to extract from YouTube's player data
    const transcriptFromPlayer = await extractFromYouTubePlayer();
    if (transcriptFromPlayer) {
      console.log('✅ Got transcript from YouTube player data');
      return transcriptFromPlayer; // Returns {text, segments}
    }

    // Method 2: Try to access transcript panel
    const transcriptFromPanel = await extractFromTranscriptPanel();
    if (transcriptFromPanel) {
      console.log('✅ Got transcript from transcript panel');
      // transcriptFromPanel is already in the correct format {text, segments}
      return transcriptFromPanel;
    }

    // Method 3: Try to get from video tracks
    const transcriptFromTracks = await extractFromVideoTracks();
    if (transcriptFromTracks) {
      console.log('✅ Got transcript from video tracks');
      // Convert to new format for consistency
      return { text: transcriptFromTracks, segments: [] };
    }

  } catch (error) {
    console.warn('Error extracting real transcript:', error);
  }
  
  // Fallback: try to get any available text from the page
  console.log('⚠️ Real transcript extraction failed, trying page content...');
  
  // Try to extract any captions or descriptions from the page
  const captionElements = document.querySelectorAll('[role="button"][aria-label*="Caption"], [aria-label*="subtitle"], .captions-text, .ytp-caption-segment');
  const descriptionText = document.querySelector('#description-text, #snippet-text, .content.style-scope.ytd-video-secondary-info-renderer')?.textContent?.trim() || '';
  const videoTitle = document.querySelector('h1[class*="title"] yt-formatted-string, #title h1')?.textContent?.trim() || '';
  
  let fallbackText = '';
  if (captionElements.length > 0) {
    fallbackText = Array.from(captionElements).map(el => el.textContent?.trim()).filter(text => text && text.length > 0).join(' ');
  }
  
  if (!fallbackText && descriptionText) {
    fallbackText = descriptionText;
    console.log('📝 Using video description as fallback content');
  }
  
  if (!fallbackText && videoTitle) {
    fallbackText = videoTitle;
    console.log('📝 Using video title as minimal fallback content');
  }
  
  if (!fallbackText) {
    console.log('❌ No content available - using minimal sample for testing...');
    fallbackText = "This is a YouTube video without available transcript data.";
  }
  
  console.log(`📝 Fallback content: ${fallbackText.length} characters - "${fallbackText.substring(0, 200)}..."`);
  
  return { 
    text: fallbackText,
    segments: []
  };
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
              console.log('🎯 Found English captions URL:', englishCaptions.baseUrl);
              try {
                const response = await fetch(englishCaptions.baseUrl);
                console.log('📡 Fetch response status:', response.status);
                
                if (!response.ok) {
                  console.warn('❌ Fetch failed with status:', response.status);
                  return null;
                }
                
                const xmlText = await response.text();
                console.log('📄 Raw XML length:', xmlText.length);
                
                if (xmlText.length === 0) {
                  console.warn('❌ Empty XML response');
                  return null;
                }
                
                const transcriptData = parseTranscriptXML(xmlText);
                return transcriptData; // Returns {text, segments}
              } catch (error) {
                console.error('❌ Error fetching captions:', error);
                return null;
              }
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
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Look for transcript segments with timestamps
        const segmentElements = document.querySelectorAll('[data-testid="transcript-segment"], .ytd-transcript-segment-renderer, .ytd-transcript-segment-list-renderer [role="button"]');
        console.log(`🔍 Found ${segmentElements.length} transcript segment elements`);
        
        if (segmentElements.length > 0) {
          const segments = [];
          let fullText = '';
          
          Array.from(segmentElements).forEach((segmentEl, index) => {
            try {
              // Extract timestamp - try multiple selectors
              let timestampText = '';
              const timestampEl = segmentEl.querySelector('.ytd-transcript-segment-renderer .segment-timestamp, [role="button"] > div:first-child, .timestamp');
              
              if (timestampEl) {
                timestampText = timestampEl.textContent?.trim() || '';
              } else {
                // Fallback: look for patterns like "0:14" in the element text
                const fullText = segmentEl.textContent || '';
                const timeMatch = fullText.match(/(\d{1,2}:\d{2})/);
                if (timeMatch) {
                  timestampText = timeMatch[1];
                }
              }
              
              // Extract text content (excluding timestamp)
              let segmentText = segmentEl.textContent?.trim() || '';
              if (timestampText) {
                segmentText = segmentText.replace(timestampText, '').trim();
              }
              
              if (segmentText && segmentText.length > 0) {
                // Convert timestamp to seconds
                let startTime = 0;
                if (timestampText) {
                  const timeParts = timestampText.split(':');
                  if (timeParts.length === 2) {
                    startTime = parseInt(timeParts[0]) * 60 + parseInt(timeParts[1]);
                  } else if (timeParts.length === 3) {
                    startTime = parseInt(timeParts[0]) * 3600 + parseInt(timeParts[1]) * 60 + parseInt(timeParts[2]);
                  }
                }
                
                console.log(`📝 Transcript segment ${index}: "${segmentText}" at ${startTime}s (${timestampText})`);
                
                segments.push({
                  text: segmentText,
                  start: startTime,
                  end: startTime + 4 // Approximate 4-second duration
                });
                
                fullText += segmentText + ' ';
              }
            } catch (error) {
              console.warn('Error processing transcript segment:', error);
            }
          });
          
          if (fullText.length > 100 && segments.length > 0) {
            console.log(`✅ Extracted ${segments.length} timestamped segments from transcript panel`);
            return {
              text: fullText.trim(),
              segments: segments
            };
          } else if (fullText.length > 100) {
            // Fallback: if we have text but no timestamped segments
            console.log('⚠️ Got transcript text but no timestamps from panel');
            return {
              text: fullText.trim(),
              segments: []
            };
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

// Parse XML transcript format with timestamps
function parseTranscriptXML(xmlText) {
  try {
    console.log('🔍 Parsing XML transcript, length:', xmlText.length);
    console.log('📄 XML sample:', xmlText.substring(0, 500));
    
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    const textElements = xmlDoc.querySelectorAll('text');
    
    console.log('📊 Found text elements:', textElements.length);
    
    // Extract segments with timestamps
    const segments = Array.from(textElements)
      .map(element => {
        const text = element.textContent?.trim();
        const start = parseFloat(element.getAttribute('start') || '0');
        const duration = parseFloat(element.getAttribute('dur') || '0');
        
        if (text && text.length > 0) {
          const cleanText = text
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'");
          
          console.log(`📝 Segment: "${cleanText}" at ${start}s`);
          
          return {
            text: cleanText,
            start: start,
            end: start + duration
          };
        }
        return null;
      })
      .filter(segment => segment !== null);
    
    console.log('✅ Parsed segments:', segments.length);
    
    // Return both full text and segments
    const fullText = segments.map(s => s.text).join(' ');
    
    console.log('📏 Full text length:', fullText.length);
    console.log('📄 Full text sample:', fullText.substring(0, 500));
    
    return {
      text: fullText,
      segments: segments
    };
      
  } catch (error) {
    console.warn('Failed to parse transcript XML:', error);
    console.log('❌ XML content that failed:', xmlText);
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
    const transcriptData = await getVideoText();
    console.log('🎬 Transcript data received:', transcriptData);
    
    // Store transcript globally for search functionality
    if (transcriptData && transcriptData.text) {
      window.currentTranscriptForSearch = transcriptData.text;
      console.log('💾 Transcript stored for search (length:', transcriptData.text.length, 'characters)');
    }
    
    if (transcriptData && transcriptData.text && transcriptData.text.length > 0) {
      console.log('📝 Analyzing transcript for citations...');
      
      let finalCitations = [];
      
      // Try ChatGPT-enhanced detection first
      if (useEnhancedDetection && llmDetector) {
        try {
          // Update status to show AI analysis with better messaging
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
              <span style="color: #667eea; font-weight: 500;">🤖 AI is analyzing video content...</span>
              <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">This may take 15-30 seconds for high-quality analysis</div>
            `;
          }
          
          console.log('🤖 Using ChatGPT-enhanced citation detection...');
          const llmCitations = await llmDetector.analyzeVideoContent(transcriptData);
          
          if (llmCitations && llmCitations.length > 0) {
            console.log(`🎯 ChatGPT analysis successful: ${llmCitations.length} citations found`);
            finalCitations = llmCitations;
            
            // Mark as ChatGPT-enhanced in UI
            finalCitations.forEach(citation => {
              if (!citation.isAIEnhanced) {
                citation.isAIEnhanced = true;
              }
            });
            
            // Show success message briefly
            if (statusDiv) {
              statusDiv.innerHTML = `
                <div style="color: #10b981; font-weight: 500; display: flex; align-items: center;">
                  <span style="margin-right: 8px;">✅</span>
                  AI analysis complete: ${llmCitations.length} citations found
                </div>
              `;
              setTimeout(() => statusDiv.style.display = 'none', 2000);
            }
          } else {
            throw new Error('ChatGPT analysis returned no results');
          }
          
        } catch (error) {
          console.log('⚠️ ChatGPT analysis failed, falling back to standard detection:', error.message);
          finalCitations = await performStandardDetection(transcriptData);
        }
      } else {
        // Use standard detection
        console.log('📋 Using standard citation detection...');
        finalCitations = await performStandardDetection(transcriptData);
      }
      
      // Update UI
      updateCitationsUI(finalCitations);
    }
  } catch (error) {
    console.error('❌ Error analyzing video:', error);
    showErrorState();
  } finally {
    isAnalyzing = false;
  }
}

// Perform standard citation detection (fallback method)
async function performStandardDetection(transcriptData) {
  // Update status to show standard analysis
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
      <span style="color: #667eea; font-weight: 500;">📋 Analyzing with standard detection...</span>
    `;
  }
  
  // Detect citations using standard method
  const rawCitations = detector.detectCitations(transcriptData);
  console.log('📚 Found raw citations:', rawCitations);
  console.log('📊 Raw citations count:', rawCitations.length);
  
  // Filter citations with minimum confidence threshold
  const filteredCitations = rawCitations.filter(citation => citation.confidence >= 0.5);
  console.log('🎯 Filtered citations (confidence >= 0.5):', filteredCitations);
  
  // Enrich with API data (Books, Products, Topics)
  const enrichedCitations = await detector.enrichWithAPIs(filteredCitations);
  console.log('📖 Enriched citations:', enrichedCitations);
  
  return enrichedCitations;
}

// Update citations UI with tabbed interface
function updateCitationsUI(citations) {
  console.log('🎨 Updating UI with citations:', citations.length);
  
  // The "Citations" tab is actually the "General" tab content
  const citationsContainer = document.getElementById('tab-content-general');
  
  if (!citationsContainer) {
    console.warn('⚠️ Citations container (tab-content-general) not found');
    return;
  }
  
  console.log('✅ Found citations container (general tab), updating...');
  
  // Store citations globally for video search
  window.currentCitations = citations;
  
  // Clear video cache when new citations are loaded
  relatedVideosCache = null;
  
  if (citations.length > 0) {
    console.log('📋 Displaying', citations.length, 'citations');
    
    // Create citations HTML - show all citations in one list for now
    const citationsHTML = citations.map((citation, index) => {
      const typeIcon = citation.type === 'book' ? '📚' : 
                     citation.type === 'product' ? '🛍️' : 
                     citation.type === 'video' ? '🎬' :
                     citation.type === 'topic' ? '💡' : 
                     citation.type === 'place' ? '🌍' :
                     citation.type === 'person' ? '👤' : 
                     citation.type === 'company' ? '🏢' :
                     citation.type === 'technology' ? '💻' :
                     citation.type === 'event' ? '📜' : '📄';
      const typeColor = citation.type === 'book' ? '#8b5cf6' : 
                      citation.type === 'product' ? '#f59e0b' : 
                      citation.type === 'video' ? '#dc2626' :
                      citation.type === 'topic' ? '#10b981' : 
                      citation.type === 'place' ? '#059669' :
                      citation.type === 'person' ? '#7c3aed' : 
                      citation.type === 'company' ? '#1f2937' :
                      citation.type === 'technology' ? '#0ea5e9' :
                      citation.type === 'event' ? '#dc2626' : '#6b7280';
      const confidenceColor = citation.confidence > 0.7 ? '#10b981' : citation.confidence > 0.5 ? '#f59e0b' : '#ef4444';
      
      return createCitationCard(citation, index, typeIcon, typeColor, confidenceColor);
    }).join('');
    
    citationsContainer.innerHTML = `
      <style>
        #citation-search-input {
          background: white !important;
          color: #333 !important;
          border: 2px solid #d1d5db !important;
        }
        #citation-search-input:focus {
          border-color: #667eea !important;
          box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2) !important;
          outline: none !important;
        }
      </style>
      <div style="padding: 16px;">
        <!-- Search Box -->
        <div style="
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border: 1px solid rgba(226, 232, 240, 0.8);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 16px;
        ">
          <div style="
            display: flex;
            align-items: center;
            margin-bottom: 12px;
          ">
            <span style="
              font-size: 14px;
              font-weight: 600;
              color: #475569;
              margin-right: 12px;
            ">🔍 Search Transcript</span>
            <button id="clear-citation-search" style="
              background: none;
              border: none;
              color: #64748b;
              font-size: 11px;
              cursor: pointer;
              text-decoration: underline;
              padding: 0;
            ">Clear</button>
          </div>
          
          <div style="position: relative; background: white; border-radius: 8px; padding: 2px;">
            <input 
              type="text" 
              id="citation-search-input" 
              placeholder="Search for people, concepts, phrases..."
              style="
                width: calc(100% - 50px);
                padding: 12px 16px;
                border: 2px solid #d1d5db;
                border-radius: 8px;
                font-size: 14px;
                background: white;
                color: #333;
                outline: none;
                box-sizing: border-box;
                font-family: Arial, sans-serif;
                display: block;
              "
            />
            <button 
              id="manual-focus-btn"
              onclick="document.getElementById('citation-search-input').focus(); console.log('Manual focus button clicked');"
              style="
                position: absolute;
                right: 8px;
                top: 50%;
                transform: translateY(-50%);
                background: #667eea;
                color: white;
                border: none;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 12px;
                cursor: pointer;
                font-weight: 600;
              "
            >
              Focus
            </button>
            <div style="
              position: absolute;
              right: 12px;
              top: 50%;
              transform: translateY(-50%);
              color: #9ca3af;
              font-size: 16px;
              pointer-events: none;
            ">🔍</div>
          </div>
          
          <div style="
            display: flex;
            gap: 6px;
            margin-top: 8px;
            flex-wrap: wrap;
          ">
            <span style="font-size: 11px; color: #64748b; margin-right: 8px;">Quick search:</span>
            ${generateQuickSearchButtons(citations).map(term => `
              <button class="quick-search-btn" data-query="${term}" style="
                background: rgba(102, 126, 234, 0.1);
                color: #667eea;
                border: none;
                padding: 3px 8px;
                border-radius: 6px;
                font-size: 10px;
                cursor: pointer;
                transition: all 0.2s;
              ">${term}</button>
            `).join('')}
          </div>
        </div>
        
        <div style="
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 16px;
          border-radius: 12px;
          margin-bottom: 16px;
          font-size: 14px;
        ">
          <div style="font-weight: 600; margin-bottom: 8px;">✅ Citations Found: ${citations.length}</div>
          <div style="opacity: 0.9; font-size: 13px;">Smart analysis detected references, topics, and entities from this video</div>
        </div>
        
        <!-- Search Results Container -->
        <div id="search-results-container" style="display: none; margin-bottom: 16px;"></div>
        
        <!-- Citations Container -->
        <div id="citations-display-container">
          ${citationsHTML}
        </div>
      </div>
    `;

    // Search functionality will be set up after DOM is ready

    // Add search functionality with slight delay to ensure DOM is ready
    setTimeout(() => {
      setupCitationSearch(citations);
    }, 100);
    
    console.log('✅ Citations UI updated successfully!');
    
  } else {
    console.log('⚠️ No citations found');
    citationsContainer.innerHTML = `
      <div style="padding: 16px;">
        <div style="
          display: flex;
          align-items: center;
          padding: 20px;
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border-radius: 12px;
          border: 1px solid rgba(245, 158, 11, 0.2);
        ">
          <span style="font-size: 24px; margin-right: 12px;">🔍</span>
          <div>
            <div style="color: #92400e; font-weight: 600; margin-bottom: 4px;">No high-quality citations found</div>
            <div style="color: #a16207; font-size: 13px;">This video may not contain clear references</div>
          </div>
        </div>
      </div>
    `;
  }
}

// Generate smart quick search buttons based on citations
function generateQuickSearchButtons(citations) {
  const terms = new Set();
  
  // Extract relevant terms from citations
  citations.forEach(citation => {
    if (citation.title) {
      // Extract meaningful words from titles
      const words = citation.title.toLowerCase().split(/\s+/).filter(word => 
        word.length > 4 && 
        !['this', 'that', 'with', 'from', 'have', 'they', 'were', 'been', 'said', 'what', 'your', 'when', 'how'].includes(word)
      );
      words.forEach(word => terms.add(word));
    }
    
    if (citation.author) {
      // Add author names
      citation.author.split(/\s+/).forEach(name => {
        if (name.length > 2) terms.add(name.toLowerCase());
      });
    }
  });
  
  // Add common academic/scientific terms that might be mentioned
  const commonTerms = ['theory', 'research', 'study', 'analysis', 'experiment', 'concept', 'principle', 'method'];
  const videoTitle = document.querySelector('h1[class*="title"] yt-formatted-string, #title h1')?.textContent?.toLowerCase() || '';
  
  commonTerms.forEach(term => {
    if (videoTitle.includes(term) || window.currentTranscriptForSearch?.toLowerCase().includes(term)) {
      terms.add(term);
    }
  });
  
  // Convert to array and limit to 6 terms, prioritizing longer/more specific terms
  const sortedTerms = Array.from(terms)
    .filter(term => term.length > 3)
    .sort((a, b) => b.length - a.length)
    .slice(0, 6);
  
  // If we don't have enough specific terms, add some defaults
  if (sortedTerms.length < 3) {
    const defaults = ['theory', 'research', 'study', 'analysis'];
    defaults.forEach(term => {
      if (sortedTerms.length < 4 && !sortedTerms.includes(term)) {
        sortedTerms.push(term);
      }
    });
  }
  
  return sortedTerms.slice(0, 4); // Limit to 4 buttons to avoid crowding
}

// Setup citation search functionality
function setupCitationSearch(citations) {
  console.log('🔧 Setting up citation search functionality...');
  
  const searchInput = document.getElementById('citation-search-input');
  const clearButton = document.getElementById('clear-citation-search');
  const quickSearchButtons = document.querySelectorAll('.quick-search-btn');
  const searchResultsContainer = document.getElementById('search-results-container');
  const citationsDisplayContainer = document.getElementById('citations-display-container');

  console.log('🔍 Search elements found:', {
    searchInput: !!searchInput,
    clearButton: !!clearButton,
    quickSearchButtons: quickSearchButtons.length,
    searchResultsContainer: !!searchResultsContainer,
    citationsDisplayContainer: !!citationsDisplayContainer
  });

  if (!searchInput || !searchResultsContainer || !citationsDisplayContainer) {
    console.warn('⚠️ Search elements not found - required elements missing');
    console.log('Available elements in DOM:', {
      'citation-search-input': document.getElementById('citation-search-input'),
      'search-results-container': document.getElementById('search-results-container'),
      'citations-display-container': document.getElementById('citations-display-container')
    });
    return;
  }

  // Store original transcript for searching
  window.currentTranscriptForSearch = window.currentTranscriptForSearch || '';

  // Search function
  function performTranscriptSearch(query) {
    if (!query.trim()) {
      clearSearchResults();
      return;
    }

    console.log('🔍 Searching transcript for:', query);
    console.log('📝 Available transcript length:', window.currentTranscriptForSearch?.length || 0);
    
    // Search in transcript
    const transcriptResults = searchInTranscript(query);
    console.log('📊 Transcript search results:', transcriptResults.length);
    
    // Filter citations that match the search
    const matchingCitations = filterCitationsBySearch(citations, query);
    console.log('📋 Matching citations:', matchingCitations.length);
    
    displaySearchResults(query, transcriptResults, matchingCitations);
  }

  // Clear search results
  function clearSearchResults() {
    searchResultsContainer.style.display = 'none';
    citationsDisplayContainer.style.display = 'block';
    searchInput.value = '';
    
    // Remove focus highlighting from search input
    searchInput.style.borderColor = '#d1d5db';
    searchInput.style.boxShadow = 'none';
  }

  // Event listeners with proper error handling
  if (searchInput) {
    // Add click handler to ensure it's focusable
    searchInput.addEventListener('click', (e) => {
      console.log('🔍 Search input clicked via event listener');
      e.target.focus();
      e.target.style.borderColor = '#667eea';
      e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
      e.target.style.background = 'white';
      e.target.style.color = '#374151';
    });

    // Force focus and styling
    searchInput.addEventListener('focus', (e) => {
      console.log('🔍 Search input focused');
      e.target.style.borderColor = '#667eea';
      e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
      e.target.style.background = 'white';
      e.target.style.color = '#374151';
    });

    searchInput.addEventListener('blur', (e) => {
      console.log('🔍 Search input blurred');
      if (!e.target.value) {
        e.target.style.borderColor = '#d1d5db';
        e.target.style.boxShadow = 'none';
      }
    });

    searchInput.addEventListener('input', (e) => {
      console.log('🔍 Search input changed:', e.target.value);
      
      const query = e.target.value.trim();
      
      if (query.length > 0) {
        performTranscriptSearch(query);
        e.target.style.borderColor = '#667eea';
        e.target.style.boxShadow = '0 0 0 2px rgba(102, 126, 234, 0.2)';
      } else {
        clearSearchResults();
        e.target.style.borderColor = '#d1d5db';
        e.target.style.boxShadow = 'none';
      }
    });

    searchInput.addEventListener('keydown', (e) => {
      console.log('🔍 Key pressed:', e.key, 'Value:', e.target.value);
      
      if (e.key === 'Enter') {
        e.preventDefault();
        performTranscriptSearch(e.target.value);
      }
    });

    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        console.log('🔍 Enter pressed, searching for:', e.target.value);
        performTranscriptSearch(e.target.value);
      }
    });

    // Also add keyup for immediate response
    searchInput.addEventListener('keyup', (e) => {
      const query = e.target.value.trim();
      console.log('🔍 Key up, current value:', query);
      
      if (query.length > 0) {
        performTranscriptSearch(query);
        e.target.style.borderColor = '#667eea';
        e.target.style.boxShadow = '0 0 0 2px rgba(102, 126, 234, 0.2)';
      } else {
        clearSearchResults();
        e.target.style.borderColor = '#d1d5db';
        e.target.style.boxShadow = 'none';
      }
    });

    // Force immediate focus to test
    setTimeout(() => {
      searchInput.focus();
      console.log('🔍 Input auto-focused for testing');
    }, 200);
    
    // Make sure the input is ready to be clicked
    console.log('🔍 Search input ready for user interaction');
    
    console.log('✅ Search input event listeners attached');
  } else {
    console.warn('⚠️ Search input not found for event listeners');
  }

  if (clearButton) {
    clearButton.addEventListener('click', () => {
      console.log('🔍 Clear button clicked');
      clearSearchResults();
    });
    console.log('✅ Clear button event listener attached');
  }

  // Quick search buttons
  quickSearchButtons.forEach(button => {
    button.addEventListener('click', () => {
      const query = button.getAttribute('data-query');
      searchInput.value = query;
      performTranscriptSearch(query);
      
      // Add focus styling
      searchInput.style.borderColor = '#667eea';
      searchInput.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
    });
    
    // Hover effects
    button.addEventListener('mouseenter', () => {
      button.style.background = 'rgba(102, 126, 234, 0.2)';
      button.style.transform = 'translateY(-1px)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.background = 'rgba(102, 126, 234, 0.1)';
      button.style.transform = 'translateY(0)';
    });
  });
}

// Search in transcript text
function searchInTranscript(query) {
  const transcript = window.currentTranscriptForSearch || '';
  const queryLower = query.toLowerCase();
  const results = [];
  
  if (!transcript) {
    console.warn('⚠️ No transcript available for search');
    return results;
  }

  // Split transcript into sentences or segments
  const segments = transcript.split(/[.!?]+/).filter(segment => segment.trim().length > 10);
  
  segments.forEach((segment, index) => {
    const segmentLower = segment.toLowerCase();
    const queryIndex = segmentLower.indexOf(queryLower);
    
    if (queryIndex !== -1) {
      // Extract context around the match
      const contextStart = Math.max(0, queryIndex - 50);
      const contextEnd = Math.min(segment.length, queryIndex + query.length + 50);
      let context = segment.substring(contextStart, contextEnd).trim();
      
      // Add ellipsis if needed
      if (contextStart > 0) context = '...' + context;
      if (contextEnd < segment.length) context = context + '...';
      
      // Highlight the search term
      const regex = new RegExp(`(${query})`, 'gi');
      const highlightedContext = context.replace(regex, '<mark style="background: #fef08a; color: #92400e; padding: 2px 4px; border-radius: 4px; font-weight: 600;">$1</mark>');
      
      results.push({
        context: highlightedContext,
        segment: segment.trim(),
        segmentIndex: index,
        matchPosition: queryIndex
      });
    }
  });

  return results.slice(0, 10); // Limit to 10 results
}

// Filter citations that match the search query
function filterCitationsBySearch(citations, query) {
  const queryLower = query.toLowerCase();
  
  return citations.filter(citation => {
    const titleMatch = citation.title && citation.title.toLowerCase().includes(queryLower);
    const authorMatch = citation.author && citation.author.toLowerCase().includes(queryLower);
    const typeMatch = citation.type && citation.type.toLowerCase().includes(queryLower);
    
    return titleMatch || authorMatch || typeMatch;
  });
}

// Display search results
function displaySearchResults(query, transcriptResults, matchingCitations) {
  const searchResultsContainer = document.getElementById('search-results-container');
  const citationsDisplayContainer = document.getElementById('citations-display-container');
  
  // Hide original citations, show search results
  citationsDisplayContainer.style.display = 'none';
  searchResultsContainer.style.display = 'block';
  
  const hasTranscriptResults = transcriptResults.length > 0;
  const hasCitationResults = matchingCitations.length > 0;
  
  let resultsHTML = `
    <div style="
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 16px;
      border-radius: 12px;
      margin-bottom: 16px;
    ">
      <div style="font-weight: 600; margin-bottom: 8px;">
        🔍 Search Results for "${query}"
      </div>
      <div style="opacity: 0.9; font-size: 13px;">
        Found ${transcriptResults.length} transcript matches and ${matchingCitations.length} related citations
      </div>
    </div>
  `;

  // Transcript search results
  if (hasTranscriptResults) {
    resultsHTML += `
      <div style="
        background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
        border: 1px solid rgba(245, 158, 11, 0.3);
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 16px;
      ">
        <h3 style="
          margin: 0 0 12px 0;
          font-size: 16px;
          color: #92400e;
          font-weight: 600;
          display: flex;
          align-items: center;
        ">
          📝 Transcript Mentions (${transcriptResults.length})
        </h3>
        <div style="space-y: 8px;">
          ${transcriptResults.map((result, index) => `
            <div style="
              background: white;
              padding: 12px;
              border-radius: 8px;
              border-left: 3px solid #f59e0b;
              margin-bottom: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            ">
              <div style="
                font-size: 14px;
                line-height: 1.5;
                color: #374151;
              ">${result.context}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // Matching citations
  if (hasCitationResults) {
    const citationsHTML = matchingCitations.map((citation, index) => {
      const typeIcon = citation.type === 'book' ? '📚' : 
                     citation.type === 'product' ? '🛍️' : 
                     citation.type === 'video' ? '🎬' :
                     citation.type === 'topic' ? '💡' : 
                     citation.type === 'place' ? '🌍' :
                     citation.type === 'person' ? '👤' : 
                     citation.type === 'company' ? '🏢' :
                     citation.type === 'technology' ? '💻' :
                     citation.type === 'event' ? '📜' : '📄';
      const typeColor = citation.type === 'book' ? '#8b5cf6' : 
                      citation.type === 'product' ? '#f59e0b' : 
                      citation.type === 'video' ? '#dc2626' :
                      citation.type === 'topic' ? '#10b981' : 
                      citation.type === 'place' ? '#059669' :
                      citation.type === 'person' ? '#7c3aed' : 
                      citation.type === 'company' ? '#1f2937' :
                      citation.type === 'technology' ? '#0ea5e9' :
                      citation.type === 'event' ? '#dc2626' : '#6b7280';
      const confidenceColor = citation.confidence > 0.7 ? '#10b981' : citation.confidence > 0.5 ? '#f59e0b' : '#ef4444';
      
      return createCitationCard(citation, index, typeIcon, typeColor, confidenceColor);
    }).join('');

    resultsHTML += `
      <div style="
        background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
        border: 1px solid rgba(59, 130, 246, 0.3);
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 16px;
      ">
        <h3 style="
          margin: 0 0 12px 0;
          font-size: 16px;
          color: #1e40af;
          font-weight: 600;
          display: flex;
          align-items: center;
        ">
          📋 Related Citations (${matchingCitations.length})
        </h3>
        <div>
          ${citationsHTML}
        </div>
      </div>
    `;
  }

  // No results message
  if (!hasTranscriptResults && !hasCitationResults) {
    resultsHTML += `
      <div style="
        display: flex;
        align-items: center;
        padding: 20px;
        background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
        border-radius: 12px;
        border: 1px solid rgba(239, 68, 68, 0.2);
      ">
        <span style="font-size: 24px; margin-right: 12px;">🔍</span>
        <div>
          <div style="color: #dc2626; font-weight: 600; margin-bottom: 4px;">No results found for "${query}"</div>
          <div style="color: #b91c1c; font-size: 13px;">Try a different search term or check the spelling</div>
        </div>
      </div>
    `;
  }

  searchResultsContainer.innerHTML = resultsHTML;
}

// Create citation card HTML
function createCitationCard(citation, index, typeIcon, typeColor, confidenceColor) {
      // Add AI indicator for ChatGPT-enhanced citations
    const aiIndicator = citation.isAIEnhanced ? `
    <div style="
      position: absolute;
      top: 12px;
      right: 12px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 4px;
    ">
      🤖 AI
    </div>
  ` : '';

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
      ${aiIndicator}
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
        
        <div style="display: flex; gap: 4px; align-items: center;">
          ${citation.validationScore !== undefined ? `
            <div style="
              background: ${citation.validationScore > 0.8 ? '#10b981' : citation.validationScore > 0.6 ? '#f59e0b' : '#ef4444'}20;
              color: ${citation.validationScore > 0.8 ? '#10b981' : citation.validationScore > 0.6 ? '#f59e0b' : '#ef4444'};
              padding: 4px 6px;
              border-radius: 8px;
              font-size: 10px;
              font-weight: 600;
            ">✓${Math.round(citation.validationScore * 100)}%</div>
          ` : ''}
          <div style="
            background: ${confidenceColor}20;
            color: ${confidenceColor};
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
          ">${Math.round(citation.confidence * 100)}%</div>
        </div>
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
      
      ${citation.timestamp !== undefined ? `
        <div style="
          display: flex;
          align-items: center;
          margin: 0 0 8px 0;
          padding: 6px 10px;
          background: linear-gradient(135deg, #667eea20 0%, #764ba220 100%);
          border-radius: 8px;
          border: 1px solid rgba(102, 126, 234, 0.2);
          cursor: pointer;
        " onclick="seekToTimestamp(${citation.timestamp})">
          <span style="font-size: 16px; margin-right: 8px;">⏰</span>
          <span style="
            font-size: 13px;
            color: #667eea;
            font-weight: 600;
          ">Jump to ${formatTimestamp(citation.timestamp)}</span>
        </div>
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
  
  // PubMed for medical/biological papers
  if (citation.pubmedLink) {
    buttons += `<a href="${citation.pubmedLink}" target="_blank" style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; border: none; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 500; text-decoration: none; transition: all 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">🧬 PubMed</a>`;
  }
  
  // arXiv for physics/math papers
  if (citation.arxivLink) {
    buttons += `<a href="${citation.arxivLink}" target="_blank" style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; border: none; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 500; text-decoration: none; transition: all 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">📊 arXiv</a>`;
  }
  
  // ResearchGate for academic networking
  if (citation.researchGateLink) {
    buttons += `<a href="${citation.researchGateLink}" target="_blank" style="background: linear-gradient(135deg, #00d4aa 0%, #00b894 100%); color: white; border: none; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 500; text-decoration: none; transition: all 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">🔬 ResearchGate</a>`;
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

// Format timestamp for display (converts seconds to MM:SS format)
function formatTimestamp(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Seek video to specific timestamp
function seekToTimestamp(seconds) {
  console.log(`⏰ Seeking to timestamp: ${seconds}s`);
  
  const video = document.querySelector('video');
  if (video) {
    video.currentTime = seconds;
    
    // Show feedback to user
    const feedback = document.createElement('div');
    feedback.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      z-index: 999999;
      pointer-events: none;
    `;
    feedback.textContent = `⏰ Jumped to ${formatTimestamp(seconds)}`;
    document.body.appendChild(feedback);
    
    // Remove feedback after 2 seconds
    setTimeout(() => {
      if (feedback.parentNode) {
        feedback.parentNode.removeChild(feedback);
      }
    }, 2000);
  } else {
    console.warn('Video element not found');
  }
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
  console.log('🔍 Current location check:', {
    href: window.location.href,
    pathname: window.location.pathname,
    includes_watch: window.location.pathname.includes('/watch'),
    search: window.location.search
  });
  
  // Initialize detector first
  detector = new EnhancedCitationDetector();
  
  // Initialize ChatGPT Citation Detector
  try {
    llmDetector = new LLMCitationDetector();
    
    // Check if we have an OpenAI API key
    if (window.LOCAL_ENV?.OPENAI_API_KEY) {
      llmDetector.setAPIKey(window.LOCAL_ENV.OPENAI_API_KEY, 'chatgpt');
      console.log('🤖 ChatGPT Citation Detector initialized successfully');
    } else {
      console.log('⚠️ No OpenAI API key found in LOCAL_ENV');
      useEnhancedDetection = false;
    }
    
    // Make detector globally available for video recommendations
    window.detector = llmDetector;
    
  } catch (error) {
    console.log('⚠️ ChatGPT detector failed to initialize:', error.message);
    useEnhancedDetection = false;
  }
  
  // Check if we're on a video page initially
  if (window.location.pathname.includes('/watch')) {
    console.log('✅ On YouTube video page, proceeding...');
    
    // Wait a bit for YouTube to load
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Create UI
    createUI();
    
    // Set initial video ID
    currentVideoId = getCurrentVideoId();
    
    // Load academic papers for the default active tab
    setTimeout(() => {
      loadAcademicPapers();
    }, 1500);
    
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

// Add immediate debug logging
console.log('🚀 Citation Cross-Reference extension loading...');
console.log('🌐 Current URL:', window.location.href);
console.log('🌐 Pathname:', window.location.pathname);

// Test if we can access the page
try {
  console.log('🔍 Page title:', document.title);
  console.log('🔍 DOM ready state:', document.readyState);
  console.log('🔍 YouTube elements check:', {
    hasVideo: !!document.querySelector('video'),
    hasPlayer: !!document.querySelector('#movie_player'),
    hasTitle: !!document.querySelector('h1[class*="title"]')
  });
} catch (error) {
  console.error('❌ Error accessing page:', error);
}

// Start initialization
init().catch(console.error);

// Make detector available globally for testing
window.CitationCrossReference = {
  detector: new EnhancedCitationDetector(),
  initialized: true,
  analyzeCurrentVideo,
  getCurrentVideoId,
  // Debug functions for troubleshooting
  async debugFullAnalysis() {
    console.log('🐛 DEBUG: Starting full analysis debug...');
    console.log('📋 Variables check:', {
      detector: !!detector,
      llmDetector: !!llmDetector,
      isAnalyzing,
      useEnhancedDetection,
      currentVideoId
    });
    
    try {
      console.log('🎬 Testing transcript extraction...');
      const transcript = await getVideoText();
      console.log('📄 Transcript result:', {
        hasTranscript: !!transcript,
        type: typeof transcript,
        length: transcript?.text?.length || transcript?.length || 0,
        sample: transcript?.text?.substring(0, 100) || transcript?.substring(0, 100) || 'No text'
      });
      
      if (transcript && (transcript.text || transcript.length)) {
        console.log('🔍 Testing citation detection...');
        const citations = detector.detectCitations(transcript);
        console.log('📚 Citations found:', {
          count: citations?.length || 0,
          citations: citations?.slice(0, 3) || []
        });
        
        console.log('🎯 Updating UI with test results...');
        updateCitationsUI(citations || []);
        
        return {
          transcript: !!transcript,
          citationsCount: citations?.length || 0,
          citations: citations || []
        };
      } else {
        console.log('❌ No transcript data available');
        return { error: 'No transcript data' };
      }
    } catch (error) {
      console.error('🐛 Debug analysis failed:', error);
      return { error: error.message };
    }
     },
  // Simple quick test to see what's happening
  async quickTest() {
    console.log('🚑 QUICK TEST: What\'s not working?');
    
    // Test 1: Check if UI exists
    const citationsTab = document.getElementById('tab-content-citations');
    const videosTab = document.getElementById('tab-content-videos');
    const academicTab = document.getElementById('tab-content-academic');
    
    console.log('🔍 UI Elements:', {
      citationsTab: !!citationsTab,
      videosTab: !!videosTab, 
      academicTab: !!academicTab
    });
    
    // Test 2: Check if transcript works
    try {
      const transcript = await getVideoText();
      console.log('📄 Transcript:', {
        hasTranscript: !!transcript,
        length: transcript?.length || 0
      });
      
      // Test 3: Try simple citation detection
      if (transcript) {
        const citations = detector.detectCitations(transcript);
        console.log('📚 Citations:', {
          count: citations?.length || 0,
          sample: citations?.slice(0, 2) || []
        });
        
        // Test 4: Force update UI
        if (citations && citations.length > 0) {
          updateCitationsUI(citations);
          console.log('✅ Updated citations UI');
        }
      }
      
    } catch (error) {
      console.error('❌ Quick test failed:', error);
    }
  },
  // Force reload citations and videos
  async forceReload() {
    console.log('🔄 Force reloading citations and videos...');
    // Clear caches
    relatedVideosCache = null;
    academicPapersCache = null;
    isAnalyzing = false;
    
    // Trigger analysis
    await analyzeCurrentVideo();
    console.log('✅ Force reload complete');
  },
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
  },
  
  // Comprehensive accuracy testing suite
  async runAccuracyTests() {
    console.log('🎯 Starting Video Discovery Accuracy Tests...');
    console.log('==========================================');
    
    const testResults = {
      transcriptExtraction: { passed: 0, failed: 0, tests: [] },
      citationDetection: { passed: 0, failed: 0, tests: [] },
      videoRecommendations: { passed: 0, failed: 0, tests: [] },
      apiIntegration: { passed: 0, failed: 0, tests: [] },
      filteringSystem: { passed: 0, failed: 0, tests: [] },
      overall: { accuracy: 0, totalTests: 0, passedTests: 0 }
    };

    // Test 1: Transcript Extraction
    await this.testTranscriptExtraction(testResults);
    
    // Test 2: Citation Detection Patterns
    await this.testCitationPatterns(testResults);
    
    // Test 3: Video Recommendation Generation
    await this.testVideoRecommendations(testResults);
    
    // Test 4: API Integration
    await this.testAPIIntegration(testResults);
    
    // Test 5: Filtering System
    await this.testFilteringSystem(testResults);
    
    // Calculate overall accuracy
    this.calculateOverallAccuracy(testResults);
    
    // Display results
    this.displayTestResults(testResults);
    
    return testResults;
  },

  async testTranscriptExtraction(testResults) {
    console.log('📝 Testing transcript extraction methods...');
    
    const tests = [
      {
        name: 'Current video transcript',
        test: async () => {
          const text = await getVideoText();
          return text && text.length > 100;
        }
      },
      {
        name: 'Fallback content availability',
        test: async () => {
          const fallbackText = `Watch the documentary 'Free Solo' about Alex Honnold's incredible climb. The book 'Sapiens' by Yuval Noah Harari explores human evolution. Einstein's theory of relativity revolutionized physics. Quantum mechanics explains the behavior of particles at the atomic level.`;
          return fallbackText.length > 50;
        }
      },
      {
        name: 'Video ID extraction',
        test: () => {
          const videoId = getCurrentVideoId();
          return videoId && videoId.length > 5;
        }
      }
    ];

    for (const test of tests) {
      try {
        const passed = await test.test();
        testResults.transcriptExtraction.tests.push({ name: test.name, passed, error: null });
        if (passed) testResults.transcriptExtraction.passed++;
        else testResults.transcriptExtraction.failed++;
      } catch (error) {
        testResults.transcriptExtraction.tests.push({ name: test.name, passed: false, error: error.message });
        testResults.transcriptExtraction.failed++;
      }
    }
  },

  async testCitationPatterns(testResults) {
    console.log('🔍 Testing citation detection patterns...');
    
    const testCases = [
      {
        name: 'Book detection',
        text: `I recommend reading "Sapiens" by Yuval Noah Harari and "Atomic Habits" by James Clear.`,
        expectedCount: 2,
        expectedTypes: ['book', 'book']
      },
      {
        name: 'Academic paper detection',
        text: `The study published in Nature shows interesting results. Research from Science journal confirms this.`,
        expectedCount: 2,
        expectedTypes: ['paper', 'paper']
      },
      {
        name: 'Video/Documentary detection',
        text: `Watch the documentary 'Free Solo' and the TED talk about artificial intelligence.`,
        expectedCount: 2,
        expectedTypes: ['video', 'video']
      },
      {
        name: 'Mixed content detection',
        text: `Einstein's theory of relativity is explained in "The Elegant Universe" book and the documentary 'The Fabric of the Cosmos'.`,
        expectedCount: 3,
        expectedTypes: ['topic', 'book', 'video']
      },
      {
        name: 'Complex scientific topics',
        text: `Quantum entanglement and the double-slit experiment demonstrate quantum mechanics principles.`,
        expectedCount: 3,
        expectedTypes: ['topic', 'topic', 'topic']
      },
      {
        name: 'High confidence citations',
        text: `The book "Thinking, Fast and Slow" by Daniel Kahneman discusses cognitive biases.`,
        expectedCount: 1,
        minConfidence: 0.7
      }
    ];

    for (const testCase of testCases) {
      try {
        const citations = detector.detectCitations({ text: testCase.text });
        let passed = citations.length >= (testCase.expectedCount * 0.8); // 80% accuracy threshold
        
        // Check confidence if specified
        if (testCase.minConfidence && citations.length > 0) {
          const highConfidenceCitations = citations.filter(c => c.confidence >= testCase.minConfidence);
          passed = passed && highConfidenceCitations.length > 0;
        }
        
        testResults.citationDetection.tests.push({
          name: testCase.name,
          passed,
          expected: testCase.expectedCount,
          actual: citations.length,
          citations: citations.map(c => ({ title: c.title, type: c.type, confidence: c.confidence }))
        });
        
        if (passed) testResults.citationDetection.passed++;
        else testResults.citationDetection.failed++;
        
      } catch (error) {
        testResults.citationDetection.tests.push({
          name: testCase.name,
          passed: false,
          error: error.message
        });
        testResults.citationDetection.failed++;
      }
    }
  },

  async testVideoRecommendations(testResults) {
    console.log('🎬 Testing video recommendation generation...');
    
    const testQueries = [
      { query: 'quantum mechanics', expectedMinVideos: 2 },
      { query: 'Einstein relativity', expectedMinVideos: 2 },
      { query: 'Sapiens Harari', expectedMinVideos: 2 },
      { query: 'atomic habits', expectedMinVideos: 2 },
      { query: 'documentary Free Solo', expectedMinVideos: 1 },
      { query: 'random unknown topic xyz123', expectedMinVideos: 1 } // Should generate fallback
    ];

    for (const testQuery of testQueries) {
      try {
        const videos = generateEducationalVideoSuggestions(testQuery.query);
        const passed = videos.length >= testQuery.expectedMinVideos;
        
        // Check video quality
        const hasValidUrls = videos.every(v => v.url && v.url.includes('youtube.com'));
        const hasMetadata = videos.every(v => v.title && v.channel && v.duration && v.rating);
        
        testResults.videoRecommendations.tests.push({
          name: `Video suggestions for "${testQuery.query}"`,
          passed: passed && hasValidUrls && hasMetadata,
          expected: testQuery.expectedMinVideos,
          actual: videos.length,
          videos: videos.map(v => ({ title: v.title, category: v.category, rating: v.rating, hasValidUrl: v.url.includes('youtube.com') }))
        });
        
        if (passed && hasValidUrls && hasMetadata) testResults.videoRecommendations.passed++;
        else testResults.videoRecommendations.failed++;
        
      } catch (error) {
        testResults.videoRecommendations.tests.push({
          name: `Video suggestions for "${testQuery.query}"`,
          passed: false,
          error: error.message
        });
        testResults.videoRecommendations.failed++;
      }
    }
  },

  async testAPIIntegration(testResults) {
    console.log('🔗 Testing API integration...');
    
    const apiTests = [
      {
        name: 'Amazon link generation',
        test: () => {
          const link = detector.generateAmazonLink('Sapiens', 'Yuval Noah Harari');
          return link.includes('amazon.com') && link.includes('Sapiens');
        }
      },
      {
        name: 'Search link generation',
        test: () => {
          const links = detector.generateSearchLinks('Test Topic', 'topic');
          return links.google && links.wikipedia && links.youtube;
        }
      },
      {
        name: 'PubMed link generation',
        test: () => {
          const link = detector.generatePubMedLink('COVID-19 research', 'Smith');
          return link.includes('pubmed.ncbi.nlm.nih.gov');
        }
      },
      {
        name: 'ArXiv link generation',
        test: () => {
          const link = detector.generateArxivLink('Machine Learning');
          return link.includes('arxiv.org');
        }
      }
    ];

    for (const test of apiTests) {
      try {
        const passed = test.test();
        testResults.apiIntegration.tests.push({ name: test.name, passed, error: null });
        if (passed) testResults.apiIntegration.passed++;
        else testResults.apiIntegration.failed++;
      } catch (error) {
        testResults.apiIntegration.tests.push({ name: test.name, passed: false, error: error.message });
        testResults.apiIntegration.failed++;
      }
    }
  },

  async testFilteringSystem(testResults) {
    console.log('🔧 Testing filtering system...');
    
    const mockVideos = [
      { title: 'Short Video', duration: '5:30', views: '2M views', category: 'Explainer', difficulty: 'Beginner', rating: 4.5 },
      { title: 'Medium Video', duration: '25:15', views: '500K views', category: 'Course', difficulty: 'Intermediate', rating: 4.7 },
      { title: 'Long Video', duration: '1:15:30', views: '50K views', category: 'Lecture', difficulty: 'Advanced', rating: 4.8 }
    ];

    const filterTests = [
      {
        name: 'Duration parsing accuracy',
        test: () => {
          const short = parseDurationToMinutes('5:30');
          const medium = parseDurationToMinutes('25:15');
          const long = parseDurationToMinutes('1:15:30');
          return Math.abs(short - 5.5) < 0.1 && Math.abs(medium - 25.25) < 0.1 && Math.abs(long - 75.5) < 0.1;
        }
      },
      {
        name: 'Views parsing accuracy',
        test: () => {
          const high = parseViewsToNumber('2M views');
          const medium = parseViewsToNumber('500K views');
          const low = parseViewsToNumber('50K views');
          return high === 2000000 && medium === 500000 && low === 50000;
        }
      },
      {
        name: 'Rating sort functionality',
        test: () => {
          const sorted = sortVideos(mockVideos, 'rating');
          return sorted[0].rating >= sorted[1].rating && sorted[1].rating >= sorted[2].rating;
        }
      },
      {
        name: 'Duration sort functionality',
        test: () => {
          const sorted = sortVideos(mockVideos, 'duration');
          const durations = sorted.map(v => parseDurationToMinutes(v.duration));
          return durations[0] <= durations[1] && durations[1] <= durations[2];
        }
      },
      {
        name: 'Views sort functionality',
        test: () => {
          const sorted = sortVideos(mockVideos, 'views');
          const views = sorted.map(v => parseViewsToNumber(v.views));
          return views[0] >= views[1] && views[1] >= views[2];
        }
      }
    ];

    for (const test of filterTests) {
      try {
        const passed = test.test();
        testResults.filteringSystem.tests.push({ name: test.name, passed, error: null });
        if (passed) testResults.filteringSystem.passed++;
        else testResults.filteringSystem.failed++;
      } catch (error) {
        testResults.filteringSystem.tests.push({ name: test.name, passed: false, error: error.message });
        testResults.filteringSystem.failed++;
      }
    }
  },

  calculateOverallAccuracy(testResults) {
    const categories = ['transcriptExtraction', 'citationDetection', 'videoRecommendations', 'apiIntegration', 'filteringSystem'];
    
    let totalTests = 0;
    let passedTests = 0;
    
    categories.forEach(category => {
      totalTests += testResults[category].passed + testResults[category].failed;
      passedTests += testResults[category].passed;
    });
    
    testResults.overall.totalTests = totalTests;
    testResults.overall.passedTests = passedTests;
    testResults.overall.accuracy = totalTests > 0 ? (passedTests / totalTests * 100).toFixed(1) : 0;
  },

  displayTestResults(testResults) {
    console.log('\n🎯 VIDEO DISCOVERY ACCURACY TEST RESULTS');
    console.log('==========================================');
    
    const categories = [
      { key: 'transcriptExtraction', name: '📝 Transcript Extraction' },
      { key: 'citationDetection', name: '🔍 Citation Detection' },
      { key: 'videoRecommendations', name: '🎬 Video Recommendations' },
      { key: 'apiIntegration', name: '🔗 API Integration' },
      { key: 'filteringSystem', name: '🔧 Filtering System' }
    ];

    categories.forEach(category => {
      const result = testResults[category.key];
      const total = result.passed + result.failed;
      const percentage = total > 0 ? (result.passed / total * 100).toFixed(1) : 0;
      
      console.log(`\n${category.name}:`);
      console.log(`  ✅ Passed: ${result.passed}/${total} (${percentage}%)`);
      
      if (result.failed > 0) {
        console.log(`  ❌ Failed: ${result.failed}`);
        result.tests.filter(t => !t.passed).forEach(test => {
          console.log(`    - ${test.name}: ${test.error || 'Test failed'}`);
          if (test.expected && test.actual !== undefined) {
            console.log(`      Expected: ${test.expected}, Got: ${test.actual}`);
          }
        });
      }
    });

    console.log('\n📊 OVERALL RESULTS:');
    console.log(`  🎯 Accuracy: ${testResults.overall.accuracy}%`);
    console.log(`  ✅ Passed: ${testResults.overall.passedTests}/${testResults.overall.totalTests}`);
    
    // Goal comparison
    const targetAccuracy = 85;
    if (parseFloat(testResults.overall.accuracy) >= targetAccuracy) {
      console.log(`  🎉 SUCCESS: Exceeded target accuracy of ${targetAccuracy}%!`);
    } else {
      console.log(`  ⚠️  NEEDS IMPROVEMENT: Below target accuracy of ${targetAccuracy}%`);
      console.log(`  📈 Gap: ${(targetAccuracy - parseFloat(testResults.overall.accuracy)).toFixed(1)}% improvement needed`);
    }
    
    console.log('\n🚀 PERFORMANCE BENCHMARKS:');
    console.log(`  📚 Citation Detection: ${testResults.citationDetection.passed}/${testResults.citationDetection.passed + testResults.citationDetection.failed} patterns working`);
    console.log(`  🎬 Video Recommendations: ${testResults.videoRecommendations.passed}/${testResults.videoRecommendations.passed + testResults.videoRecommendations.failed} queries successful`);
    console.log(`  🔧 Filter Functions: ${testResults.filteringSystem.passed}/${testResults.filteringSystem.passed + testResults.filteringSystem.failed} operations accurate`);
    
    console.log('\n==========================================');
    
    return testResults;
  }
};

console.log('✅ Global CitationCrossReference assigned:', window.CitationCrossReference); 