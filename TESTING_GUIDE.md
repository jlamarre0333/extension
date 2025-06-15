# Citation Detection Testing Guide

## 🚀 Quick Setup

1. **Load the Extension:**
   ```bash
   # Copy the manifest for testing
   cp manifest-test-citations.json manifest.json
   
   # Load in Chrome: 
   # 1. Go to chrome://extensions/
   # 2. Enable "Developer mode"
   # 3. Click "Load unpacked"
   # 4. Select this folder
   ```

2. **Look for the Button:**
   - Purple "Citations" button should appear on the right side of YouTube videos
   - Should show immediately when you navigate to any video
   - Should work when switching between videos without page refresh

## 🎯 Test Videos (High Citation Probability)

### Books & Academic Content
1. **Book Reviews:**
   - Search: "best books 2024" or "book recommendations"
   - Expected: Book titles, author names
   
2. **Educational Channels:**
   - Search: "crash course psychology" or "3blue1brown"
   - Expected: Research papers, academic studies

3. **Business/Self-Help:**
   - Search: "atomic habits book review" 
   - Expected: "Atomic Habits by James Clear"

### Product Reviews
1. **Tech Reviews:**
   - Search: "iPhone 15 Pro Max review"
   - Expected: Product names, model numbers
   
2. **Gadget Unboxings:**
   - Search: "MacBook Air M2 unboxing"
   - Expected: Product specifications

### Academic/Research Content
1. **Science Channels:**
   - Search: "Veritasium" or "MinutePhysics"
   - Expected: Scientific studies, journal names

## 🧪 Testing Checklist

### Navigation Tests
- [ ] Button appears on first video load
- [ ] Button stays visible when switching videos
- [ ] Button works after going Home → Watch → New Video
- [ ] UI cleans up when leaving YouTube

### Detection Tests
- [ ] Detects book titles in quotes
- [ ] Finds "Title by Author" patterns
- [ ] Identifies product names (iPhone, MacBook, etc.)
- [ ] Catches academic references (journals, studies)
- [ ] Shows confidence scores appropriately

### UI Tests
- [ ] Citations sidebar opens/closes smoothly
- [ ] Loading spinner shows during analysis
- [ ] Results display with proper formatting
- [ ] Action buttons (Google Books, Amazon) work
- [ ] No duplicate citations shown

## 🐛 Common Issues to Watch For

1. **Button Disappears:** Should be fixed with new video detection
2. **Duplicate Citations:** Check removeDuplicates function
3. **False Positives:** Note any weird detections
4. **API Failures:** Check if Google Books links work
5. **Performance:** Watch for slow loading

## 📝 Test Log Template

```
Video URL: 
Expected Citations: 
Detected Citations: 
False Positives: 
Missed Citations: 
UI Issues: 
Performance Notes: 
```

## 🎉 Success Criteria

- ✅ Button shows on every video page
- ✅ Detects 80%+ of obvious book/product mentions  
- ✅ Less than 20% false positive rate
- ✅ UI works smoothly across video switches
- ✅ No console errors during normal operation 