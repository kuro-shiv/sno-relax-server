
const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");
const ChatHistory = require("../models/ChatHistory");
const User = require("../models/User");

const TRANSLATE_API = "https://libretranslate.com/translate";
const HF_API_KEY = process.env.HF_API_KEY;
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const TRAINING_FILE = path.join(__dirname, '..', 'training_data.json');

function saveTrainingEntry(entry) {
  try {
    let arr = [];
    if (fs.existsSync(TRAINING_FILE)) {
      const raw = fs.readFileSync(TRAINING_FILE, 'utf8');
      arr = raw ? JSON.parse(raw) : [];
    }
    arr.push(entry);
    fs.writeFileSync(TRAINING_FILE, JSON.stringify(arr, null, 2));
  } catch (err) {
    console.error('Failed to save training entry:', err);
  }
}

async function tryPythonChatbot(message) {
  const script = path.join(__dirname, '..', 'chatbot.py');
  try {
    // try python then python3
    for (const cmd of ['python', 'python3']) {
      try {
        const res = spawnSync(cmd, [script], { input: message, encoding: 'utf8', timeout: 3000 });
        if (res.error) {
          // try next
          continue;
        }
        if (res.status === 0 && res.stdout) {
          return res.stdout.trim();
        }
      } catch (e) {
        continue;
      }
    }
  } catch (err) {
    // ignore
  }
  return null;
}

// We'll call Cohere's REST API directly (avoids SDK version issues)
const COHERE_API_KEY = process.env.COHERE_API_KEY;
async function callCohereGenerate(prompt) {
  if (!COHERE_API_KEY) throw new Error('Cohere API key not configured');
  const url = 'https://api.cohere.ai/v1/generate';
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${COHERE_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'xlarge',
      prompt,
      max_tokens: 150,
      temperature: 0.7,
      stop_sequences: ['\nUser:', '\nBot:'],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cohere generate failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  if (data && data.generations && data.generations[0] && data.generations[0].text) return data.generations[0].text.trim();
  return '';
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

    // -------- Try python chatbot first, then Cohere, then Hugging Face --------
    let botReply = "";
    let source = 'none';

    // try python chatbot
    try {
      const pyReply = await tryPythonChatbot(translatedText);
      if (pyReply) {
        botReply = pyReply;
        source = 'python';
      }
    } catch (e) {
      console.warn('Python chatbot check failed:', e.message || e);
    }

    if (!botReply) {
      if (process.env.COHERE_API_KEY) {
        try {
          botReply = await callCohereGenerate(prompt);
          source = 'cohere';
        } catch (err) {
          console.error("Cohere generate error:", err);
          botReply = "I'm still learning. Could you rephrase or ask another way?";
          source = 'cohere-error';
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
          source = 'huggingface';
        } catch (err) {
          console.error("Hugging Face error:", err);
          botReply = "Bot unavailable. Please try again later.";
          source = 'huggingface-error';
        }
      } else {
        // No Cohere or Hugging Face key — return a helpful placeholder reply
        botReply = "(No bot API key configured) Hi — this is a placeholder bot. Install COHERE_API_KEY or HF_API_KEY to enable the real bot.";
        source = 'placeholder';
      }
    }

    // -------- Store current chat and training data --------
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

    // save to training file (append)
    try {
      saveTrainingEntry({ userId, userMessage: message, botReply, language: lang, source, timestamp: new Date().toISOString() });
    } catch (e) {
      console.error('Failed to save training data:', e);
    }

    res.json({ sender: "bot", text: botReply, role: userRole });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ sender: "bot", text: "⚠️ Sorry, bot unavailable." });
  }
});

module.exports = router;
