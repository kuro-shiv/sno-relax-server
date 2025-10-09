const mongoose = require("mongoose");

const MoodSchema = new mongoose.Schema({
  userId: String,
  mood: String,
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Mood", MoodSchema);
