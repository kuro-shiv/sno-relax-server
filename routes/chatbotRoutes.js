const express = require("express");
const router = express.Router();
const { CohereClient } = require("cohere-ai");
const fetch = require("node-fetch");
const ChatHistory = require("../models/ChatHistory");

// ✅ Cohere client
const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
});

// ✅ Free translator API
const TRANSLATE_API = "https://libretranslate.com/translate";

// ---------- Chatbot Route ----------
router.post("/", async (req, res) => {
  const { message, lang = "auto" } = req.body;
  if (!message) return res.status(400).json({ error: "Message required" });

  try {
    // ---- Step 1: Translate user input to English ----
    let translatedText = message;
    if (lang !== "en") {
      const transRes = await fetch(TRANSLATE_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q: message,
          source: lang,
          target: "en",
        }),
      });
      const data = await transRes.json();
      translatedText = data.translatedText || message;
    }

    // ---- Step 2: Get response from Cohere ----
    const cohereResp = await cohere.generate({
      model: "command-r-plus", // ✅ stable model
      prompt: `You are a kind mental health assistant.\nUser: ${translatedText}\nBot:`,
      maxTokens: 80,
      temperature: 0.7,
      stopSequences: ["User:", "Bot:"],
    });

    const botReply = cohereResp.generations[0].text.trim();

    // ---- Step 3: Save to MongoDB ----
    await ChatHistory.create({
      user: message,
      bot: botReply,
      lang,
      timestamp: new Date(),
    });

    // ---- Step 4: Send response ----
    res.json({ sender: "bot", text: botReply });
  } catch (err) {
    console.error("🔥 Chat error:", err);
    res.status(500).json({
      sender: "bot",
      text: "⚠️ Sorry, bot is currently unavailable.",
    });
  }
});

module.exports = router;
