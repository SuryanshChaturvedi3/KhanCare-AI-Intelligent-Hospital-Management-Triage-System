// 1. IMPORTS (Staff ko bulao)
const express = require("express"); // Ye 'Manager' hai (Server)
const cors = require("cors"); // Ye 'Security Guard' hai (React ko aane dega)
const axios = require("axios"); // Ye 'Phone' hai (Python se baat karne ke liye)
require("dotenv").config(); // Ye 'Tijori' ki chabhi hai (Passwords ke liye)
const mongoose = require('mongoose')
const authRoutes = require('./routes/authRoutes'); // Ye 'HR Department' hai (User Registration ke liye)
const cookieParser = require('cookie-parser');

const aiRoutes = require('./routes/aiRoutes');
const appointRoutes = require("./routes/appointmentRoutes");
const triageRoutes = require('./routes/triageRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

/*------------------DATABASE CONNECTION------------------*/
mongoose
      .connect(process.env.MONGO_URI)
      .then(() => console.log("✅ MongoDB Connected Successfully!"))
      .catch((err) => console.error("❌MongoDb Not Connected:", err.message));



/*------------------MIDDLEWARES------------------*/

// CORS Configuration - Must be before routes
// WHY env var: In production, frontend runs on a different domain (e.g., khancare.onrender.com)
// Hardcoding localhost would block all production requests
app.use(cors({
   origin: process.env.FRONTEND_URL || "http://localhost:5173",
   credentials: true
}));
app.use(express.json()); // JSON ko samajhne do (Data ke liye)
app.use(cookieParser());
/*------------------ROUTES------------------*/

// Route 1: Health Check (Bas dekhne ke liye ki server zinda hai)
app.get("/", (req, res) => {
  res.send("✅ Node.js Backend Zinda Hai aur Chal Raha Hai!");
});

app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/appointments', appointRoutes);
app.use('/api/triage', triageRoutes);




//Step A: Customer (React) se sawal lo
app.post("/api/chat", async (req, res) => {
  const { query, thread_id } = req.body;
  console.log("📩 User ne pucha:", query);

// Step B: Python Agent (Port 8000) ko Phone lagao (Axios)
  try {
    const AI_URL = process.env.AI_AGENT_URL || "http://127.0.0.1:8000";
    const pythonResponse = await axios.post(`${AI_URL}/chat`, {
      query: query,
      thread_id: thread_id,
    });

// Step C: Python ka jawab Customer (React) ko wapas do
    res.json(pythonResponse.data);
  } catch (error) {
    console.error(" Python se baat nahi ho paayi:", error.message);
    res.status(500).json({
      response: "Maaf karein, Python Server Band Hai.",
      tool_used: false,
    });
  }
});


app.listen(PORT, () => {
  console.log(`🚀 Server Started At: ${PORT}!`);
  console.log(`🔗 Link: http://localhost:${PORT}`);
})
