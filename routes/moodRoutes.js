const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const router = express.Router();
const MOODS_FILE = path.join(__dirname, "../moods.json");

// ===== Helper functions =====
function readMoods() {
  if (!fs.existsSync(MOODS_FILE)) return [];
  return JSON.parse(fs.readFileSync(MOODS_FILE, "utf-8"));
}

function writeMoods(moods) {
  fs.writeFileSync(MOODS_FILE, JSON.stringify(moods, null, 2));
}

// ===== Add a new mood entry =====
router.post("/:userId", (req, res) => {
  const { mood } = req.body;
  const { userId } = req.params;

  if (!userId || mood === undefined) {
    return res.status(400).json({ error: "userId & mood required" });
  }

  const moods = readMoods();
  const newEntry = {
    id: crypto.randomUUID(),
    userId,
    mood,
    date: new Date().toISOString(),
  };

  moods.push(newEntry);
  writeMoods(moods);

  res.json({ ok: true, entry: newEntry });
});

// ===== Get moods for a specific user =====
router.get("/:userId", (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: "userId required" });
  }

  const moods = readMoods().filter((m) => m.userId === userId);
  res.json({ ok: true, moods });
});

module.exports = router;
