// Test Script for Specific YouTube Video: https://www.youtube.com/watch?v=T7PCuydUfxo
// Run this in the browser console when on the YouTube video page

console.log('🎬 Testing Citation Detection on Specific Video');
console.log('Video URL: https://www.youtube.com/watch?v=T7PCuydUfxo');

async function testVideoSpecific() {
    console.log('🔍 Starting comprehensive video analysis...');
    
    // First, check if we're on the right page
    const currentUrl = window.location.href;
    const targetVideoId = 'T7PCuydUfxo';
    
    if (!currentUrl.includes(targetVideoId)) {
        console.log('⚠️ Please navigate to: https://www.youtube.com/watch?v=T7PCuydUfxo');
        return;
    }

    console.log('✅ On target video page');

    // Extract video metadata
    const videoTitle = document.querySelector('h1[class*="title"] yt-formatted-string, #title h1')?.textContent?.trim() || 'Unknown Title';
    const channelName = document.querySelector('#channel-name a, #channel-name yt-formatted-string')?.textContent?.trim() || 'Unknown Channel';
    const videoDescription = document.querySelector('#description-text, #snippet-text')?.textContent?.trim() || '';
    
    console.log('📺 Video Metadata:');
    console.log('  Title:', videoTitle);
    console.log('  Channel:', channelName);
    console.log('  Description length:', videoDescription.length, 'characters');

    // Try to get transcript
    let transcript = '';
    try {
        // Look for transcript button
        const moreActionsButton = document.querySelector('[aria-label="More actions"], button[aria-label*="more"]');
        if (moreActionsButton) {
            console.log('🔄 Attempting to open transcript...');
            moreActionsButton.click();
            
            // Wait a bit
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Look for transcript option
            const transcriptButton = document.querySelector('[role="menuitem"]:has-text("Show transcript"), a[href*="transcript"]');
            if (transcriptButton) {
                transcriptButton.click();
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        // Try to extract transcript text
        const transcriptElements = document.querySelectorAll('.segment-text, [data-segment-text], .ytd-transcript-segment-renderer');
        if (transcriptElements.length > 0) {
            transcript = Array.from(transcriptElements).map(el => el.textContent?.trim()).filter(text => text).join(' ');
            console.log('📝 Transcript found:', transcript.length, 'characters');
        } else {
            console.log('⚠️ No transcript found on this video');
            // Create a sample transcript based on racing content
            transcript = `
                Welcome everyone to this exciting race coverage. Today we're following the drivers as they compete on this challenging circuit.
                The current leader is showing incredible skill as they navigate through the tight corners and high-speed sections.
                This track has a rich history in motorsport, with many legendary drivers having competed here over the years.
                The racing conditions today are perfect, with clear skies and optimal track temperature for maximum performance.
                We can see the different racing teams have brought their latest car setups and aerodynamic packages.
                The pit crews are standing by ready to execute lightning-fast tire changes and strategic fuel stops.
                This is the kind of competitive racing that showcases the best of motorsport engineering and driver talent.
            `;
            console.log('📝 Using sample racing transcript for analysis');
        }
    } catch (error) {
        console.log('❌ Error getting transcript:', error.message);
        transcript = 'Sample racing content for testing';
    }

    // Test citation detection
    console.log('🤖 Testing Citation Detection...');
    
    // Create comprehensive video data
    const videoData = {
        title: videoTitle,
        channelName: channelName,
        description: videoDescription,
        text: transcript,
        url: currentUrl
    };

    // Test with different detection methods
    await testAllDetectionMethods(videoData);
}

async function testAllDetectionMethods(videoData) {
    console.log('🔬 Testing all detection methods...');
    
    // Method 1: LLM Detection (if available)
    if (typeof LLMCitationDetector !== 'undefined') {
        console.log('1️⃣ Testing LLM Detection...');
        try {
            const llmDetector = new LLMCitationDetector();
            llmDetector.setAPIKey('ollama', 'ollama');
            
            const llmCitations = await llmDetector.analyzeVideoContent(videoData);
            console.log('🤖 LLM Results:', llmCitations.length, 'citations');
            llmCitations.forEach((citation, i) => {
                console.log(`  ${i+1}. ${citation.title} (${citation.type}) - ${citation.description}`);
            });
        } catch (error) {
            console.log('⚠️ LLM detection failed:', error.message);
        }
    }

    // Method 2: Enhanced Standard Detection
    console.log('2️⃣ Testing Enhanced Standard Detection...');
    const standardCitations = detectRacingCitations(videoData);
    console.log('📊 Standard Results:', standardCitations.length, 'citations');
    standardCitations.forEach((citation, i) => {
        console.log(`  ${i+1}. ${citation.title} (${citation.type}) - ${citation.description}`);
    });

    // Method 3: Pattern-based Detection for Racing
    console.log('3️⃣ Testing Racing-Specific Patterns...');
    const racingCitations = detectRacingSpecificContent(videoData);
    console.log('🏁 Racing-Specific Results:', racingCitations.length, 'citations');
    racingCitations.forEach((citation, i) => {
        console.log(`  ${i+1}. ${citation.title} (${citation.type}) - ${citation.description}`);
    });

    // Summary
    console.log('📋 SUMMARY:');
    console.log('- LLM citations: Available?', typeof LLMCitationDetector !== 'undefined');
    console.log('- Standard citations:', standardCitations.length);
    console.log('- Racing-specific citations:', racingCitations.length);
    
    return {
        standard: standardCitations,
        racing: racingCitations
    };
}

function detectRacingCitations(videoData) {
    const citations = [];
    const text = (videoData.text + ' ' + videoData.title + ' ' + videoData.description).toLowerCase();
    
    // Racing drivers (common names)
    const drivers = [
        'lewis hamilton', 'max verstappen', 'charles leclerc', 'carlos sainz', 'lando norris',
        'george russell', 'sergio perez', 'fernando alonso', 'sebastian vettel', 'michael schumacher',
        'ayrton senna', 'alain prost', 'niki lauda', 'jim clark', 'jackie stewart'
    ];
    
    drivers.forEach(driver => {
        if (text.includes(driver)) {
            citations.push({
                title: driver.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
                type: 'person',
                description: 'Formula 1 racing driver',
                confidence: 0.9,
                context: 'Racing'
            });
        }
    });

    // Racing teams
    const teams = ['mercedes', 'red bull', 'ferrari', 'mclaren', 'alpine', 'aston martin', 'williams', 'haas', 'alfa romeo'];
    teams.forEach(team => {
        if (text.includes(team)) {
            citations.push({
                title: team.charAt(0).toUpperCase() + team.slice(1),
                type: 'company',
                description: 'Formula 1 racing team',
                confidence: 0.85,
                context: 'Motorsport'
            });
        }
    });

    // Racing circuits
    const circuits = ['monaco', 'silverstone', 'spa', 'monza', 'suzuka', 'interlagos', 'nurburgring', 'le mans'];
    circuits.forEach(circuit => {
        if (text.includes(circuit)) {
            citations.push({
                title: circuit.charAt(0).toUpperCase() + circuit.slice(1),
                type: 'place',
                description: 'Famous racing circuit',
                confidence: 0.8,
                context: 'Motorsport'
            });
        }
    });

    return removeDuplicates(citations);
}

function detectRacingSpecificContent(videoData) {
    const citations = [];
    const fullText = videoData.text + ' ' + videoData.title + ' ' + videoData.description;
    
    // Racing terminology and concepts
    const racingConcepts = [
        { term: 'formula 1', description: 'Premier open-wheel racing championship' },
        { term: 'grand prix', description: 'Formula 1 race event' },
        { term: 'pole position', description: 'First starting position in a race' },
        { term: 'drs zone', description: 'Drag Reduction System activation area' },
        { term: 'pit stop', description: 'Service area visit during race' },
        { term: 'qualifying', description: 'Session to determine starting positions' },
        { term: 'safety car', description: 'Vehicle used to slow the field during cautions' },
        { term: 'fastest lap', description: 'Quickest single lap time in a race' }
    ];

    racingConcepts.forEach(concept => {
        if (fullText.toLowerCase().includes(concept.term)) {
            citations.push({
                title: concept.term.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
                type: 'concept',
                description: concept.description,
                confidence: 0.75,
                context: 'Racing terminology'
            });
        }
    });

    return citations;
}

function removeDuplicates(citations) {
    const seen = new Set();
    return citations.filter(citation => {
        const key = citation.title.toLowerCase();
        if (seen.has(key)) {
            return false;
        }
        seen.add(key);
        return true;
    });
}

// Instructions for use
console.log('📋 Instructions:');
console.log('1. Navigate to: https://www.youtube.com/watch?v=T7PCuydUfxo');
console.log('2. Run: testVideoSpecific()');
console.log('3. View results in console');
console.log('');
console.log('🎯 Ready to test! Run testVideoSpecific() when on the video page.'); 