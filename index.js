// // server.js
// const express = require("express");
// const cors = require("cors");
// const fetch = require("node-fetch");
// require("dotenv").config();
// const path = require("path");

// // DB Connection
// const connectDB = require("./db");
// connectDB();

// // Routes
// const authRoutes = require("./routes/authRoutes");
// const communityRoutes = require("./routes/communityRoutes");
// const moodRoutes = require("./routes/moodRoutes");
// const chatRoutes = require("./routes/chatbotRoutes");
// const adminRoutes = require("./routes/adminRoutes");

// // Import community helpers for Socket.IO
// const { readCommunity, writeCommunity } = require("./routes/communityRoutes");

// const app = express();

// // -------------------- CORS --------------------
// // const allowedOrigins = process.env.ALLOWED_ORIGINS
// //   ? process.env.ALLOWED_ORIGINS.split(",")
// //   : ["*"];
// // const allowedOrigins = process.env.ALLOWED_ORIGINS
// //   ?["*"]
// //   : ["*"];


// const allowedOrigins = [
//   "https://sno-relax-client.vercel.app", // your Vercel frontend
//   "http://localhost:3000",                // for local testing
// ];


// app.use(
//   cors({
//     origin: (origin, callback) => {
//       if (!origin || allowedOrigins.includes(origin)) {
//         callback(null, true);
//       } else {
//         console.error("❌ Blocked by CORS:", origin);
//         callback(new Error("Not allowed by CORS"));
//       }
//     },
//     credentials: true,
//   })
// );

// app.use(express.json());

// // -------------------- URL Normalizer --------------------
// app.use((req, res, next) => {
//   req.url = req.url.replace(/\/{2,}/g, "/");
//   next();
// });

// // -------------------- Root Route --------------------
// app.get("/", (req, res) => {
//   res.send("✅ SnoRelax Backend is running. Use /api/... endpoints.");
// });

// // -------------------- Mount Routes --------------------
// app.use("/api/auth", authRoutes);
// app.use("/api/community", communityRoutes);
// app.use("/api/moods", moodRoutes);
// app.use("/api/chat", chatRoutes);
// app.use("/api/admin", adminRoutes);

// // -------------------- 404 Handler --------------------
// app.use((req, res) => res.status(404).json({ error: "Endpoint not found" }));

// // -------------------- Global Error Handler --------------------
// app.use((err, req, res, next) => {
//   console.error("🔥 Server Error:", err.stack);
//   res.status(500).json({ error: err.message || "Internal Server Error" });
// });

// // -------------------- Socket.IO --------------------
// const http = require("http");
// const { Server } = require("socket.io");

// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: process.env.ALLOWED_ORIGINS?.split(",") || "*",
//     credentials: true,
//   },
// });

// io.on("connection", (socket) => {
//   console.log("🔌 New client connected:", socket.id);

//   socket.on("joinGroup", (groupId) => socket.join(groupId));
//   socket.on("leaveGroup", (groupId) => socket.leave(groupId));

//   socket.on("sendMessage", ({ groupId, message }) => {
//     // Broadcast to everyone in the group except sender
//     socket.to(groupId).emit("newMessage", message);

//     // Save message to backend file
//     const db = readCommunity();
//     if (!db.messages) db.messages = [];
//     db.messages.push(message);
//     writeCommunity(db);
//   });

//   socket.on("disconnect", () => console.log("❌ Client disconnected:", socket.id));
// });

// // -------------------- Start Server --------------------
// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => console.log(`🚀 SnoRelax server running on port ${PORT}`));


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

// Import community helpers for Socket.IO
const { readCommunity, writeCommunity } = require("./routes/communityRoutes");

const app = express();

// -------------------- CORS --------------------
const allowedOrigins = [
  "https://sno-relax-client.vercel.app",
   "https://sno-relax-admin.vercel.app",                                             // ✅ Production frontend (Vercel)
  "http://localhost:3000",               // ✅ Local testing
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like curl or Postman)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.error("❌ Blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
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

// -------------------- Mount Routes --------------------
app.use("/api/auth", authRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/moods", moodRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/admin", adminRoutes);

// -------------------- 404 Handler --------------------
app.use((req, res) => res.status(404).json({ error: "Endpoint not found" }));

// -------------------- Global Error Handler --------------------
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err.stack);
  res.status(500).json({ error: err.message || "Internal Server Error" });
});

// -------------------- Socket.IO --------------------
const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("🔌 New client connected:", socket.id);

  socket.on("joinGroup", (groupId) => socket.join(groupId));
  socket.on("leaveGroup", (groupId) => socket.leave(groupId));

  socket.on("sendMessage", ({ groupId, message }) => {
    // Broadcast to everyone in the group except sender
    socket.to(groupId).emit("newMessage", message);

    // Save message to backend file
    const db = readCommunity();
    if (!db.messages) db.messages = [];
    db.messages.push(message);
    writeCommunity(db);
  });

  socket.on("disconnect", () => console.log("❌ Client disconnected:", socket.id));
});

// -------------------- Start Server --------------------
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 SnoRelax server running on port ${PORT}`));
