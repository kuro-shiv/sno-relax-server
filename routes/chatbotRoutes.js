// routes/chatbotRoutes.js
const express = require("express");
const router = express.Router();

// ✅ Chatbot endpoint
router.post("/", (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Message required" });

  let reply = "I'm here for you 💙. Tell me more.";

  const msg = message.toLowerCase();
  if (msg.includes("sad"))
    reply = "I'm sorry you're feeling sad 😔. Remember, it's okay to feel this way.";
  else if (msg.includes("happy"))
    reply = "That's wonderful! 🎉 Keep enjoying the good vibes!";
  else if (msg.includes("stress"))
    reply = "Try closing your eyes and taking a deep breath 🌿.";
  else if (msg.includes("angry"))
    reply = "It helps to pause and count to 10. You're not alone 💚.";

  res.json({ sender: "bot", text: reply });
});

module.exports = router;
