const { GoogleGenAI } = require("@google/genai");

// The new SDK handles the initialization differently
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

if (!apiKey) {
    console.warn(' GEMINI_API_KEY not found. AI features will fail until added to GitHub Secrets.');
}

// 2026 SDK Syntax: Create the AI instance
const ai = new GoogleGenAI({ 
    apiKey: apiKey,
    apiVersion: 'v1' 
});

exports.askAssistant = async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!apiKey) {
            return res.status(503).json({ 
                success: false, 
                error: "AI service is not configured (Missing API Key)." 
            });
        }

        // 2026 SDK Syntax: Call models.generateContent directly
        // We use gemini-3-flash for the free tier stability
        const result = await ai.models.generateContent({
            model: "gemini-3-flash", 
            contents: [{
                role: "user",
                parts: [{ 
                    text: `You are Shadow Howl's charismatic AI Forex Coach. Answer this briefly: ${prompt}. MANDATORY: End with 'This is not financial advice. Trade at your own risk.'` 
                }]
            }]
        });

        // Simplified extraction in the new SDK
        const answer = result.candidates[0].content.parts[0].text;

        console.log('Successfully generated AI response');
        res.json({ success: true, answer });

    } catch (err) {
        console.error("Gemini API Error:", err);
        res.status(500).json({ 
            success: false, 
            error: "AI is currently resting. Please try again later.",
            details: err.message 
        });
    }
};