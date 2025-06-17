#!/usr/bin/env node

// Auto-proxy script for seamless Ollama integration
// This script automatically starts the CORS proxy server when the extension needs it

const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

console.log('🚀 Auto-Proxy for Citation Extension');
console.log('=====================================');

// Check if Ollama is running
async function checkOllama() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:11434/api/tags', (res) => {
      resolve(res.statusCode === 200);
    });
    
    req.on('error', () => {
      resolve(false);
    });
    
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Check if CORS proxy is running
async function checkProxy() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3001/health', (res) => {
      resolve(res.statusCode === 200);
    });
    
    req.on('error', () => {
      resolve(false);
    });
    
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Start the CORS proxy
function startProxy() {
  console.log('🔧 Starting CORS proxy server...');
  
  const proxyProcess = spawn('node', ['cors-proxy-server.js'], {
    stdio: 'inherit',
    cwd: __dirname
  });
  
  proxyProcess.on('error', (error) => {
    console.error('❌ Failed to start proxy:', error.message);
    process.exit(1);
  });
  
  proxyProcess.on('close', (code) => {
    console.log(`🛑 Proxy process exited with code ${code}`);
  });
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down proxy...');
    proxyProcess.kill('SIGINT');
    process.exit(0);
  });
  
  return proxyProcess;
}

async function main() {
  // Check Ollama
  console.log('🔍 Checking Ollama connection...');
  const ollamaRunning = await checkOllama();
  
  if (!ollamaRunning) {
    console.log('⚠️  Ollama is not running on localhost:11434');
    console.log('💡 Please start Ollama first:');
    console.log('   Windows: ollama serve');
    console.log('   macOS/Linux: ollama serve');
    process.exit(1);
  }
  
  console.log('✅ Ollama is running');
  
  // Check proxy
  console.log('🔍 Checking CORS proxy...');
  const proxyRunning = await checkProxy();
  
  if (proxyRunning) {
    console.log('✅ CORS proxy is already running');
    console.log('🎯 Extension is ready to use LLM features!');
    process.exit(0);
  }
  
  // Start proxy
  console.log('🚀 Starting auto-proxy for seamless LLM integration...');
  startProxy();
  
  // Wait a moment for proxy to start
  setTimeout(async () => {
    const started = await checkProxy();
    if (started) {
      console.log('✅ CORS proxy started successfully!');
      console.log('🎯 Extension is now ready to use LLM features!');
      console.log('📝 The proxy will automatically handle CORS for Ollama requests');
      console.log('🛑 Press Ctrl+C to stop the proxy');
    } else {
      console.log('❌ Failed to start CORS proxy');
      process.exit(1);
    }
  }, 2000);
}

// Add health endpoint check for the proxy
function addHealthCheck() {
  const server = http.createServer((req, res) => {
    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('{"status":"ok"}');
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  });
  
  server.listen(3002, () => {
    console.log('📊 Health check server running on port 3002');
  });
}

if (require.main === module) {
  main().catch(console.error);
} 