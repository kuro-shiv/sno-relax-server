const express = require("express");
const cors = require("cors");
require("dotenv").config();
const path = require("path");

// Routes
const authRoutes = require("./routes/authRoutes");
const communityRoutes = require("./routes/communityRoutes");
const moodRoutes = require("./routes/moodRoutes");

const app = express();

// Allowed origins
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error("Not allowed by CORS: " + origin));
  },
  credentials: true,
}));

// MongoDB
const connectDB = require("./db");
connectDB();

// Body parser
app.use(express.json());

// Normalize URLs
app.use((req, res, next) => {
  req.url = req.url.replace(/\/{2,}/g, "/");
  next();
});

// Root check
app.get("/", (req, res) => res.send("✅ SnoRelax Backend running"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/moods", moodRoutes);

// 404
app.use((req, res) => res.status(404).json({ error: "Endpoint not found" }));

// Error handler
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err.stack);
  res.status(500).json({ error: err.message || "Internal Server Error" });
});

// Start server
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
