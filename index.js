// server/index.js
const express = require("express");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
app.use(cors());
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

// ✅ Register & Generate ID
app.post("/api/create-user", (req, res) => {
  try {
    const { firstName, lastName, email, phone, city, latitude, longitude } = req.body;
    if (!firstName || !lastName || !email || !phone) {
      return res.status(400).json({ error: "All fields required" });
    }

    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();

    // First char of names
    const initials = `${firstName[0].toUpperCase()}${lastName[0].toUpperCase()}`;

    // City code (first 3 letters or NAN)
    const cityCode = city && city.length >= 3
      ? city.slice(0, 3).toUpperCase()
      : "NAN";

    // Unique hash from email + phone
    const hash = crypto
      .createHash("sha256")
      .update(email + phone)
      .digest("hex")
      .slice(0, 7); // short unique id like "anc20aa"

    const userId = `${initials}-${month}-${year}-${cityCode}-${hash}`;

    // Save
    const users = readUsers();
    const user = { userId, firstName, lastName, email, phone, city, latitude, longitude };
    users.push(user);
    writeUsers(users);

    console.log("✅ User saved:", user);

    return res.json({ ok: true, userId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal error" });
  }
});

// ✅ Login with existing ID
app.post("/api/login", (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "User ID required" });

  const users = readUsers();
  const user = users.find((u) => u.userId === userId);

  if (!user) return res.status(404).json({ error: "User not found" });

  res.json({ ok: true, user });
});

app.listen(5000, () => {
  console.log("🚀 Server running at http://localhost:5000");
});


// server/index.js (add below your login route)

// ✅ Chatbot API
app.post("/api/chat", (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Message required" });
  }

  let reply = "I'm here for you 💙. Tell me more.";

  // Simple keyword rules
  if (message.toLowerCase().includes("sad")) {
    reply = "I'm sorry you're feeling sad 😔. Remember, it's okay to feel this way.";
  } else if (message.toLowerCase().includes("happy")) {
    reply = "That's wonderful! 🎉 Keep enjoying the good vibes!";
  } else if (message.toLowerCase().includes("stress")) {
    reply = "Try closing your eyes and taking a deep breath 🌿.";
  } else if (message.toLowerCase().includes("angry")) {
    reply = "It helps to pause and count to 10. You're not alone 💚.";
  }

  res.json({ sender: "bot", text: reply });
});
