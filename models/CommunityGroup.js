const mongoose = require('mongoose');

const communityGroupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  members: [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.model('CommunityGroup', communityGroupSchema);
