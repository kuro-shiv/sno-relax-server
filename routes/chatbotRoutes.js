const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");
const ChatHistory = require("../models/ChatHistory");
const User = require("../models/User");

const HF_API_KEY = process.env.HF_API_KEY;
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const TRAINING_FILE = path.join(__dirname, '..', 'training_data.json');

// ---------------- Save Training ----------------
function saveTrainingEntry(entry) {
  try {
    let arr = [];
    if (fs.existsSync(TRAINING_FILE)) {
      const raw = fs.readFileSync(TRAINING_FILE, 'utf8');
      arr = raw ? JSON.parse(raw) : [];
    }
    arr.push(entry);
    fs.writeFileSync(TRAINING_FILE, JSON.stringify(arr, null, 2));
    
    // ✅ Optionally trigger training script (spawn in background)
    // This calls models/train_bot.py with the training data
    triggerTrainingUpdate(arr);
  } catch (err) {
    console.error('Failed to save training entry:', err);
  }
}

// ✅ NEW: Trigger training update in background (non-blocking)
function triggerTrainingUpdate(trainingData) {
  try {
    const trainScript = path.join(__dirname, '..', 'models', 'train_bot.py');
    if (!fs.existsSync(trainScript)) return; // train_bot.py not available
    
    // Run training in background (don't wait for result)
    const trainInput = JSON.stringify(trainingData);
    spawnSync('python3', [trainScript], {
      input: trainInput,
      encoding: 'utf8',
      timeout: 5000,
      detached: true,  // run in background
      stdio: 'ignore'  // don't capture output
    });
    
    console.log('📚 Training update triggered (background)');
  } catch (err) {
    console.warn('Training trigger skipped:', err.message);
  }
}

// ---------------- Python Chatbot ----------------
async function tryPythonChatbot(message) {
  // Try models/chatbot.py first (enhanced), then root chatbot.py (basic)
  const scripts = [
    path.join(__dirname, '..', 'models', 'chatbot.py'),  // enhanced model
    path.join(__dirname, '..', 'chatbot.py')              // fallback basic
  ];

  try {
    for (const script of scripts) {
      for (const cmd of ['python', 'python3']) {
        try {
          const res = spawnSync(cmd, [script], { input: message, encoding: 'utf8', timeout: 3000 });
          if (res.error) continue;
          if (res.status === 0 && res.stdout) {
            console.log(`✅ Bot reply from: ${script}`);
            return res.stdout.trim();
          }
        } catch (e) {
          continue;
        }
      }
    }
  } catch (err) {
    console.warn('Python chatbot error:', err.message);
  }
  return null;
}

// ---------------- Cohere API ----------------
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
  return data?.generations?.[0]?.text?.trim() || "";
}

// ---------------- GOOGLE FREE TRANSLATE ----------------

// Detect language (safe with fallback)
async function detectLanguage(text) {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url, { timeout: 5000 });
    if (!res.ok) return "en";
    const data = await res.json();
    return (data && data[2]) || "en";
  } catch (err) {
    console.warn("Language detection failed, assuming en:", err.message);
    return "en"; // default to english
  }
}

// Translate text (safe with fallback)
async function translate(text, source, target) {
  try {
    // Skip translation if same language or already en
    if (source === target) return text;
    
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${source}&tl=${target}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url, { timeout: 5000 });
    if (!res.ok) return text;
    const data = await res.json();

    if (!data || !Array.isArray(data[0])) return text;
    
    let translated = "";
    data[0].forEach(chunk => {
      if (chunk && chunk[0]) translated += chunk[0];
    });

    return translated || text;
  } catch (err) {
    console.warn("Translation failed, returning original text:", err.message);
    return text; // return original on error
  }
}

// ---------------- ROUTE ----------------
router.post("/", async (req, res) => {
  const { userId, message, lang = "auto" } = req.body;
  if (!message || !userId) return res.status(400).json({ error: "Message and userId required" });

  try {
    // Check user role
    let userRole = "user";
    try {
      const user = await User.findOne({ $or: [{ userId }, { _id: userId }] });
      if (user?.role) userRole = user.role;
    } catch (err) {
      console.warn("User role check failed:", err);
    }

    // -------- Auto detect + translate to English ----------
    let sourceLang = lang;

    if (lang === "auto") {
      sourceLang = await detectLanguage(message);
    }

    let translatedText = message;
    if (sourceLang !== "en") {
      translatedText = await translate(message, sourceLang, "en");
    }

    // -------- Fetch Chat History ----------
    const previousChats = await ChatHistory.find({ userId }).sort({ createdAt: 1 });

    let prompt = previousChats
      .map(chat => `User: ${chat.userMessage}\nBot: ${chat.botReply}`)
      .join("\n");

    if (prompt.length) prompt += "\n";
    prompt += `User: ${translatedText}\nBot:`;

    // -------- Bot Logic ----------
    let botReply = "";
    let source = "none";

    // 1. Try Python bot
    try {
      const pyReply = await tryPythonChatbot(translatedText);
      if (pyReply) {
        botReply = pyReply;
        source = "python";
      }
    } catch (e) {}

    // 2. Try Cohere
    if (!botReply && COHERE_API_KEY) {
      try {
        botReply = await callCohereGenerate(prompt);
        source = "cohere";
      } catch (err) {
        botReply = "I'm still learning. Could you rephrase or ask in another way?";
        source = "cohere-error";
      }
    }

    // 3. HuggingFace fallback
    else if (!botReply && HF_API_KEY) {
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
        source = "huggingface";

      } catch (err) {
        botReply = "Bot unavailable. Please try again later.";
        source = "huggingface-error";
      }
    }

    // 4. No API key fallback
    if (!botReply) {
      botReply = "(No bot API key configured) Hi — this is a placeholder bot. Install COHERE_API_KEY or HF_API_KEY.";
      source = "placeholder";
    }

    // -------- Save Chat History ----------
    try {
      await ChatHistory.create({
        userId,
        userMessage: message,
        botReply,
        language: sourceLang
      });
    } catch (err) {
      console.error("Failed to store chat history:", err);
    }

    // -------- Save Training File ----------
    try {
      saveTrainingEntry({
        userId,
        userMessage: message,
        botReply,
        language: sourceLang,
        source,
        timestamp: new Date().toISOString()
      });
    } catch (e) {}

    // -------- Translate Bot Reply Back --------
    let finalReply = botReply;
    if (sourceLang !== "en") {
      try {
        finalReply = await translate(botReply, "en", sourceLang);
      } catch (err) {
        console.error("Back translation failed:", err);
      }
    }

    res.json({ sender: "bot", text: finalReply, role: userRole });

  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ sender: "bot", text: "⚠️ Sorry, bot unavailable." });
  }
});

module.exports = router;
