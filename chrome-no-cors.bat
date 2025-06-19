@echo off
echo Starting Chrome with CORS disabled for testing...
echo WARNING: Only use this for development/testing!

start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --disable-web-security --disable-features=VizDisplayCompositor --user-data-dir="C:\temp\chrome-cors-disabled"

echo Chrome started with CORS disabled.
echo You can now test direct Ollama connections. 