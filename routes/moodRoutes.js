const express = require("express");
const router = express.Router();
const Mood = require("../models/Mood");

// ✅ Add a new mood entry
router.post("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { mood, note } = req.body;

    if (!userId || mood === undefined) {
      return res.status(400).json({ error: "userId and mood are required" });
    }

    const entry = await Mood.create({
      userId,
      mood,
      note,
    });

    res.json({ ok: true, entry });
  } catch (err) {
    console.error("Error saving mood:", err);
    res.status(500).json({ ok: false, error: "Failed to save mood" });
  }
});

// ✅ Get all moods for a specific user
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: "userId required" });

    const moods = await Mood.find({ userId }).sort({ date: 1 });
    res.json({ ok: true, moods });
  } catch (err) {
    console.error("Error fetching moods:", err);
    res.status(500).json({ ok: false, error: "Failed to fetch moods" });
  }
});

// ✅ Optional: Delete all moods for a user (admin/debug)
router.delete("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    await Mood.deleteMany({ userId });
    res.json({ ok: true, message: "All moods deleted for this user" });
  } catch (err) {
    console.error("Error deleting moods:", err);
    res.status(500).json({ ok: false, error: "Failed to delete moods" });
  }
});

module.exports = router;
