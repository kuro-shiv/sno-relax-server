const express = require("express");
const router = express.Router();
const PrivateMessage = require("../models/PrivateMessage");

// Get private messages for a given userId (either sent or received)
router.get("/messages", async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "userId required" });

  try {
    const msgs = await PrivateMessage.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
    }).sort({ createdAt: 1 });
    res.json({ ok: true, messages: msgs });
  } catch (err) {
    console.error("Error fetching private messages:", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Post a private message (from user -> admin or admin -> user)
router.post("/message", async (req, res) => {
  const { senderId, receiverId, message } = req.body;
  if (!senderId || !receiverId || !message) return res.status(400).json({ error: "senderId, receiverId and message required" });

  try {
    const m = await PrivateMessage.create({ senderId, receiverId, message: String(message).trim() });
    // emit via socket if available
    const io = req.app && req.app.get("io");
    if (io && receiverId) {
      try {
        io.to(`user_${receiverId}`).emit("receivePrivateMessage", m);
      } catch (e) {
        console.warn("emit private message failed:", e.message);
      }
    }
    res.status(201).json({ ok: true, message: m });
  } catch (err) {
    console.error("Error saving private message:", err);
    res.status(500).json({ error: "Failed to save message" });
  }
});

module.exports = router;
