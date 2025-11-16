const mongoose = require('mongoose');

const TrainingEntrySchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userMessage: { type: String, required: true },
  botReply: { type: String, default: '' },
  language: { type: String, default: 'en' },
  source: { type: String, default: 'pending' },
  processed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

TrainingEntrySchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('TrainingEntry', TrainingEntrySchema);
