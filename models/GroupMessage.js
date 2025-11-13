const mongoose = require('mongoose');

const groupMessageSchema = new mongoose.Schema({
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'CommunityGroup', required: true },
  senderId: { type: String, required: true },
  senderNickname: { type: String, default: "Anonymous" }, // Display name in chat (anonymity feature)
  message: { type: String, required: true },
  isEdited: { type: Boolean, default: false },
  editedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('GroupMessage', groupMessageSchema);
