const axios = require("axios");

// Now uses the unified /chat endpoint (same as medicine search)
const AI_URL = process.env.AI_AGENT_URL || "http://127.0.0.1:8000";

const getTriageResponse = async (req, res) => {
  const { message, thread_id } = req.body;

  if (!message) {
    return res.status(400).json({ message: "message field is required." });
  }

  try {
    const pythonRes = await axios.post(`${AI_URL}/chat`, {
      query: message,
      thread_id: thread_id,
    });

    const { response, department, is_emergency, thread_id: returnedThreadId } = pythonRes.data;

    return res.status(200).json({
      reply: response,
      department,
      is_emergency,
      thread_id: returnedThreadId,
    });
  } catch (error) {
    console.error("Triage proxy error:", error.message);
    return res.status(503).json({
      reply: "AI is temporarily unavailable. Please contact hospital reception.",
      is_emergency: false,
    });
  }
};

module.exports = { getTriageResponse };
