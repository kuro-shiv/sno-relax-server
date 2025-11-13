// server entry - restored to previous working state
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");

// Database connection
const connectDB = require("./db");
connectDB();

// Routes
const authRoutes = require("./routes/authRoutes");
const communityRoutes = require("./routes/communityRoutes");
const communityMongoRoutes = require("./routes/communityMongoRoutes");
const moodRoutes = require("./routes/moodRoutes");
const chatRoutes = require("./routes/chatbotRoutes");
const adminRoutes = require("./routes/adminRoutes");
const translateRoutes = require("./routes/translateRoutes");

// ⭐ NEW — Chat History Route
const chatHistoryRoutes = require("./routes/chatHistoryRoutes");

const app = express();

// -------------------- CORS --------------------
const allowedOrigins = [
  "https://sno-relax-client.vercel.app",
  "https://sno-relax-admin.vercel.app",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.some((allowed) => origin.startsWith(allowed))) {
        callback(null, true);
      } else {
        console.error("❌ Blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json());

// -------------------- URL Normalizer --------------------
app.use((req, res, next) => {
  req.url = req.url.replace(/\/\/{2,}/g, "/");
  next();
});

// -------------------- Root Route --------------------
app.get("/", (req, res) => {
  res.send("✅ SnoRelax Backend is running. Use /api/... endpoints.");
});

// -------------------- Mount Routes --------------------
app.use("/api/auth", authRoutes);

// legacy file-backed community routes remain available under /api/community/legacy
app.use("/api/community/legacy", communityRoutes);

// mongo-backed community API (preferred)
app.use("/api/community", communityMongoRoutes);

app.use("/api/moods", moodRoutes);

// Your chatbot route
app.use("/api/chat", chatRoutes);

// ⭐ NEW — chat history route
app.use("/api/chat/history", chatHistoryRoutes);

app.use("/api/admin", adminRoutes);
app.use("/api/translate", translateRoutes);

// -------------------- 404 Handler --------------------
app.use((req, res) => res.status(404).json({ error: "Endpoint not found" }));

// -------------------- Global Error Handler --------------------
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err && err.stack ? err.stack : err);
  res.status(500).json({ error: err && err.message ? err.message : "Internal Server Error" });
});

// -------------------- Socket.IO --------------------
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

// make io accessible to controllers
app.set("io", io);

// load socket handlers from sockets/communitySocket.js
try {
  require("./sockets/communitySocket")(io);
} catch (e) {
  console.error("Failed to load communitySocket:", e);
}

// -------------------- Start Server --------------------
const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`🚀 SnoRelax server running on port ${PORT}`)
);

module.exports = app;
