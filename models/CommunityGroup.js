const mongoose = require('mongoose');

const communityGroupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: "" },
  createdBy: { type: String, required: true }, // userId of admin/creator
  adminId: { type: String, required: true }, // admin's userId for easier reference
  isPrivate: { type: Boolean, default: false },
  inviteCode: { type: String, default: null },
  members: [{
    userId: { type: String, required: true },
    nickname: { type: String, default: "Anonymous" },
    joinedAt: { type: Date, default: Date.now },
  }],
  isActive: { type: Boolean, default: true },
  maxMembers: { type: Number, default: 50 },
}, { timestamps: true });

module.exports = mongoose.model('CommunityGroup', communityGroupSchema);
