const axios = require('axios'); // 1. Phone uthaya

// 2. Python Agent ka Address
const PYTHON_AGENT_URL = 'http://127.0.0.1:8000/chat'; 


const getAiResponse = async (req, res) => {
    try {
        const { message } = req.body;

        
        if (!message) {
            return res.status(400).json({ message: "Please Ask Something!" });
        }

        // 3. Bridge Call (Node.js -> Python) 
        // Hum Node.js se keh rahe hain: "Jao Python ke paas, ye data leke, aur jawab leke aao."
        const response = await axios.post(PYTHON_AGENT_URL, {
            query: message 
        });

        // 4. Jawab User ko de do
        // Python returns { response: "...", thread_id: "..." }
        res.status(200).json({
            reply: response.data.response || "No response from AI.",
            success: true
        });

    } catch (error) {
        console.error("❌ Python Error:", error.message);
        res.status(503).json({ 
            message: "AI Agent abhi chai peene gaya hai (Server Down or Error)." 
        });
    }
};

module.exports = { getAiResponse };