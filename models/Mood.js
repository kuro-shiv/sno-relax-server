const mongoose = require("mongoose");

const moodSchema = new mongoose.Schema({
  userId: {
    type: String, // or mongoose.Schema.Types.ObjectId if linked to User model
    required: true,
  },
  mood: {
    type: Number, // value 0–5 (as sent from frontend)
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Mood", moodSchema);
