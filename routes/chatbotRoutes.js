const express = require("express");
const router = express.Router();
const cohere = require("cohere-ai");
const fetch = require("node-fetch");
const ChatHistory = require("../models/ChatHistory");

// Init Cohere
cohere.init(process.env.COHERE_API_KEY);

// LibreTranslate free API
const TRANSLATE_API = "https://libretranslate.com/translate";

router.post("/", async (req, res) => {
  const { message, lang = "auto" } = req.body;
  if (!message) return res.status(400).json({ error: "Message required" });

  try {
    // ---- Translate to English ----
    let translatedText = message;
    if (lang !== "en") {
      const transRes = await fetch(TRANSLATE_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: message, source: lang, target: "en" }),
      });
      const data = await transRes.json();
      translatedText = data.translatedText || message;
    }

    // ---- Cohere response ----
    const cohereResp = await cohere.generate({
      model: "xlarge",
      prompt: `You are a kind mental health assistant.\nUser: ${translatedText}\nBot:`,
      max_tokens: 60,
      temperature: 0.7,
      stop_sequences: ["User:", "Bot:"],
    });

    const botReply = cohereResp.body.generations[0].text.trim();

    // ---- Save to DB ----
    await ChatHistory.create({
      user: message,
      bot: botReply,
      lang,
    });

    res.json({ sender: "bot", text: botReply });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ sender: "bot", text: "⚠️ Sorry, bot unavailable." });
  }
});

module.exports = router;
