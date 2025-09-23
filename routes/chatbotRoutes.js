// routes/chatbotRoutes.js
const express = require("express");
const router = express.Router();
const { spawn } = require("child_process");
const path = require("path");

router.post("/", (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Message required" });

  const pythonScript = path.join(__dirname, "../models/chat_model.py");

  // Pass message as command-line argument
  const python = spawn("python3", [pythonScript, message]);

  let result = "";

  python.stdout.on("data", (data) => (result += data.toString()));
  python.stderr.on("data", (err) => console.error("Python error:", err.toString()));

  python.on("close", () => {
    if (!result) result = "⚠️ No response from Python script.";
    res.json({ sender: "bot", text: result.trim() });
  });
});

module.exports = router;
