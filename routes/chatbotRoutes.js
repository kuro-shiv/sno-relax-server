
const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");
const cohere = require("cohere-ai");
const ChatHistory = require("../models/ChatHistory");
const User = require("../models/User");

const TRANSLATE_API = "https://libretranslate.com/translate";
const HF_API_KEY = process.env.HF_API_KEY;

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
    // -------- Check user role --------
    let userRole = "user";
    try {
      const user = await User.findOne({ $or: [{ userId }, { _id: userId }] });
      if (user && user.role) userRole = user.role;
    } catch (err) {
      console.warn("User role check failed:", err);
    }

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

    // -------- Use Cohere to generate reply, fallback to Hugging Face if no Cohere --------
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
    } else if (HF_API_KEY) {
      // Hugging Face fallback
      try {
        const hfRes = await fetch("https://api-inference.huggingface.co/models/facebook/blenderbot-3B", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${HF_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ inputs: translatedText })
        });
        const hfData = await hfRes.json();
        botReply = hfData.generated_text || "[No reply from Hugging Face]";
      } catch (err) {
        console.error("Hugging Face error:", err);
        botReply = "Bot unavailable. Please try again later.";
      }
    } else {
      // No Cohere or Hugging Face key — return a helpful placeholder reply
      botReply = "(No bot API key configured) Hi — this is a placeholder bot. Install COHERE_API_KEY or HF_API_KEY to enable the real bot.";
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

    res.json({ sender: "bot", text: botReply, role: userRole });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ sender: "bot", text: "⚠️ Sorry, bot unavailable." });
  }
});

module.exports = router;
