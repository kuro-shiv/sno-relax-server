// routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const ChatHistory = require("../models/ChatHistory");
const Content = require("../models/Content"); // if you have content schema

// ------------------ USERS ------------------

// Get all users
router.get("/users", async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }); // latest first
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Get single user by ID
router.get("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// ------------------ CHAT HISTORY ------------------

// Get all chat history
router.get("/chats", async (req, res) => {
  try {
    const chats = await ChatHistory.find()
      .populate("userId", "firstName lastName email") // populate user info
      .sort({ timestamp: -1 });
    res.json(chats);
  } catch (err) {
    console.error("Error fetching chats:", err);
    res.status(500).json({ error: "Failed to fetch chat history" });
  }
});

// ------------------ CONTENT (Optional) ------------------

// Get all content
router.get("/content", async (req, res) => {
  try {
    const content = await Content.find().sort({ createdAt: -1 });
    res.json(content);
  } catch (err) {
    console.error("Error fetching content:", err);
    res.status(500).json({ error: "Failed to fetch content" });
  }
});

module.exports = router;
