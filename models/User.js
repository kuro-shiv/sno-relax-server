const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  firstName: String,
  lastName: String,
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true, unique: true },
  city: String,
  latitude: Number,
  longitude: Number,
  role: { type: String, default: "user" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", UserSchema);
