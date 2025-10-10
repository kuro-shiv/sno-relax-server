// server.js
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
require("dotenv").config();
const path = require("path");

// DB Connection
const connectDB = require("./db");
connectDB();

// Routes
const authRoutes = require("./routes/authRoutes");
const communityRoutes = require("./routes/communityRoutes");
const moodRoutes = require("./routes/moodRoutes");
const chatRoutes = require("./routes/chatbotRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

// -------------------- CORS --------------------
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["*"]; // fallback for all

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.error("❌ Blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

// -------------------- URL Normalizer --------------------
app.use((req, res, next) => {
  req.url = req.url.replace(/\/{2,}/g, "/");
  next();
});

// -------------------- Root Route --------------------
app.get("/", (req, res) => {
  res.send("✅ SnoRelax Backend is running. Use /api/... endpoints.");
});

// -------------------- Location Proxy --------------------
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
    console.error("🌍 Nominatim fetch failed:", err);
    res.json({ city: "NaN" });
  }
});

// -------------------- Mount Routes --------------------
app.use("/api/auth", authRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/moods", moodRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/admin", adminRoutes); // ✅ Admin APIs

// -------------------- 404 Handler --------------------
app.use((req, res) => res.status(404).json({ error: "Endpoint not found" }));

// -------------------- Global Error Handler --------------------
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err.stack);
  res.status(500).json({ error: err.message || "Internal Server Error" });
});

// -------------------- Server Start --------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 SnoRelax server running on port ${PORT}`)
);
