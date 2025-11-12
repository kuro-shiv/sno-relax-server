const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  targetGroups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CommunityGroup' }],
  createdBy: { type: String },
  dateTime: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Announcement', announcementSchema);
