const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch"); // npm i node-fetch@2
require("dotenv").config();
const path = require("path");
const { spawn } = require("child_process");

// Routes
const authRoutes = require("./routes/authRoutes");
const communityRoutes = require("./routes/communityRoutes");
const moodRoutes = require("./routes/moodRoutes");

const connectDB = require("./db");
connectDB();

const app = express();

// CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : [];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) callback(null, true);
      else callback(new Error("Not allowed by CORS: " + origin));
    },
    credentials: true,
  })
);
app.use(express.json());
app.options("*", cors());

// Normalize URLs
app.use((req, res, next) => {
  req.url = req.url.replace(/\/{2,}/g, "/");
  next();
});

// Root
app.get("/", (req, res) =>
  res.send("✅ SnoRelax Backend is running. Use /api/... endpoints.")
);

// Location proxy route
app.post("/api/location", async (req, res) => {
  const { latitude, longitude } = req.body;
  if (!latitude || !longitude) return res.json({ city: "NaN" });

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
    );
    const data = await response.json();
    const city =
      data.address?.city || data.address?.town || data.address?.village || "NaN";
    res.json({ city });
  } catch (err) {
    console.error("Nominatim fetch failed:", err);
    res.json({ city: "NaN" });
  }
});

// Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/moods", moodRoutes);

// Chatbot endpoint
app.post("/api/chat", (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Message required" });

  const pythonScript = path.join(__dirname, "./models/chat_model.py");
  const python = spawn("python3", [pythonScript]);

  let result = "";
  python.stdout.on("data", (data) => (result += data.toString()));
  python.stderr.on("data", (err) => console.error("Python error:", err.toString()));
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

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`🚀 SnoRelax server running on port ${port}`));
