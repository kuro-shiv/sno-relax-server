const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  reportedBy: { type: String },
  metadata: { type: Object },
}, { timestamps: true });

module.exports = mongoose.model('Report', ReportSchema);
