const mongoose = require("mongoose");

const CommunityPostSchema = new mongoose.Schema({
  userId: String,
  content: String,
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("CommunityPost", CommunityPostSchema);
