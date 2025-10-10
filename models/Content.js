const mongoose = require("mongoose");

const ContentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, enum: ["article", "exercise", "video", "other"], required: true },
  mediaUrl: { type: String }, // optional URL for media
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Content", ContentSchema);
