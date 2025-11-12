const mongoose = require('mongoose');

const chatHistorySchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userMessage: { type: String, required: true },
  botReply: { type: String },
  language: { type: String, default: 'en' },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ChatHistory', chatHistorySchema);
