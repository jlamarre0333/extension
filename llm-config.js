// LLM Configuration for Smart Citations Extension
// Configure your preferred LLM provider and API key here

// Load API key from local environment file (not committed to git)
let OPENAI_API_KEY = 'REPLACE_WITH_YOUR_OPENAI_API_KEY';

// Try to load from local environment file
try {
  // This will be loaded from a separate file that's git-ignored
  if (typeof LOCAL_ENV !== 'undefined' && LOCAL_ENV.OPENAI_API_KEY) {
    OPENAI_API_KEY = LOCAL_ENV.OPENAI_API_KEY;
  }
} catch (error) {
  console.log('🔒 Using default API key configuration');
}

const LLM_CONFIG = {
  // ACTIVE PROVIDER: Using OpenAI (ChatGPT) only
  provider: 'openai', // ✅ ACTIVE: Using OpenAI/ChatGPT
  
  // ✅ ACTIVE - OpenAI Configuration (ChatGPT/GPT-4o-mini)
  openai: {
    apiKey: OPENAI_API_KEY,
    model: 'gpt-4o-mini', // Latest GPT-4o-mini (better performance, lower cost!)
    baseURL: 'https://api.openai.com/v1'
  }
  
  /* 🔒 DISABLED - Ollama Configuration (Local Llama models)
  // To re-enable: uncomment this section and change provider to 'ollama'
  ,ollama: {
    model: 'llama3.2', // Local model name
    baseURL: 'http://localhost:11434'
  }
  */
};

// ✅ SETUP INSTRUCTIONS:
// 1. Get your OpenAI API key from: https://platform.openai.com
// 2. Create 'env.local.js' file with your API key (see env.example.js)
// 3. Add 'env.local.js' to .gitignore
// 4. Save and reload the extension
// 
// SETUP COMPLETED WHEN:
// ✅ OpenAI API key configured in env.local.js
// ✅ GPT-4o-mini model selected (latest & most cost-effective)
// ✅ Provider set to 'openai'
// ✅ Extension ready to analyze YouTube videos!
//
// 🔒 SECURITY: 
// - API key is loaded from env.local.js (git-ignored)
// - Safe to commit llm-config.js to GitHub

// 💰 Cost Estimate (GPT-4o-mini): ~$0.03/month for 100 videos
// Excellent performance, very affordable pricing!

console.log('📋 LLM Configuration loaded');
console.log('🔑 API Key status:', OPENAI_API_KEY !== 'REPLACE_WITH_YOUR_OPENAI_API_KEY' ? 'Configured ✅' : 'Not configured ⚠️');