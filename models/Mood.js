const mongoose = require("mongoose");

const moodSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userMessage: { type: String, required: true },
  mood: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Mood", moodSchema);
