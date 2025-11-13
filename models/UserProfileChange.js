// sno-relax-server/models/UserProfileChange.js
const mongoose = require("mongoose");

const userProfileChangeSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true }, // reference to userId in User model
    fieldName: { type: String, required: true }, // e.g., "firstName", "email", "city"
    oldValue: { type: mongoose.Schema.Types.Mixed }, // previous value (can be any type)
    newValue: { type: mongoose.Schema.Types.Mixed }, // new value
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: String }, // 'user' or 'admin' or specific admin ID
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserProfileChange", userProfileChangeSchema);
