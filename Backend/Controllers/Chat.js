const { GoogleGenAI } = require("@google/genai");

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

if (!apiKey) {
  console.warn(' GEMINI_API_KEY not found. AI features will fail until added to GitHub Secrets.');
}

// Only initialize if API key is available, otherwise use a stub
let genAI = null;
try {
  if (apiKey) {
    genAI = new GoogleGenAI(apiKey);
  }
} catch (err) {
  console.error('Failed to initialize GoogleGenAI:', err.message);
}

exports.askAssistant = async (req, res) => {
  try {
    const { prompt } = req.body;

    // Check if API is initialized
    if (!genAI) {
      return res.status(503).json({ 
        success: false, 
        error: "AI service is not available. Please ensure GEMINI_API_KEY is configured."
      });
    }

    // Get the Gemini 1.5 Flash model (free tier)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Generate content using the standard method
    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{ 
          text: `You are Shadow Howl's charismatic AI Forex Coach. Answer this briefly: ${prompt}. MANDATORY: End with 'This is not financial advice. Trade at your own risk.'` 
        }]
      }]
    });

    // Extract text using the SDK helper
    const response = await result.response;
    const answer = response.text();

    console.log('Successfully generated AI response');
    res.json({ success: true, answer });

  } catch (err) {
    console.error("Gemini API Error:", err);
    
    // Fallback so the Admin panel doesn't crash if the AI is down
    res.status(500).json({ 
      success: false, 
      error: "AI is currently resting. Please try again in a moment.",
      details: err.message 
    });
  }
};