const mongoose = require('mongoose');

const HospitalReportSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  userName: { type: String },
  image: { type: Buffer },
  imageMime: { type: String },
  ocrText: { type: String, default: '' },
  analysis: { type: Object, default: {} },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('HospitalReport', HospitalReportSchema);
