// Extension Ollama Proxy - bypasses CORS by running in extension context
// This would go in your Chrome extension's content script or background script

class ExtensionOllamaProxy {
  constructor() {
    this.baseUrl = 'http://localhost:11434';
  }

  async analyzeWithOllama(videoMetadata) {
    console.log('🔧 Using extension context to bypass CORS...');
    
    try {
      const prompt = this.buildPrompt(videoMetadata);
      
      // In extension context, we can make requests to localhost
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3.2',
          prompt: prompt,
          stream: false,
          format: 'json'
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama error: ${response.status}`);
      }

      const data = await response.json();
      return JSON.parse(data.response);
      
    } catch (error) {
      console.error('Extension Ollama error:', error);
      throw error;
    }
  }

  buildPrompt(videoMetadata) {
    return `You are an expert content analyzer. Break down this YouTube video into specific topics for citation generation.

VIDEO METADATA:
Title: "${videoMetadata.title}"
Channel: "${videoMetadata.channelName}"
Description: "${videoMetadata.description}"

TRANSCRIPT:
${videoMetadata.transcript}

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
  }
}

// Usage in your extension:
// const proxy = new ExtensionOllamaProxy();
// const analysis = await proxy.analyzeWithOllama(videoMetadata); 