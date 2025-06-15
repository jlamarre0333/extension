# Fact-Checking Feature Design

## 🎯 Overview
Add intelligent fact-checking to the Citation Cross-Reference Extension, automatically verifying claims made in educational YouTube videos and providing context.

## 🔍 Claim Detection Patterns

### Geographic Claims
```javascript
const geographicPatterns = [
  // Population: "Iran has 85 million people"
  /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+has\s+([\d,]+(?:\.\d+)?)\s*(?:million|thousand|billion)?\s+(?:people|population|inhabitants)/gi,
  
  // Area: "Iran covers 1.6 million square kilometers"
  /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:covers|spans|is)\s+([\d,]+(?:\.\d+)?)\s*(?:million|thousand)?\s+(?:square\s+)?(?:kilometers|miles|km)/gi,
  
  // Capital: "Tehran is the capital of Iran"
  /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+is\s+the\s+capital\s+of\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
  
  // Language: "Most Iranians speak Farsi"
  /(?:most|many)\s+([A-Z][a-z]+s?)\s+speak\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi
];
```

### Historical Claims
```javascript
const historicalPatterns = [
  // Year events: "Iran was called Persia until 1935"
  /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+was\s+(?:called|known\s+as)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+until\s+(\d{4})/gi,
  
  // Founded/established: "Tehran was founded in 1786"
  /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+was\s+(?:founded|established|built)\s+in\s+(\d{4})/gi,
  
  // Duration: "The Persian Empire lasted for 200 years"
  /(The\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+lasted\s+for\s+([\d,]+)\s+years/gi
];
```

### Cultural/Social Claims
```javascript
const culturalPatterns = [
  // Religion: "Most Iranians are Muslim"
  /(?:most|majority\s+of)\s+([A-Z][a-z]+s?)\s+are\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
  
  // Currency: "Iran's currency is the Rial"
  /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)'?s?\s+currency\s+is\s+the\s+([A-Z][a-z]+)/gi,
  
  // Government: "Iran is an Islamic Republic"
  /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+is\s+(?:a|an)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi
];
```

## 🌐 Verification APIs

### Primary Sources
1. **Wikipedia API**: Basic facts, demographics, geography
2. **REST Countries API**: Country statistics, currencies, languages
3. **World Bank API**: Economic data, population statistics
4. **CIA World Factbook**: Government data (if available)

### Implementation Example
```javascript
class FactChecker {
  async verifyGeographicClaim(country, claimType, claimedValue) {
    try {
      // Get data from multiple sources
      const wikiData = await this.getWikipediaData(country);
      const countryData = await this.getCountryData(country);
      
      const verification = {
        claim: `${country} ${claimType} ${claimedValue}`,
        status: 'verified', // verified, disputed, unverified
        confidence: 0.95,
        sources: [],
        actualValue: null,
        context: ''
      };
      
      // Verify population claims
      if (claimType.includes('population')) {
        const actualPop = countryData.population;
        const claimedPop = this.parseNumber(claimedValue);
        
        if (Math.abs(actualPop - claimedPop) / actualPop < 0.1) {
          verification.status = 'verified';
          verification.confidence = 0.9;
        } else {
          verification.status = 'disputed';
          verification.actualValue = this.formatNumber(actualPop);
        }
      }
      
      return verification;
    } catch (error) {
      return { status: 'unverified', error: error.message };
    }
  }
}
```

## 🎨 UI Integration

### Sidebar Tab Structure
```
📖 Citations | ✅ Fact-Check | 🔍 Context
```

### Fact-Check Display
```html
<div class="fact-check-item">
  <div class="claim-text">"Iran has 85 million people"</div>
  <div class="verification-status verified">
    ✅ Verified (95% confidence)
  </div>
  <div class="sources">
    Sources: Wikipedia, World Bank
  </div>
</div>

<div class="fact-check-item">
  <div class="claim-text">"Iran's currency is the Dollar"</div>
  <div class="verification-status disputed">
    ⚠️ Disputed - Actually: Iranian Rial
  </div>
  <div class="context">
    Iran's official currency is the Iranian Rial (IRR).
    US Dollars are sometimes used unofficially.
  </div>
</div>
```

## 📊 Context Enhancement

### For Travel Videos (like Iran example):
- **Safety Info**: Current travel advisories
- **Visa Requirements**: Entry requirements for different nationalities  
- **Cultural Context**: Religious practices, social norms
- **Historical Background**: Brief history of locations shown
- **Economic Context**: Cost of living, currency exchange rates

### Example Context Card:
```
🇮🇷 About Iran
Population: 85 million (2023)
Capital: Tehran
Currency: Iranian Rial (IRR)
Language: Persian (Farsi) 95%
Religion: Islam 99% (Shia 90%, Sunni 9%)
Government: Islamic Republic

Travel Info:
⚠️ Check current visa requirements
📍 US State Dept Travel Advisory: Level 4
💱 1 USD = ~42,000 IRR (unofficial rate)
```

## 🚀 Implementation Phases

### Phase 1: Basic Fact Detection
- Geographic claims (population, area, capital)
- Simple verification against Wikipedia/REST Countries
- Basic UI integration

### Phase 2: Enhanced Verification  
- Multiple source cross-referencing
- Confidence scoring algorithms
- Dispute detection and flagging

### Phase 3: Context Enhancement
- Travel advisories integration
- Cultural and historical context
- Real-time data updates

### Phase 4: Advanced Claims
- Economic/political statements
- Historical accuracy checking
- User feedback integration

## 🎯 Success Metrics
- **Accuracy**: 85%+ correct verifications
- **Coverage**: Detect 70%+ of factual claims
- **Speed**: Results within 3 seconds
- **User Satisfaction**: Positive feedback on information quality

This feature will make your extension the go-to tool for anyone wanting to learn from YouTube while staying informed with accurate information! 