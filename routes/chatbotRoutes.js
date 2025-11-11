const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");
const { spawn } = require("child_process");
const ChatHistory = require("../models/ChatHistory");

const TRANSLATE_API = "https://libretranslate.com/translate";

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

    // -------- Fetch ALL previous chat history --------
    const previousChats = await ChatHistory.find({ userId }).sort({ createdAt: 1 });

    // Combine full context
    let context = previousChats
      .map(chat => `User: ${chat.userMessage}\nBot: ${chat.botReply}`)
      .join("\n");
    context += `\nUser: ${translatedText}\nBot: `;

    // -------- Python chatbot --------
    let botReply = "";
    let pythonError = false;

    const pythonScript = spawn("python3", ["./models/chat_model.py"]);
    pythonScript.stdout.on("data", (data) => (botReply += data.toString()));
    pythonScript.stderr.on("data", (err) => {
      console.error("Python error:", err.toString());
      pythonError = true;
    });

    pythonScript.on("close", async () => {
      botReply = botReply.trim();
      if (!botReply || pythonError) botReply = "I'm still learning. Could you rephrase or ask another way?";

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
    });

    pythonScript.stdin.write(context + "\n");
    pythonScript.stdin.end();

  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ sender: "bot", text: "⚠️ Sorry, bot unavailable." });
  }
});

module.exports = router;
