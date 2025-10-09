const mongoose = require("mongoose");

const ChatHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // link to user
  userMessage: { type: String, required: true },
  botReply: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  language: { type: String, default: "en" } // optional, saves user message language
});

module.exports = mongoose.model("ChatHistory", ChatHistorySchema);
