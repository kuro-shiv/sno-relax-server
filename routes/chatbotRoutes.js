const express = require("express");
const router = express.Router();
const { spawn } = require("child_process");
const path = require("path");

router.post("/", (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Message required" });

  // Ensure path is correct relative to this file
  const pythonScript = path.join(__dirname, "../models/chat_model.py");

  // Spawn Python process
  const python = spawn("python3", [pythonScript]); // use stdin for multi-word messages

  let result = "";

  python.stdout.on("data", (data) => {
    result += data.toString();
  });

  python.stderr.on("data", (err) => {
    console.error("Python error:", err.toString());
  });

  python.on("close", (code) => {
    if (code !== 0) {
      console.error(`Python process exited with code ${code}`);
      return res
        .status(500)
        .json({ sender: "bot", text: "⚠️ Server error generating reply." });
    }

    res.json({ sender: "bot", text: result.trim() || "⚠️ No response from Python." });
  });

  // Send message to Python script via stdin
  python.stdin.write(message);
  python.stdin.end();
});

module.exports = router;
