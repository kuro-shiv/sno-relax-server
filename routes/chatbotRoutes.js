const express = require("express");
const router = express.Router();
const cohere = require("cohere-ai");
const fetch = require("node-fetch");
const { spawn } = require("child_process");
const ChatHistory = require("../models/ChatHistory");

// Initialize Cohere
cohere.init(process.env.COHERE_API_KEY);

// Optional: free translation API
const TRANSLATE_API = "https://libretranslate.com/translate";

router.post("/", async (req, res) => {
  const { message, lang = "auto" } = req.body;
  if (!message) return res.status(400).json({ error: "Message required" });

  try {
    // -------- Translate to English --------
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

    // -------- Python fallback chatbot --------
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

      // -------- Cohere fallback --------
      if (!botReply || pythonError) {
        const cohereResp = await cohere.generate({
          model: "xlarge",
          prompt: `You are a friendly mental health chatbot. Respond kindly.\nUser: ${translatedText}\nBot:`,
          max_tokens: 60,
          temperature: 0.7,
          stop_sequences: ["User:", "Bot:"],
        });
        botReply = cohereResp.body.generations[0].text.trim();
      }

      // -------- Store in MongoDB for self-learning --------
      try {
        await ChatHistory.create({
          userMessage: message,
          botReply,
          timestamp: new Date(),
        });
      } catch (err) {
        console.error("Failed to store chat history:", err);
      }

      res.json({ sender: "bot", text: botReply });
    });

    pythonScript.stdin.write(translatedText + "\n");
    pythonScript.stdin.end();
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ sender: "bot", text: "⚠️ Sorry, bot unavailable." });
  }
});

module.exports = router;