const mongoose = require("mongoose");

const ChatHistorySchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userMessage: { type: String, required: true }, // translated English message
  botReply: { type: String, required: true },
  language: { type: String, default: "en" },
  createdAt: { type: Date, default: Date.now } // automatic timestamp
});

module.exports = mongoose.model("ChatHistory", ChatHistorySchema);
