const express = require("express");
const cors = require("cors");
require("dotenv").config();
const path = require("path");
const { spawn } = require("child_process");

// Routes
const authRoutes = require("./routes/authRoutes");
const communityRoutes = require("./routes/communityRoutes");
const moodRoutes = require("./routes/moodRoutes");

const app = express();

// ✅ Allowed frontend origins from .env
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : [];

// ✅ CORS
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

// ✅ MongoDB
const connectDB = require("./db");
connectDB().catch((err) => {
  console.error("❌ Failed to connect to MongoDB:", err);
  process.exit(1);
});

// ✅ Preflight
app.options("*", cors());

// ✅ Body parser
app.use(express.json());

// ✅ Normalize URLs
app.use((req, res, next) => {
  req.url = req.url.replace(/\/{2,}/g, "/");
  next();
});

// ✅ Root check
app.get("/", (req, res) => {
  res.send("✅ SnoRelax Backend is running. Use /api/... endpoints.");
});

// ✅ Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/moods", moodRoutes);

// ✅ Chatbot
app.post("/api/chat", (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Message required" });

  const pythonScript = path.join(__dirname, "./models/chat_model.py");
  const python = spawn("python3", [pythonScript]);

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

  python.stdin.write(message + "\n");
  python.stdin.end();
});

// 404 handler
app.use((req, res) => res.status(404).json({ error: "Endpoint not found" }));

// Error handler
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err.stack);
  res.status(500).json({ error: err.message || "Internal Server Error" });
});

// ✅ Start server
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`🚀 SnoRelax server running on port ${port}`));
