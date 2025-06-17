@echo off
echo 🚀 Starting Citation Extension with AI Integration
echo =====================================================

echo.
echo 🔍 Checking if Ollama is running...
curl -s http://localhost:11434/api/tags >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Ollama is not running on localhost:11434
    echo 💡 Please start Ollama first:
    echo    ollama serve
    echo.
    pause
    exit /b 1
)

echo ✅ Ollama is running!
echo.

echo 🔧 Starting CORS proxy for seamless integration...
start "CORS Proxy" cmd /k "node cors-proxy-server.js"

echo.
echo ⏳ Waiting for proxy to start...
timeout /t 3 /nobreak >nul

echo ✅ Extension is ready!
echo.
echo 📝 Instructions:
echo 1. Load the extension in Chrome (Developer mode)
echo 2. Go to any YouTube video with captions
echo 3. The AI will automatically analyze content for better citations
echo 4. Look for 🤖 indicators for LLM-enhanced citations
echo.
echo 🛑 Press any key to stop all services...
pause >nul

echo 🛑 Stopping services...
taskkill /f /fi "WindowTitle eq CORS Proxy*" >nul 2>&1
echo ✅ All services stopped.
pause 