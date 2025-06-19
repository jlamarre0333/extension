// LLM Configuration for Smart Citations Extension
// Configure your preferred LLM provider and API key here

const LLM_CONFIG = {
  // ACTIVE PROVIDER: Using OpenAI (ChatGPT) only
  provider: 'openai', // ✅ ACTIVE: Using OpenAI/ChatGPT
  
  // ✅ ACTIVE - OpenAI Configuration (ChatGPT/GPT-4.1 Mini)
  openai: {
    apiKey: 'REPLACE_WITH_YOUR_OPENAI_API_KEY', // Replace with your actual API key
    model: 'gpt-4.1-mini', // Latest GPT-4.1 Mini (better performance, lower cost!)
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
// 2. Replace 'REPLACE_WITH_YOUR_OPENAI_API_KEY' above with your actual key
// 3. Save this file and reload the extension
// 
// SETUP COMPLETED WHEN:
// ✅ OpenAI API key configured
// ✅ GPT-4.1 Mini model selected (latest & most cost-effective)
// ✅ Provider set to 'openai'
// ✅ Extension ready to analyze YouTube videos!
//
// 🔒 OLLAMA (DISABLED): 
// Ollama/Llama code is saved but commented out above
// To re-enable: uncomment the ollama section and change provider to 'ollama'

// 💰 Cost Estimate (GPT-4.1 Mini): ~$0.05/month for 100 videos
// Much better performance than Ollama, very affordable pricing!

console.log('📋 LLM Configuration loaded');