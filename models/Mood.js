const mongoose = require("mongoose");

const moodSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  mood: {
    type: Number, // e.g., 1–5 scale or mood index
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Mood", moodSchema);
