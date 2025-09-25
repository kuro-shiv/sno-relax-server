const express = require("express");
const router = express.Router();
const cohere = require("cohere-ai");
const fetch = require("node-fetch");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

cohere.init(process.env.COHERE_API_KEY);
const TRANSLATE_API = "https://libretranslate.com/translate";

router.post("/", async (req, res) => {
  const { message, lang = "auto" } = req.body;
  if (!message) return res.status(400).json({ error: "Message required" });

  try {
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

    const pythonScript = spawn("python3", [path.join(__dirname, "../models/chat_model.py")]);
    let pythonReply = "";
    let pythonError = false;

    pythonScript.stdout.on("data", (data) => (pythonReply += data.toString()));
    pythonScript.stderr.on("data", (err) => { pythonError = true; console.error("Python error:", err.toString()); });

    pythonScript.on("close", async () => {
      let botReply = pythonReply.trim();

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

      const file = path.join(__dirname, "../chat_history.json");
      let history = [];
      if (fs.existsSync(file)) history = JSON.parse(fs.readFileSync(file, "utf-8"));
      history.push({ user: message, bot: botReply, timestamp: new Date().toISOString() });
      fs.writeFileSync(file, JSON.stringify(history, null, 2));

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
