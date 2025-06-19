# 🔑 API Setup Guide

## OpenAI API Key Configuration

To use the Smart Citations extension with ChatGPT/GPT-4.1 Mini, you need to configure your OpenAI API key.

### 📋 Steps:

1. **Get your OpenAI API Key:**
   - Go to [OpenAI Platform](https://platform.openai.com)
   - Sign up/login and go to "API Keys"
   - Create a new secret key
   - Copy the key (starts with `sk-proj-...`)

2. **Configure the Extension:**
   - Open `llm-config.js` in your extension folder
   - Replace `REPLACE_WITH_YOUR_OPENAI_API_KEY` with your actual API key
   - Save the file

3. **Example Configuration:**
   ```javascript
   openai: {
     apiKey: 'sk-proj-your-actual-key-here',
     model: 'gpt-4.1-mini',
     baseURL: 'https://api.openai.com/v1'
   }
   ```

4. **Reload Extension:**
   - Go to `chrome://extensions/`
   - Click reload on the Smart Citations extension
   - The extension is now ready to use!

### 💰 Cost Information:
- **GPT-4.1 Mini**: ~$0.05/month for 100 videos
- Very cost-effective for the quality and capabilities

### 🔒 Security Note:
- Never commit your API key to version control
- Keep your API key private and secure
- If compromised, regenerate it immediately at OpenAI Platform
- The `.gitignore` file protects against accidental commits

### ❓ Troubleshooting:
- **"Error Loading Academic Papers"**: Check your API key is correct
- **"Failed to connect to AI service"**: Verify internet connection and API key
- **Rate limits**: OpenAI has usage limits; wait a few minutes if exceeded

### 🎓 Features Enabled with API Key:
- **Academic Paper Suggestions**: GPT analyzes video content and suggests relevant research papers
- **Enhanced Citation Detection**: More accurate identification of references
- **Smart Analysis**: Better understanding of video topics and context 