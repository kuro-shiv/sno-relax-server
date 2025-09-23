const express = require("express");
const router = express.Router();
const cohere = require("cohere-ai");

// Initialize Cohere
cohere.init(process.env.COHERE_API_KEY);

router.post("/", async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Message required" });

  try {
    const response = await cohere.generate({
      model: "xlarge",
      prompt: `You are a friendly mental health chatbot. Respond to the user in a kind and supportive way.\nUser: ${message}\nBot:`,
      max_tokens: 60,
      temperature: 0.7,
      stop_sequences: ["User:", "Bot:"],
    });

    const botReply = response.body.generations[0].text.trim();
    res.json({ sender: "bot", text: botReply });
  } catch (err) {
    console.error("Cohere error:", err);
    res.status(500).json({
      sender: "bot",
      text: "⚠️ Sorry, the bot is currently unavailable.",
    });
  }
});

module.exports = router;
