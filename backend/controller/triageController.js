const axios = require("axios");

const PYTHON_TRIAGE_URL = "http://127.0.0.1:8000/triage";

const getTriageResponse = async (req, res) => {
  const { message, thread_id } = req.body;

  if (!message) {
    return res.status(400).json({ message: "message field is required." });
  }

  console.log("Triage request received");

  try {
    const pythonRes = await axios.post(PYTHON_TRIAGE_URL, {
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
      reply: "MediStep AI is temporarily unavailable. Please contact the hospital reception.",
      is_emergency: false,
    });
  }
};

module.exports = { getTriageResponse };
