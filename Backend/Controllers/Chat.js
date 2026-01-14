const { GoogleGenAI } = require("@google/genai");

// The client automatically looks for GEMINI_API_KEY in your .env
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

exports.askAssistant = async (req, res) => {
    try {
        const { prompt } = req.body;

        const response = await ai.models.generateContent({
            // Using the new stable flash model
            model: "gemini-3-flash-preview", 
            contents: [
                {
                    role: "user",
                    parts: [{ text: `You are the Shadow Howl AI Coach. Answer this: ${prompt}. MANDATORY: End with 'This is not financial advice. Trade at your own risk.'` }]
                }
            ]
        });

        res.json({ success: true, answer: response.text });
    } catch (err) {
        console.error("New SDK Error:", err);
        res.status(500).json({ error: "AI is calibrating. Please try again." });
    }
};