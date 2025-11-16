const mongoose = require('mongoose');

const HealthPlanSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  guide: { type: Object, default: {} },
  pdf: { type: Buffer },
  pdfMime: { type: String, default: 'application/pdf' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('HealthPlan', HealthPlanSchema);
