// LLM-Enhanced Citation Detection - Experimental Version
// This script uses an LLM to first understand the video content before extracting citations

console.log('🤖 LLM-Enhanced Citation Detector loaded!');

class LLMCitationDetector {
  constructor() {
    this.apiKey = null; // Will be set when user provides it
    this.citations = [];
    this.videoSummary = null;
    this.keyTopics = [];
  }

  // Simple API key setup (for testing)
  setAPIKey(key, provider = 'openai') {
    this.apiKey = key;
    this.provider = provider;
    console.log(`🔑 API key set for ${provider}`);
  }

  async analyzeVideoContent(videoData) {
    console.log('🤖 Starting LLM-enhanced analysis...');
    
    // Handle different input formats
    let fullText, videoTitle, videoDescription, channelName;
    
    if (typeof videoData === 'string') {
      // Legacy: just transcript text
      fullText = videoData;
      videoTitle = 'Unknown Video';
      videoDescription = '';
      channelName = 'Unknown Channel';
    } else if (videoData.transcript) {
      // New format: full video metadata
      fullText = typeof videoData.transcript === 'string' ? videoData.transcript : 
                 videoData.transcript.map ? videoData.transcript.map(segment => segment.text).join(' ') : 
                 videoData.transcript.text || '';
      videoTitle = videoData.title || 'Unknown Video';
      videoDescription = videoData.description || '';
      channelName = videoData.channelName || 'Unknown Channel';
    } else {
      // Fallback for other formats
      fullText = videoData.text || videoData.content || String(videoData);
      videoTitle = 'Unknown Video';
      videoDescription = '';
      channelName = 'Unknown Channel';
    }
    
    console.log(`📄 Analyzing video: "${videoTitle}" by ${channelName}`);
    console.log(`📝 Transcript: ${fullText.length} characters`);
    console.log(`📋 Description: ${videoDescription.length} characters`);
    
    // Step 1: Get LLM topic breakdown and analysis
    const analysis = await this.getLLMTopicAnalysis({
      title: videoTitle,
      description: videoDescription,
      channelName: channelName,
      transcript: fullText
    });
    
    if (!analysis) {
      console.log('⚠️ LLM analysis failed, falling back to basic detection');
      return this.fallbackDetection(fullText);
    }

    // Step 2: Generate targeted citations based on LLM topic analysis
    const citations = await this.generateTargetedCitations(analysis, fullText);
    
    console.log(`✅ LLM analysis complete: ${citations.length} citations found`);
    return citations;
  }

  async getLLMTopicAnalysis(videoMetadata) {
    console.log('🎬 VIDEO METADATA RECEIVED FOR ANALYSIS:');
    console.log('=' .repeat(80));
    console.log('📺 Title:', videoMetadata.title);
    console.log('👤 Channel:', videoMetadata.channelName);
    console.log('📝 Description:', videoMetadata.description);
    console.log('📊 Transcript Length:', videoMetadata.transcript.length, 'characters');
    console.log('📄 Transcript Preview:', videoMetadata.transcript.substring(0, 200) + '...');
    console.log('=' .repeat(80));
    
    if (!this.apiKey) {
      console.log('⚠️ No API key provided, using mock analysis');
      return this.getMockTopicAnalysis(videoMetadata);
    }

    try {
      // Truncate transcript if too long (for API efficiency)
      const maxTranscriptLength = 6000;
      const transcript = videoMetadata.transcript.length > maxTranscriptLength ? 
        videoMetadata.transcript.substring(0, maxTranscriptLength) + '...' : 
        videoMetadata.transcript;
      
      console.log(`📏 Using transcript: ${transcript.length} characters (${videoMetadata.transcript.length > maxTranscriptLength ? 'truncated' : 'full'})`);
      
      const prompt = `You are an expert content analyzer. Break down this YouTube video into specific topics for citation generation.

VIDEO METADATA:
Title: "${videoMetadata.title}"
Channel: "${videoMetadata.channelName}"
Description: "${videoMetadata.description}"

TRANSCRIPT:
${transcript}

Analyze the complete video content and extract specific entities that would be worth citing or researching further. Focus on concrete, researchable topics.

Please provide a JSON response with:
{
  "summary": "2-3 sentence summary of what this video is actually about",
  "videoType": "travel|educational|technology|business|entertainment|news|other",
  "mainTopics": ["specific topics discussed in detail"],
  "places": ["specific locations, countries, cities, landmarks mentioned"],
  "people": ["specific people, historical figures, celebrities, experts mentioned"],
  "companies": ["specific companies, brands, organizations mentioned"],
  "technologies": ["specific technologies, tools, platforms, concepts mentioned"],
  "historicalEvents": ["specific historical events, periods, wars, movements mentioned"],
  "books": ["specific books, publications, studies, papers mentioned"],
  "concepts": ["specific academic concepts, theories, ideas explained"],
  "products": ["specific products, services, tools featured"],
  "citationWorthy": ["the most important 3-5 items that viewers would want to research further"]
}

Be specific and focus only on entities that are actually discussed in meaningful detail, not just mentioned in passing.`;

      console.log('🚀 Sending analysis request to LLM...');
      const analysis = await this.callLLMAPI(prompt);
      
      if (analysis) {
        this.videoSummary = analysis.summary;
        this.keyTopics = analysis.mainTopics || [];
        console.log('📋 LLM Analysis Complete!');
        console.log('📝 Video Summary:', analysis.summary);
        console.log('🎬 Video Type:', analysis.videoType);
        console.log('🎯 Main Topics:', analysis.mainTopics);
        console.log('⭐ Citation Worthy:', analysis.citationWorthy);
      }
      
      return analysis;
    } catch (error) {
      console.error('❌ LLM API error:', error);
      console.log('🔄 Falling back to mock analysis...');
      return this.getMockTopicAnalysis(videoMetadata);
    }
  }

  async callLLMAPI(prompt) {
    if (this.provider === 'openai') {
      return await this.callOpenAI(prompt);
    } else if (this.provider === 'huggingface') {
      return await this.callHuggingFace(prompt);
    } else if (this.provider === 'ollama') {
      return await this.callOllama(prompt);
    }
    return null;
  }

  async callOpenAI(prompt) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo', // Fast and efficient
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
        temperature: 0.3 // Lower for more consistent results
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      return JSON.parse(content);
    } catch (e) {
      console.log('📝 Raw LLM response:', content);
      return this.parseUnstructuredResponse(content);
    }
  }

  async callHuggingFace(prompt) {
    // Using Hugging Face's free inference API with a smaller model
    const response = await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 500,
          temperature: 0.3
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.status}`);
    }

    const data = await response.json();
    return this.parseUnstructuredResponse(data[0]?.generated_text || '');
  }

  async callOllama(prompt) {
    try {
      console.log('🦙 Calling Ollama via CORS proxy...');
      console.log('📤 PROMPT BEING SENT TO OLLAMA:');
      console.log('=' .repeat(80));
      console.log(prompt);
      console.log('=' .repeat(80));
      console.log(`📏 Prompt length: ${prompt.length} characters`);
      
      // Try direct connection first, fallback to proxy
      let response;
      try {
        console.log('🌐 Attempting direct connection to Ollama...');
        response = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'llama3.2',
            prompt: prompt,
            stream: false,
            format: 'json'
          })
        });
        console.log('✅ Direct connection successful!');
      } catch (corsError) {
        console.log('🔧 Direct connection failed, using CORS proxy...');
        // Extract videoMetadata from prompt for proxy
        const videoMetadata = this.extractVideoMetadataFromPrompt(prompt);
        
        response = await fetch('http://localhost:3001/api/ollama-analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoMetadata })
        });
        
        if (response.ok) {
          const proxyData = await response.json();
          if (proxyData.success) {
            console.log('✅ Proxy connection successful!');
            return proxyData.analysis;
          } else {
            throw new Error(proxyData.error);
          }
        }
      }
      
      console.log('📡 Response received, status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ Ollama HTTP error response:', errorText);
        throw new Error(`Ollama API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('📥 OLLAMA RAW RESPONSE:');
      console.log('=' .repeat(80));
      console.log(data.response);
      console.log('=' .repeat(80));
      console.log(`📏 Response length: ${data.response.length} characters`);
      
      try {
        const parsedResponse = JSON.parse(data.response);
        console.log('✅ Successfully parsed JSON response');
        console.log('🎯 PARSED ANALYSIS RESULT:');
        console.log('🔍 Summary:', parsedResponse.summary);
        console.log('🎬 Video Type:', parsedResponse.videoType);
        console.log('📍 Places:', parsedResponse.places);
        console.log('👥 People:', parsedResponse.people);
        console.log('🏢 Companies:', parsedResponse.companies);
        console.log('💻 Technologies:', parsedResponse.technologies);
        console.log('⭐ Citation Worthy:', parsedResponse.citationWorthy);
        return parsedResponse;
      } catch (e) {
        console.log('⚠️ Ollama response was not valid JSON, attempting to parse as text...');
        console.log('🔍 Parse error:', e.message);
        return this.parseUnstructuredResponse(data.response);
      }
    } catch (error) {
      console.error('❌ Ollama API error details:');
      console.error('   Error type:', error.constructor.name);
      console.error('   Error message:', error.message);
      console.error('   Error stack:', error.stack);
      
      if (error.message.includes('fetch')) {
        console.error('🔍 This looks like a network connectivity issue');
        console.error('💡 Make sure Ollama is running: ollama serve');
      }
      
      throw error;
    }
  }

  parseUnstructuredResponse(text) {
    // Simple parsing if JSON fails
    const analysis = {
      summary: '',
      mainTopics: [],
      places: [],
      people: [],
      companies: [],
      technologies: [],
      historicalEvents: [],
      books: [],
      concepts: []
    };

    // Extract information using simple patterns
    const lines = text.split('\n');
    for (const line of lines) {
      if (line.toLowerCase().includes('summary')) {
        analysis.summary = line.replace(/.*summary[:\-]?\s*/i, '').trim();
      }
      // Add more parsing logic as needed
    }

    return analysis;
  }

  extractVideoMetadataFromPrompt(prompt) {
    // Extract video metadata from the prompt for proxy usage
    const titleMatch = prompt.match(/Title: "([^"]+)"/);
    const channelMatch = prompt.match(/Channel: "([^"]+)"/);
    const descriptionMatch = prompt.match(/Description: "([^"]+)"/);
    const transcriptMatch = prompt.match(/TRANSCRIPT:\s*([\s\S]+?)\s*Analyze the complete/);

    return {
      title: titleMatch ? titleMatch[1] : 'Unknown Video',
      channelName: channelMatch ? channelMatch[1] : 'Unknown Channel',
      description: descriptionMatch ? descriptionMatch[1] : '',
      transcript: transcriptMatch ? transcriptMatch[1].trim() : ''
    };
  }

  getMockTopicAnalysis(videoMetadata) {
    // Enhanced mock analysis using video metadata
    console.log('🔄 Using enhanced mock analysis (for testing without API key)');
    
    const fullText = `${videoMetadata.title} ${videoMetadata.description} ${videoMetadata.transcript}`.toLowerCase();
    const words = fullText.split(/\s+/);
    
    // Determine video type based on title and content
    let videoType = 'other';
    if (fullText.includes('travel') || fullText.includes('malta') || fullText.includes('visit')) {
      videoType = 'travel';
    } else if (fullText.includes('tech') || fullText.includes('apple') || fullText.includes('google')) {
      videoType = 'technology';
    } else if (fullText.includes('history') || fullText.includes('war') || fullText.includes('science')) {
      videoType = 'educational';
    }
    
    const analysis = {
      summary: `This ${videoType} video by ${videoMetadata.channelName} explores various topics with focus on practical information and detailed explanations.`,
      videoType: videoType,
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

    // Enhanced keyword detection with more comprehensive lists
    const keywords = {
      places: ['malta', 'italy', 'france', 'germany', 'spain', 'greece', 'japan', 'china', 'america', 'usa', 'uk', 'london', 'paris', 'tokyo', 'valletta', 'rome', 'berlin', 'madrid', 'athens', 'mediterranean', 'europe', 'asia', 'africa'],
      people: ['einstein', 'newton', 'jobs', 'gates', 'musk', 'napoleon', 'churchill', 'tesla', 'darwin', 'galileo', 'shakespeare', 'picasso', 'beethoven', 'mozart', 'leonardo', 'michelangelo'],
      companies: ['apple', 'google', 'microsoft', 'amazon', 'tesla', 'facebook', 'meta', 'netflix', 'disney', 'samsung', 'sony', 'nike', 'mcdonalds', 'coca-cola', 'pepsi'],
      technologies: ['ai', 'artificial intelligence', 'blockchain', 'cryptocurrency', 'machine learning', 'bitcoin', 'ethereum', 'internet', 'computer', 'smartphone', 'iphone', 'android'],
      historicalEvents: ['world war', 'wwii', 'renaissance', 'industrial revolution', 'cold war', 'vietnam war', 'american revolution', 'french revolution'],
      concepts: ['physics', 'chemistry', 'biology', 'mathematics', 'philosophy', 'psychology', 'economics', 'democracy', 'capitalism', 'socialism']
    };

    // Extract entities and build topics - only if actually found in content
    for (const [category, keywordList] of Object.entries(keywords)) {
      for (const keyword of keywordList) {
        // Very precise matching - only exact matches or clear word boundaries
        const keywordLower = keyword.toLowerCase();
        const keywordWords = keywordLower.split(' ');
        
        // For multi-word keywords, all words must be found
        if (keywordWords.length > 1) {
          const found = keywordWords.every(kw => words.includes(kw));
          if (found) {
            const formattedKeyword = keyword.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            analysis[category].push(formattedKeyword);
            analysis.mainTopics.push(formattedKeyword);
            console.log(`✅ Found multi-word "${keyword}" in content for category: ${category}`);
          }
          continue;
        }
        
        // For single words, check exact match or as part of compound words
        const found = words.some(word => {
          if (word === keywordLower) return true; // exact match
          // Only allow partial matches for very specific cases
          if (keywordLower === 'ai' && (word.includes('artificial') || word.includes('intelligence'))) return true;
          if (keywordLower === 'tesla' && word.includes('tesla')) return true;
          return false;
        });
        
        if (found) {
          const formattedKeyword = keyword.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          analysis[category].push(formattedKeyword);
          analysis.mainTopics.push(formattedKeyword);
          console.log(`✅ Found "${keyword}" in content for category: ${category}`);
        }
      }
    }

    // Remove duplicates and limit results
    for (const key in analysis) {
      if (Array.isArray(analysis[key])) {
        analysis[key] = [...new Set(analysis[key])].slice(0, 8);
      }
    }
    
    // Clean up cross-category duplicates (e.g., Tesla as both person and company)
    // Prioritize companies over people for business entities
    if (analysis.companies.includes('Tesla') && analysis.people.includes('Tesla')) {
      analysis.people = analysis.people.filter(item => item !== 'Tesla');
    }
    
    // Select most important items for citation
    analysis.citationWorthy = [
      ...analysis.places.slice(0, 2),
      ...analysis.people.slice(0, 2),
      ...analysis.companies.slice(0, 1)
    ].slice(0, 5);

    console.log('🎯 Mock analysis generated topics:', analysis.mainTopics);
    return analysis;
  }

  async generateTargetedCitations(analysis, fullText) {
    const citations = [];
    
    // Prioritize citation-worthy items with highest confidence
    if (analysis.citationWorthy && analysis.citationWorthy.length > 0) {
      console.log('⭐ Processing citation-worthy items:', analysis.citationWorthy);
      for (const item of analysis.citationWorthy) {
        citations.push({
          title: item,
          type: this.inferTypeFromContent(item, analysis),
          confidence: 0.98, // Highest confidence for citation-worthy items
          source: 'llm_priority',
          timestamp: this.findTimestamp(item, fullText),
          llmContext: analysis.summary,
          videoType: analysis.videoType || 'unknown',
          priority: 'high',
          author: null,
          verified: true
        });
      }
    }
    
    // Generate citations based on LLM analysis with high confidence
    const categories = ['places', 'people', 'companies', 'technologies', 'historicalEvents', 'books', 'concepts', 'products'];
    
    for (const category of categories) {
      if (analysis[category] && analysis[category].length > 0) {
        for (const item of analysis[category]) {
          // Skip if already added as citation-worthy
          if (analysis.citationWorthy && analysis.citationWorthy.includes(item)) {
            continue;
          }
          
          // Verify the item actually appears in the text
          if (this.verifyInText(item, fullText)) {
            citations.push({
              title: item,
              type: this.mapCategoryToType(category),
              confidence: 0.90, // High confidence since LLM identified it
              source: 'llm_analysis',
              timestamp: this.findTimestamp(item, fullText),
              llmContext: analysis.summary,
              videoType: analysis.videoType || 'unknown',
              priority: 'normal',
              author: null,
              verified: true
            });
          }
        }
      }
    }

    // Add main topics as general citations (lower priority)
    if (analysis.mainTopics) {
      for (const topic of analysis.mainTopics) {
        // Skip if already added in other categories
        if (citations.some(c => c.title.toLowerCase() === topic.toLowerCase())) {
          continue;
        }
        
        citations.push({
          title: topic,
          type: 'topic',
          confidence: 0.80,
          source: 'llm_topic',
          timestamp: 0,
          llmContext: analysis.summary,
          videoType: analysis.videoType || 'unknown',
          priority: 'low',
          author: null,
          verified: true
        });
      }
    }

    const uniqueCitations = this.removeDuplicates(citations);
    console.log(`📊 Generated ${uniqueCitations.length} unique citations from analysis`);
    return uniqueCitations;
  }

  mapCategoryToType(category) {
    const mapping = {
      'places': 'place',
      'people': 'person',
      'companies': 'company',
      'technologies': 'technology',
      'historicalEvents': 'event',
      'books': 'book',
      'concepts': 'topic',
      'products': 'product'
    };
    return mapping[category] || 'topic';
  }

  inferTypeFromContent(item, analysis) {
    // Try to infer type from which category the item appears in
    const itemLower = item.toLowerCase();
    
    if (analysis.places && analysis.places.some(p => p.toLowerCase() === itemLower)) {
      return 'place';
    }
    if (analysis.people && analysis.people.some(p => p.toLowerCase() === itemLower)) {
      return 'person';
    }
    if (analysis.companies && analysis.companies.some(c => c.toLowerCase() === itemLower)) {
      return 'company';
    }
    if (analysis.technologies && analysis.technologies.some(t => t.toLowerCase() === itemLower)) {
      return 'technology';
    }
    if (analysis.historicalEvents && analysis.historicalEvents.some(e => e.toLowerCase() === itemLower)) {
      return 'event';
    }
    if (analysis.books && analysis.books.some(b => b.toLowerCase() === itemLower)) {
      return 'book';
    }
    if (analysis.products && analysis.products.some(p => p.toLowerCase() === itemLower)) {
      return 'product';
    }
    
    return 'topic'; // Default fallback
  }

  verifyInText(item, text) {
    const textLower = text.toLowerCase();
    const itemLower = item.toLowerCase();
    return textLower.includes(itemLower);
  }

  findTimestamp(item, text) {
    // Simple timestamp finding - could be enhanced
    return 0; // For now, return 0
  }

  fallbackDetection(text) {
    // Simple fallback if LLM fails
    console.log('🔄 Using fallback detection');
    
    const citations = [];
    
    // Basic country detection
    const countries = ['Malta', 'Italy', 'France', 'Germany', 'Spain', 'Greece', 'Japan', 'China'];
    for (const country of countries) {
      if (text.includes(country)) {
        citations.push({
          title: country,
          type: 'place',
          confidence: 0.7,
          source: 'fallback',
          timestamp: 0,
          author: null,
          verified: false
        });
      }
    }

    return citations;
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

  // Test function
  async testWithSampleText() {
    const sampleText = `Malta is a beautiful island nation in the Mediterranean. 
    The video discusses how Steve Jobs revolutionized Apple and the technology industry. 
    Einstein's theory of relativity changed our understanding of physics. 
    World War II was a defining moment in history that shaped the modern world.`;
    
    console.log('🧪 Testing LLM citation detection...');
    const results = await this.analyzeVideoContent(sampleText);
    console.log('📊 Test Results:', results);
    return results;
  }
}

// Create global instance for testing
window.LLMCitationDetector = new LLMCitationDetector();

// Simple setup function for users
window.setupLLMDetection = function(apiKey, provider = 'openai') {
  window.LLMCitationDetector.setAPIKey(apiKey, provider);
  console.log('✅ LLM Detection ready! Try: LLMCitationDetector.testWithSampleText()');
};

// Auto-test without API key (using mock)
window.LLMCitationDetector.testWithSampleText();

console.log(`
🤖 LLM Citation Detection Ready!

🦙 OLLAMA (Local & Free):
1. setupLLMDetection('ollama', 'ollama')
2. LLMCitationDetector.analyzeVideoContent(transcript)

☁️ CLOUD APIs:
1. setupLLMDetection('your-api-key', 'openai')
2. setupLLMDetection('your-hf-token', 'huggingface')

🧪 TESTING WITHOUT API:
- LLMCitationDetector.testWithSampleText()

🚀 QUICK OLLAMA TEST:
- setupLLMDetection('ollama', 'ollama')
- LLMCitationDetector.testWithSampleText()

Supported providers: 'openai', 'huggingface', 'ollama'
`); 