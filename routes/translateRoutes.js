// routes/translateRoutes.js
const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");

const TRANSLATE_API = "https://libretranslate.de/translate"; // more stable mirror

router.post("/", async (req, res) => {
  try {
    const { text, from = "auto", to = "en" } = req.body;
    if (!text) return res.status(400).json({ error: "Text required" });

    const response = await fetch(TRANSLATE_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        q: text,
        source: from,
        target: to,
        format: "text",
      }),
    });

    const data = await response.json();
    const translated = data.translatedText || text;

    return res.json({ translated });
  } catch (err) {
    console.error("Translation error:", err);
    return res.status(500).json({ translated: req.body.text });
  }
});

module.exports = router;
