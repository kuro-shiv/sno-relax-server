const express = require("express");
const cors = require("cors");
require("dotenv").config();

require("dotenv").config();

// ✅ Import routes
const authRoutes = require("./routes/authRoutes");
const chatbotRoutes = require("./routes/chatbotRoutes");
const communityRoutes = require("./routes/communityRoutes");
const moodRoutes = require("./routes/moodRoutes");

const app = express();

// ✅ Allowed frontend origins from .env
const allowedOrigins = [
  "https://sno-relax-client.vercel.app",
  "http://localhost:3000",
  "https://sno-relax-client-mt4osahbd-kuro-shivs-projects.vercel.app",
];

// CORS middleware
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

// Body parser
app.use(express.json());

// ✅ Root check
app.get("/", (req, res) => {
  res.send("✅ SnoRelax Backend is running. Use /api/... endpoints.");
});

// ✅ Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatbotRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/moods", moodRoutes);

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
