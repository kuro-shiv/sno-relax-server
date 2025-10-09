// routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const ChatHistory = require("../models/ChatHistory");

// ----------------- USERS -----------------

// Get all users
router.get("/users", async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Internal Server Error" });
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
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ----------------- CHATS -----------------

// Get chat history (optionally filter by user)
router.get("/chats", async (req, res) => {
  try {
    const { userId } = req.query;
    let query = {};
    if (userId) query.userId = userId;
    const chats = await ChatHistory.find(query).sort({ timestamp: -1 });
    res.json(chats);
  } catch (err) {
    console.error("Error fetching chats:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ----------------- STATS -----------------

router.get("/stats", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalChats = await ChatHistory.countDocuments();

    res.json({
      totalUsers,
      totalChats,
    });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
