const axios = require('axios');

const AI_URL = process.env.AI_AGENT_URL || 'http://127.0.0.1:8000';

const getAiResponse = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ message: "Please Ask Something!" });
        }

        const response = await axios.post(`${AI_URL}/chat`, {
            query: message
        });

        res.status(200).json({
            reply: response.data.response || "No response from AI.",
            department: response.data.department || null,
            is_emergency: response.data.is_emergency || false,
            success: true
        });

    } catch (error) {
        console.error("AI Error:", error.message);
        res.status(503).json({
            message: "AI Agent is temporarily unavailable."
        });
    }
};

module.exports = { getAiResponse };
