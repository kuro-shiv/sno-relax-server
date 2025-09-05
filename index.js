const express = require("express");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const moodRoutes = require("./routes/moodRoutes"); // ✅ Import mood routes
const communityRoutes = require("./routes/communityRoutes");

const app = express();
require("dotenv").config();

// ✅ Allowed frontend origins
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "").split(",");

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  })
);

app.use(express.json());

const USERS_FILE = path.join(__dirname, "users.json");

// Helpers
function readUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  return JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
}
function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// ✅ Root route (for testing)
app.get("/", (req, res) => {
  res.send("✅ SnoRelax Backend is running. Use /api/... endpoints.");
});

// Register user
app.post("/api/create-user", (req, res) => {
  const { firstName, lastName, email, phone, city, latitude, longitude } =
    req.body;
  if (!firstName || !lastName || !email || !phone)
    return res.status(400).json({ error: "All fields required" });

  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  const initials = `${firstName[0].toUpperCase()}${lastName[0].toUpperCase()}`;
  const cityCode =
    city && city.length >= 3 ? city.slice(0, 3).toUpperCase() : "NAN";
  const hash = crypto
    .createHash("sha256")
    .update(email + phone)
    .digest("hex")
    .slice(0, 7);
  const userId = `${initials}-${month}-${year}-${cityCode}-${hash}`;

  const users = readUsers();
  const user = {
    userId,
    firstName,
    lastName,
    email,
    phone,
    city,
    latitude,
    longitude,
  };
  users.push(user);
  writeUsers(users);

  res.json({ ok: true, userId });
});

// Login
app.post("/api/login", (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "User ID required" });

  const users = readUsers();
  const user = users.find((u) => u.userId === userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  res.json({ ok: true, user });
});

// Chatbot
app.post("/api/chat", (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Message required" });

  let reply = "I'm here for you 💙. Tell me more.";
  if (message.toLowerCase().includes("sad"))
    reply =
      "I'm sorry you're feeling sad 😔. Remember, it's okay to feel this way.";
  else if (message.toLowerCase().includes("happy"))
    reply = "That's wonderful! 🎉 Keep enjoying the good vibes!";
  else if (message.toLowerCase().includes("stress"))
    reply = "Try closing your eyes and taking a deep breath 🌿.";
  else if (message.toLowerCase().includes("angry"))
    reply = "It helps to pause and count to 10. You're not alone 💚.";

  res.json({ sender: "bot", text: reply });
});
// Community routes
app.use("/api/community", communityRoutes);

// ✅ Mount MoodTracker routes
app.use("/api/moods", moodRoutes);

// ✅ Dynamic port
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
