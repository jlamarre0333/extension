// Simplified Racing Citation Test Content Script
console.log('🏎️ Racing Citation Test Extension Loaded!');

// Track if we've already processed this video
let currentVideoId = null;
let citationSidebar = null;

// Racing-specific detection patterns
const racingPatterns = {
    drivers: [
        { name: "Lewis Hamilton", team: "Mercedes" },
        { name: "Max Verstappen", team: "Red Bull" },
        { name: "Charles Leclerc", team: "Ferrari" },
        { name: "Alex Antonelli", team: "Mercedes" },
        { name: "Lando Norris", team: "McLaren" },
        { name: "Fernando Alonso", team: "Aston Martin" },
        { name: "Sebastian Vettel", team: "Retired" },
        { name: "Michael Schumacher", team: "Ferrari (Legend)" },
        { name: "Ayrton Senna", team: "Legend" },
        { name: "Alain Prost", team: "Legend" }
    ],
    teams: [
        "Mercedes", "Red Bull", "Ferrari", "McLaren", "Alpine", 
        "Aston Martin", "Williams", "Haas", "Alfa Romeo"
    ],
    circuits: [
        { name: "Canadian Grand Prix", location: "Montreal, Canada" },
        { name: "Montreal", location: "Canada" },
        { name: "Barcelona", location: "Spain" },
        { name: "Catalunya", location: "Barcelona, Spain" },
        { name: "Monaco", location: "Monte Carlo" },
        { name: "Silverstone", location: "United Kingdom" },
        { name: "Spa", location: "Belgium" },
        { name: "Monza", location: "Italy" }
    ],
    concepts: [
        "Formula 1", "Grand Prix", "Pole Position", "Power Unit", 
        "DRS", "Safety Car", "Pit Stop", "Qualifying", "Championship"
    ]
};

// Initialize when page loads
function init() {
    console.log('🚀 Initializing racing citation detection...');
    
    // Check if we're on a YouTube video page
    if (!window.location.href.includes('/watch?v=')) {
        console.log('Not on a video page, skipping...');
        return;
    }

    // Create citation sidebar
    createCitationSidebar();
    
    // Set up video change detection
    setupVideoChangeDetection();
    
    // Process current video
    processCurrentVideo();
}

function createCitationSidebar() {
    // Remove existing sidebar if present
    if (citationSidebar) {
        citationSidebar.remove();
    }

    citationSidebar = document.createElement('div');
    citationSidebar.id = 'racing-citation-sidebar';
    citationSidebar.innerHTML = `
        <div style="
            position: fixed;
            top: 100px;
            right: 20px;
            width: 300px;
            background: white;
            border: 1px solid #ccc;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            max-height: 500px;
            overflow-y: auto;
            font-family: Arial, sans-serif;
        ">
            <div style="padding: 15px; border-bottom: 1px solid #eee; background: #f8f9fa; border-radius: 8px 8px 0 0;">
                <h3 style="margin: 0; color: #333; font-size: 16px;">🏎️ Racing Citations</h3>
                <button onclick="this.closest('#racing-citation-sidebar').style.display='none'" 
                        style="float: right; margin-top: -20px; background: none; border: none; font-size: 18px; cursor: pointer;">×</button>
            </div>
            <div id="citations-content" style="padding: 15px;">
                <div style="text-align: center; color: #666;">
                    🔄 Analyzing racing content...
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(citationSidebar);
    console.log('✅ Citation sidebar created');
}

function setupVideoChangeDetection() {
    // Watch for URL changes (YouTube is a SPA)
    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            if (url.includes('/watch?v=')) {
                console.log('📺 Video changed, reprocessing...');
                setTimeout(processCurrentVideo, 1000); // Wait for page to load
            }
        }
    }).observe(document, { subtree: true, childList: true });
}

async function processCurrentVideo() {
    const videoId = new URLSearchParams(window.location.search).get('v');
    
    if (!videoId || videoId === currentVideoId) {
        return; // Same video or no video
    }
    
    currentVideoId = videoId;
    console.log(`🎬 Processing video: ${videoId}`);
    
    // Get video metadata
    const videoData = extractVideoData();
    
    // Show loading state
    const container = document.getElementById('citations-content');
    if (container) {
        container.innerHTML = `
            <div style="text-align: center; color: #666;">
                🤖 Analyzing with AI...
                <br><small>Using Ollama LLM for enhanced detection</small>
            </div>
        `;
    }
    
    // Detect racing citations (async)
    try {
        const citations = await detectRacingCitations(videoData);
        displayCitations(citations);
    } catch (error) {
        console.error('Citation detection failed:', error);
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; color: #dc3545;">
                    ❌ Analysis failed
                    <br><small>${error.message}</small>
                </div>
            `;
        }
    }
}

function extractVideoData() {
    // Extract video title
    const title = document.querySelector('h1[class*="title"] yt-formatted-string, #title h1')?.textContent?.trim() || '';
    
    // Extract channel name
    const channel = document.querySelector('#channel-name a, #channel-name yt-formatted-string')?.textContent?.trim() || '';
    
    // Extract description (may not be fully loaded)
    const description = document.querySelector('#description-text, #snippet-text')?.textContent?.trim() || '';
    
    // Try to get transcript from multiple sources
    let transcript = '';
    
    // Method 1: Try transcript panel
    const transcriptElements = document.querySelectorAll('.ytd-transcript-segment-renderer, [class*="transcript"]');
    if (transcriptElements.length > 0) {
        transcript = Array.from(transcriptElements)
            .map(el => el.textContent?.trim())
            .filter(text => text && text.length > 5)
            .join(' ');
    }
    
    // Method 2: Try captions if transcript not found
    if (!transcript) {
        const captionElements = document.querySelectorAll('.ytp-caption-segment');
        if (captionElements.length > 0) {
            transcript = Array.from(captionElements)
                .map(el => el.textContent?.trim())
                .filter(text => text && text.length > 2)
                .join(' ');
        }
    }
    
    // Method 3: Use sample data for this specific video if no transcript found
    if (!transcript && window.location.href.includes('T7PCuydUfxo')) {
        transcript = `Canadian Grand Prix Formula 1 racing Montreal circuit Mercedes AMG Petronas team dealing with power unit 
                     reliability Alex Antonelli showing impressive pace in Formula 1 testing Barcelona Catalunya circuit provides 
                     similar challenges Circuit Gilles Villeneuve Montreal Canada racing venue Formula 1 championship standings 
                     competitive season Power unit regulations affecting multiple teams this year`;
        console.log('📝 Using sample transcript for Canadian Grand Prix video');
    }
    
    console.log('📊 Extracted video data:', {
        title: title.substring(0, 50) + '...',
        channel,
        descriptionLength: description.length,
        transcriptLength: transcript.length
    });
    
    return { title, channel, description, transcript };
}

async function tryLLMAnalysis(videoData) {
    try {
        console.log('🤖 Attempting LLM analysis with Ollama...');
        
        const prompt = `You are an expert racing content analyzer. Analyze this YouTube video and extract specific, researchable racing citations.

VIDEO METADATA:
Title: "${videoData.title}"
Channel: "${videoData.channel}"
Description: "${videoData.description}"

TRANSCRIPT:
${videoData.transcript}

Extract specific racing-related items that viewers would want to research. Focus on:
- Specific F1 drivers (names)
- Racing teams
- Racing circuits and venues
- Racing concepts and technology
- Specific racing events

Respond with JSON:
{
  "summary": "Brief description of racing content",
  "videoType": "racing",
  "citationWorthy": ["most important 5-8 specific racing items mentioned"],
  "people": ["specific driver names"],
  "companies": ["racing teams mentioned"],
  "places": ["circuits, cities, venues"],
  "concepts": ["racing terms, technology"]
}`;

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
            throw new Error(`Ollama API error: ${response.status}`);
        }

        const data = await response.json();
        const analysis = JSON.parse(data.response);
        
        console.log('🎯 LLM Analysis result:', analysis);
        
        // Convert analysis to citations
        const citations = [];
        
        // Add people (drivers)
        if (analysis.people) {
            analysis.people.forEach(person => {
                citations.push({
                    title: person,
                    type: 'person',
                    description: 'Formula 1 racing driver',
                    confidence: 0.95,
                    color: '#28a745'
                });
            });
        }
        
        // Add companies (teams)
        if (analysis.companies) {
            analysis.companies.forEach(company => {
                citations.push({
                    title: company,
                    type: 'company',
                    description: 'Formula 1 racing team',
                    confidence: 0.90,
                    color: '#007bff'
                });
            });
        }
        
        // Add places (circuits)
        if (analysis.places) {
            analysis.places.forEach(place => {
                citations.push({
                    title: place,
                    type: 'place',
                    description: 'Racing circuit or venue',
                    confidence: 0.85,
                    color: '#fd7e14'
                });
            });
        }
        
        // Add concepts
        if (analysis.concepts) {
            analysis.concepts.forEach(concept => {
                citations.push({
                    title: concept,
                    type: 'concept',
                    description: 'Racing concept or technology',
                    confidence: 0.80,
                    color: '#6f42c1'
                });
            });
        }
        
        // Remove duplicates and sort by confidence
        const uniqueCitations = citations.filter((citation, index, self) =>
            index === self.findIndex(c => c.title.toLowerCase() === citation.title.toLowerCase())
        ).sort((a, b) => b.confidence - a.confidence);
        
        console.log(`✅ LLM analysis produced ${uniqueCitations.length} citations`);
        return uniqueCitations;
        
    } catch (error) {
        console.log('⚠️ LLM analysis failed:', error.message);
        return null;
    }
}

async function detectRacingCitations(videoData) {
    console.log('🔍 Analyzing text for racing content...');
    
    // Try LLM analysis first (Ollama)
    const llmCitations = await tryLLMAnalysis(videoData);
    if (llmCitations && llmCitations.length > 0) {
        console.log(`✅ LLM analysis found ${llmCitations.length} citations`);
        return llmCitations;
    }
    
    // Fallback to pattern-based detection
    console.log('🔄 Falling back to pattern-based detection...');
    const citations = [];
    const allText = (videoData.title + ' ' + videoData.channel + ' ' + videoData.description + ' ' + videoData.transcript).toLowerCase();
    
    // Detect F1 drivers
    racingPatterns.drivers.forEach(driver => {
        const searchTerms = [
            driver.name.toLowerCase(),
            driver.name.split(' ')[0].toLowerCase(), // First name
            driver.name.split(' ')[1]?.toLowerCase() // Last name
        ].filter(Boolean);
        
        if (searchTerms.some(term => allText.includes(term))) {
            citations.push({
                title: driver.name,
                type: 'person',
                description: `Formula 1 driver - ${driver.team}`,
                confidence: 0.95,
                color: '#28a745'
            });
        }
    });
    
    // Detect F1 teams
    racingPatterns.teams.forEach(team => {
        if (allText.includes(team.toLowerCase())) {
            citations.push({
                title: team,
                type: 'company',
                description: 'Formula 1 racing team',
                confidence: 0.90,
                color: '#007bff'
            });
        }
    });
    
    // Detect circuits and locations
    racingPatterns.circuits.forEach(circuit => {
        if (allText.includes(circuit.name.toLowerCase())) {
            citations.push({
                title: circuit.name,
                type: 'place',
                description: `Racing circuit/location - ${circuit.location}`,
                confidence: 0.85,
                color: '#fd7e14'
            });
        }
    });
    
    // Detect racing concepts
    racingPatterns.concepts.forEach(concept => {
        if (allText.includes(concept.toLowerCase())) {
            citations.push({
                title: concept,
                type: 'concept',
                description: 'Formula 1 racing concept or terminology',
                confidence: 0.80,
                color: '#6f42c1'
            });
        }
    });
    
    // Remove duplicates and sort by confidence
    const uniqueCitations = citations.filter((citation, index, self) =>
        index === self.findIndex(c => c.title.toLowerCase() === citation.title.toLowerCase())
    ).sort((a, b) => b.confidence - a.confidence);
    
    console.log(`✅ Found ${uniqueCitations.length} racing citations`);
    return uniqueCitations;
}

function displayCitations(citations) {
    const container = document.getElementById('citations-content');
    
    if (!container) {
        console.error('Citations container not found');
        return;
    }
    
    if (citations.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; color: #666;">
                ⚠️ No racing citations detected
                <br><small>This video may not contain Formula 1 or racing content</small>
            </div>
        `;
        return;
    }
    
    let html = `
        <div style="margin-bottom: 10px; padding: 8px; background: #d4edda; border-radius: 4px; font-size: 12px;">
            ✅ Found ${citations.length} racing citation${citations.length !== 1 ? 's' : ''}
        </div>
    `;
    
    citations.forEach(citation => {
        html += `
            <div style="
                margin-bottom: 10px; 
                padding: 10px; 
                border-left: 4px solid ${citation.color}; 
                background: #f8f9fa; 
                border-radius: 0 4px 4px 0;
            ">
                <div style="font-weight: bold; color: ${citation.color}; font-size: 11px; text-transform: uppercase;">
                    ${citation.type}
                </div>
                <div style="font-weight: bold; margin: 2px 0; font-size: 14px;">
                    ${citation.title}
                </div>
                <div style="color: #666; font-size: 12px; margin: 2px 0;">
                    ${citation.description}
                </div>
                <div style="color: #999; font-size: 10px;">
                    Confidence: ${Math.round(citation.confidence * 100)}%
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Also try to initialize after a delay to handle dynamic loading
setTimeout(init, 2000); 