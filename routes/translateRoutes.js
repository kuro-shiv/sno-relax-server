const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");

// Free & public translation API
const TRANSLATE_API = "https://libretranslate.com/translate";

/**
 * POST /api/translate
 * Body: { text, from, to }
 * Returns: { translated }
 */
router.post("/", async (req, res) => {
  try {
    const { text, from = "auto", to = "en" } = req.body;

    if (!text || !to)
      return res.status(400).json({ error: "Missing required fields (text, to)" });

    // Call translation API
    const response = await fetch(TRANSLATE_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: text,
        source: from,
        target: to,
        format: "text"
      }),
    });

    const data = await response.json();

    // LibreTranslate returns "translatedText"
    const translated = data.translatedText || text;

    res.json({ translated });
  } catch (err) {
    console.error("Translation error:", err);
    res.status(500).json({ translated: req.body.text });
  }
});

module.exports = router;
