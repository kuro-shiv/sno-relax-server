const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");

// LibreTranslate API
const TRANSLATE_API = "https://libretranslate.com/translate";

/**
 * POST /api/translate
 * Body: { text: string, source: string, target: string }
 */
router.post("/", async (req, res) => {
  const { text, source = "auto", target } = req.body;

  if (!text || !target) {
    return res.status(400).json({ error: "Text and target language are required" });
  }

  try {
    const response = await fetch(TRANSLATE_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: text, source, target }),
    });

    const data = await response.json();

    if (!data.translatedText) {
      return res.status(500).json({ error: "Translation failed" });
    }

    res.json({ translatedText: data.translatedText });
  } catch (err) {
    console.error("Translation error:", err);
    res.status(500).json({ error: "Translation service unavailable" });
  }
});

module.exports = router;
