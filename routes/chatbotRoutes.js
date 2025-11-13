const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");
const ChatHistory = require("../models/ChatHistory");
const User = require("../models/User");

const HF_API_KEY = process.env.HF_API_KEY;
const { spawnSync, spawn } = require('child_process');
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

// ✅ NEW: Trigger training update in background (non-blocking with spawn)
function triggerTrainingUpdate(trainingData) {
  try {
    const trainScript = path.join(__dirname, '..', 'models', 'train_bot.py');
    if (!fs.existsSync(trainScript)) return; // train_bot.py not available
    
    // Use spawn (not spawnSync) to run truly in background
    const trainProcess = spawn('python3', [trainScript], {
      detached: true,
      stdio: 'ignore'  // don't capture output
    });
    
    // Unref allows parent process to exit without waiting
    trainProcess.unref();
    
    console.log('📚 Training update triggered (background)');
  } catch (err) {
    console.warn('Training trigger skipped:', err.message);
  }
}

// ✅ FIX: Python Chatbot with proper error checking
function tryPythonChatbot(message) {
  // Try models/chatbot.py first (enhanced), then root chatbot.py (basic)
  const scripts = [
    path.join(__dirname, '..', 'models', 'chatbot.py'),  // enhanced model
    path.join(__dirname, '..', 'chatbot.py')              // fallback basic
  ];

  try {
    for (const script of scripts) {
      // Check if script exists first
      if (!fs.existsSync(script)) {
        console.warn(`⚠️ Script not found: ${script}`);
        continue;
      }

      for (const cmd of ['python3', 'python']) {  // Try python3 first
        try {
          const res = spawnSync(cmd, [script], {
            input: message,
            encoding: 'utf8',
            timeout: 3000,
            stdio: ['pipe', 'pipe', 'pipe']  // Explicitly handle stdin/stdout/stderr
          });

          // Check for actual errors
          if (res.error) {
            console.warn(`⚠️ ${cmd} error for ${script}:`, res.error.message);
            continue;
          }

          // Check status and stdout
          if (res.status === 0 && res.stdout && res.stdout.trim()) {
            console.log(`✅ Bot reply from: ${script} (${cmd})`);
            return res.stdout.trim();
          } else if (res.status !== 0) {
            console.warn(`⚠️ ${script} exited with code ${res.status}`);
            if (res.stderr) console.warn(`stderr: ${res.stderr}`);
            continue;
          }
        } catch (e) {
          console.warn(`⚠️ Exception trying ${cmd} on ${script}:`, e.message);
          continue;
        }
      }
    }
  } catch (err) {
    console.warn('Python chatbot error:', err.message);
  }
  
  console.warn('⚠️ No Python response, falling back to Cohere/HuggingFace');
  return null;
}

// ---------------- Cohere API - Enhanced with SnoBot personality ----------------
const COHERE_API_KEY = process.env.COHERE_API_KEY;
async function callCohereGenerate(prompt) {
  if (!COHERE_API_KEY) throw new Error('Cohere API key not configured');

  const url = 'https://api.cohere.ai/v1/generate';
  
  // Add SnoBot personality to prompt
  const enhancedPrompt = `You are SnoBot, a compassionate mental health support assistant. You are helpful, empathetic, non-judgmental, and supportive.
Your role is to:
- Listen attentively and show genuine understanding
- Provide emotional support and helpful suggestions
- Suggest wellness activities and coping strategies
- Encourage healthy habits and self-care
- Be warm, friendly, and use casual language with emojis occasionally
- Keep responses concise (2-3 sentences) and conversational
- Recommend professional help when needed

User: ${prompt}
SnoBot:`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${COHERE_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'xlarge',
      prompt: enhancedPrompt,
      max_tokens: 100,
      temperature: 0.8,
      frequency_penalty: 0.5,
      presence_penalty: 0.1,
      stop_sequences: ['\nUser:', '\n--', 'User says:'],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cohere generate failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  let response = data?.generations?.[0]?.text?.trim() || "";
  
  // Clean up response
  response = response.replace(/^SnoBot:\s*/, '').trim();
  response = response.split('\n')[0].trim(); // Take first line only
  
  return response || "I'm here to listen. How are you feeling today? 🌱";
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
    const previousChats = await ChatHistory.find({ userId }).sort({ timestamp: 1 });

    let prompt = previousChats
      .map(chat => `User: ${chat.userMessage}\nBot: ${chat.botReply}`)
      .join("\n");

    if (prompt.length) prompt += "\n";
    prompt += `User: ${translatedText}\nBot:`;

    // -------- Bot Logic (Priority: Cohere > Python > HuggingFace) ----------
    let botReply = "";
    let source = "none";

    // 1. Try Cohere FIRST (primary)
    if (COHERE_API_KEY) {
      try {
        console.log("📡 Using Cohere API (SnoBot)...");
        botReply = await callCohereGenerate(translatedText);
        source = "cohere";
        console.log(`✅ Got Cohere response: ${botReply.substring(0, 50)}...`);
      } catch (err) {
        console.error("Cohere error:", err.message);
        botReply = "";
      }
    }

    // 2. Try Python bot if Cohere fails
    if (!botReply) {
      try {
        const pyReply = tryPythonChatbot(translatedText);
        if (pyReply) {
          botReply = pyReply;
          source = "python";
          console.log(`✅ Using Python bot response`);
        }
      } catch (e) {
        console.error("Python bot error:", e);
      }
    }

    // 3. HuggingFace fallback
    if (!botReply && HF_API_KEY) {
      try {
        console.log("🤗 Trying HuggingFace API...");
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
        console.log(`✅ Got HuggingFace response`);

      } catch (err) {
        console.error("HuggingFace error:", err.message);
        botReply = "";
      }
    }

    // 4. Default friendly response
    if (!botReply) {
      botReply = "I'm here to listen and support you. 🌱 What's on your mind?";
      source = "default";
      console.warn("⚠️ Using default response");
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
