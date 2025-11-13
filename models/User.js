// sno-relax-server/models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    city: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    avatar: { type: String, default: "https://i.imgur.com/KR0NKdM.png" },
    history: { type: String, default: "" },
    role: { type: String, default: "user" },
    // Community anonymity feature
    communityNickname: {
      type: String,
      default: "Anonymous",
      minlength: 3,
      maxlength: 20,
      match: /^[a-zA-Z0-9\s\u{1F300}-\u{1F9FF}]+$/u, // Alphanumeric, spaces, and emojis
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
