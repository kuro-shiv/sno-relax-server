// index.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const path = require("path");
const { spawn } = require("child_process");

// ✅ Import routes
const authRoutes = require("./routes/authRoutes");
const communityRoutes = require("./routes/communityRoutes");
const moodRoutes = require("./routes/moodRoutes");

const app = express();

// ✅ Allowed frontend origins
const allowedOrigins = [
  "https://sno-relax-client.vercel.app",
  "http://localhost:3000",
  "https://sno-relax-client-mt4osahbd-kuro-shivs-projects.vercel.app",
];

// ✅ CORS middleware
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn("❌ Blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS: " + origin));
      }
    },
    credentials: true,
  })
);

// ✅ Handle preflight requests
app.options("*", cors());

// ✅ Body parser
app.use(express.json());

// ✅ Root check
app.get("/", (req, res) => {
  res.send("✅ SnoRelax Backend is running. Use /api/... endpoints.");
});

// ✅ Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/moods", moodRoutes);

// ✅ Chatbot route (Python integration)
app.use("/api/chat", (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Message required" });

  const pythonScript = path.join(__dirname, "./models/chat_model.py");
  const python = spawn("python", [pythonScript, message]);

  let result = "";

  python.stdout.on("data", (data) => {
    result += data.toString();
  });

  python.stderr.on("data", (err) => {
    console.error("Python error:", err.toString());
  });

  python.on("close", () => {
    if (!result) result = "⚠️ No response from Python script.";
    res.json({ sender: "bot", text: result.trim() });
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err.stack);
  res.status(500).json({ error: err.message || "Internal Server Error" });
});

// ✅ Start server
const port = process.env.PORT || 5000;
app.listen(port, () =>
  console.log(`🚀 SnoRelax server running on port ${port}`)
);
