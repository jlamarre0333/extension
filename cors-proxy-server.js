// Simple CORS Proxy Server for Ollama
// Run with: node cors-proxy-server.js

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch'); // npm install node-fetch@2

const app = express();
const PORT = 3001;

// Enable CORS for all origins
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ollama-proxy' });
});

// Proxy endpoint for Ollama
app.post('/api/ollama-analyze', async (req, res) => {
  try {
    console.log('📤 Proxying request to Ollama...');
    
    const { videoMetadata } = req.body;
    
    const prompt = buildPrompt(videoMetadata);
    
    const response = await fetch('http://localhost:11434/api/generate', {
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
    const analysis = JSON.parse(data.response);
    
    console.log('✅ Analysis complete, sending back to browser');
    res.json({ success: true, analysis });
    
  } catch (error) {
    console.error('❌ Proxy error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

function buildPrompt(videoMetadata) {
  return `You are an expert content analyzer. Break down this YouTube video into specific topics for citation generation.

VIDEO METADATA:
Title: "${videoMetadata.title}"
Channel: "${videoMetadata.channelName}"
Description: "${videoMetadata.description}"

TRANSCRIPT:
${videoMetadata.transcript}

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
}`;
}

app.listen(PORT, () => {
  console.log(`🚀 CORS Proxy server running on http://localhost:${PORT}`);
  console.log(`📡 Proxying requests to Ollama at http://localhost:11434`);
});

// To use this:
// 1. npm install express cors node-fetch@2
// 2. node cors-proxy-server.js
// 3. In your browser code, call: http://localhost:3001/api/ollama-analyze 