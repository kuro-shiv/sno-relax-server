const express = require("express");
const router = express.Router();
const {Translate} = require("@google-cloud/translate").v2;
const fs = require("fs");

// Initialize client robustly. Support either:
// - GOOGLE_APPLICATION_CREDENTIALS_JSON (a JSON string in env)
// - GOOGLE_APPLICATION_CREDENTIALS (a path to a JSON file)
// If neither is present or parsing fails, fall back to default ADC behavior.
let translate;
try {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
    translate = new Translate({ credentials: serviceAccount, projectId: serviceAccount.project_id });
  }
} catch (err) {
  console.warn("Invalid GOOGLE_APPLICATION_CREDENTIALS_JSON:", err.message);
}

if (!translate && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  try {
    const raw = fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, "utf8");
    const serviceAccount = JSON.parse(raw);
    translate = new Translate({ credentials: serviceAccount, projectId: serviceAccount.project_id });
  } catch (err) {
    console.warn("Failed to load GOOGLE_APPLICATION_CREDENTIALS file:", err.message);
  }
}

if (!translate) {
  // Let the client library fall back to Application Default Credentials
  translate = new Translate();
}

router.post("/", async (req, res) => {
  try {
    const { text, from = "auto", to = "en" } = req.body;
    if (!text) return res.status(400).json({ error: "Text required" });

    const [translation] = await translate.translate(text, to, { from });
    return res.json({ translated: translation });
  } catch (err) {
    console.error("Translation error:", err);
    return res.status(500).json({ translated: req.body.text });
  }
});

module.exports = router;
