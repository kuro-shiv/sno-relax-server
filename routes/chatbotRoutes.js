const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");
const cohere = require("cohere-ai");
const ChatHistory = require("../models/ChatHistory");

const TRANSLATE_API = "https://libretranslate.com/translate";

// initialize Cohere if API key present
if (process.env.COHERE_API_KEY) {
  try {
    cohere.init(process.env.COHERE_API_KEY);
  } catch (e) {
    console.warn("Cohere init warning:", e.message || e);
  }
}

router.post("/", async (req, res) => {
  const { userId, message, lang = "auto" } = req.body;
  if (!message || !userId) return res.status(400).json({ error: "Message and userId required" });

  try {
    // -------- Translate to English if needed --------
    let translatedText = message;
    if (lang !== "en" && lang !== "auto") {
      const transRes = await fetch(TRANSLATE_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: message, source: lang, target: "en" }),
      });
      const data = await transRes.json();
      translatedText = data.translatedText || message;
    }

    // -------- Fetch previous chat history --------
    const previousChats = await ChatHistory.find({ userId }).sort({ createdAt: 1 });

    // Build prompt from history + current message
    let prompt = previousChats
      .map(chat => `User: ${chat.userMessage}\nBot: ${chat.botReply}`)
      .join("\n");
    if (prompt && prompt.length) prompt += "\n";
    prompt += `User: ${translatedText}\nBot:`;

    // -------- Use Cohere to generate reply (fallback to canned reply if no API key) --------
    let botReply = "";
    if (process.env.COHERE_API_KEY) {
      try {
        const response = await cohere.generate({
          model: "xlarge",
          prompt,
          max_tokens: 150,
          temperature: 0.7,
          k: 0,
          stop_sequences: ["\nUser:", "\nBot:"]
        });
        botReply = (response && response.body && response.body.generations && response.body.generations[0].text) || "";
        botReply = botReply.trim();
      } catch (err) {
        console.error("Cohere generate error:", err);
        botReply = "I'm still learning. Could you rephrase or ask another way?";
      }
    } else {
      // No Cohere key — return a helpful placeholder reply
      botReply = "(Cohere API key not configured) Hi — this is a placeholder bot. Install COHERE_API_KEY to enable the real bot.";
    }

    // -------- Store current chat --------
    try {
      await ChatHistory.create({
        userId,
        userMessage: message,
        botReply,
        language: lang
      });
    } catch (err) {
      console.error("Failed to store chat history:", err);
    }

    res.json({ sender: "bot", text: botReply });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ sender: "bot", text: "⚠️ Sorry, bot unavailable." });
  }
});

module.exports = router;
