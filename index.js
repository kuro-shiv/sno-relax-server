const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
require("dotenv").config();
// const { spawn } = require("child_process"); // old Python chatbot, keep commented
const path = require("path");

// Routes
const authRoutes = require("./routes/authRoutes");
const communityRoutes = require("./routes/communityRoutes");
const moodRoutes = require("./routes/moodRoutes");
const chatRoutes = require("./routes/chatbotRoutes"); // Cohere chatbot
const adminRoutes = require("./routes/adminRoutes");


const connectDB = require("./db");
connectDB();

const app = express();

// CORS setup
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];
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


// Normalize URLs
app.use((req, res, next) => {
  req.url = req.url.replace(/\/{2,}/g, "/");
  next();
});

// Root
app.get("/", (req, res) =>
  res.send("✅ SnoRelax Backend is running. Use /api/... endpoints.")
);

// Admin routes
app.use("/api/admin", adminRoutes);


// Location proxy
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

// Mount all routes
app.use("/api/auth", authRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/moods", moodRoutes);
app.use("/api/chat", chatRoutes); // ✅ Cohere chatbot route

// ----------------- OLD PYTHON CHATBOT (commented) -----------------
// app.post("/api/chat", (req, res) => {
//   const { message } = req.body;
//   if (!message) return res.status(400).json({ error: "Message required" });

//   const pythonScript = path.join(__dirname, "./models/chat_model.py");
//   const python = spawn("python3", [pythonScript]);

//   let result = "";
//   python.stdout.on("data", (data) => (result += data.toString()));
//   python.stderr.on("data", (err) =>
//     console.error("Python error:", err.toString())
//   );
//   python.on("close", () => {
//     if (!result) result = "⚠️ No response from Python script.";
//     res.json({ sender: "bot", text: result.trim() });
//   });

//   python.stdin.write(message + "\n");
//   python.stdin.end();
// });
// ------------------------------------------------------------------

// 404 handler
app.use((req, res) => res.status(404).json({ error: "Endpoint not found" }));

// Error handler
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err.stack);
  res.status(500).json({ error: err.message || "Internal Server Error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 SnoRelax server running on port ${PORT}`)
);
