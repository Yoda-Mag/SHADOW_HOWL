const { GoogleGenAI } = require("@google/genai");

// Initialize with API key - tries multiple sources
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

if (!apiKey) {
  console.warn('GEMINI_API_KEY not found in environment variables. AI features will not work.');
}

const ai = new GoogleGenAI({ apiKey: apiKey });

exports.askAssistant = async (req, res) => {
    try {
        const { prompt } = req.body;

        const response = await ai.models.generateContent({
            // Using the Gemini 2.0 Flash model
            model: "gemini-2.0-flash", 
            contents: [
                {
                    role: "user",
                    parts: [{ text: `You are Shadow Howl's charismatic AI Forex Coach. Answer this briefly: ${prompt}. MANDATORY: End with 'This is not financial advice. Trade at your own risk.'` }]
                }
            ]
        });

        // Log the full response structure for debugging
        console.log('Gemini API Response:', JSON.stringify(response, null, 2));

        // Extract text from the response - handle different formats
        let answer = '';
        
        // Try different possible response structures
        if (response.candidates && response.candidates[0]?.content?.parts?.[0]?.text) {
            answer = response.candidates[0].content.parts[0].text;
        } else if (response.text) {
            answer = response.text;
        } else if (response.content?.parts?.[0]?.text) {
            answer = response.content.parts[0].text;
        } else if (typeof response === 'string') {
            answer = response;
        } else {
            console.error('Could not extract text from response:', response);
            answer = `Response received but could not extract text. Raw: ${JSON.stringify(response).substring(0, 200)}`;
        }

        console.log('Extracted answer:', answer);
        res.json({ success: true, answer });
    } catch (err) {
        console.error("Gemini API Error:", err);
        res.status(500).json({ error: `AI Error: ${err.message}` });
    }
};