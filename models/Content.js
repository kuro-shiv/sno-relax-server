const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, required: true }, // article, video, exercise
  mediaUrl: { type: String },
  createdBy: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Content', contentSchema);
