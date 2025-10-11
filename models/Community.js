
const mongoose = require("mongoose");

const CommunitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  adminId: { type: String, required: true },
  members: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Community", CommunitySchema);
