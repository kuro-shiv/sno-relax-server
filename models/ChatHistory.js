const mongoose = require("mongoose");

const ChatHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  userMessage: { type: String, required: true },
  botReply: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("ChatHistory", ChatHistorySchema);
