const express = require("express");
const crypto = require("crypto");
const User = require("../models/User");

const router = express.Router();

// ===== Helper functions =====
function normalizeEmail(email = "") {
  return String(email).trim().toLowerCase();
}

function normalizePhone(phone = "") {
  return String(phone).replace(/\s+/g, "").replace(/[^\d+]/g, "");
}

// ===== Create / Login User =====
router.post("/create-user", async (req, res) => {
  try {
    let { firstName, lastName, email, phone, city, latitude, longitude } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !phone) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Normalize input
    email = normalizeEmail(email);
    phone = normalizePhone(phone);

    // Check if user already exists
    let user = await User.findOne({ $or: [{ email }, { phone }] });
    if (user) {
      return res.json({ ok: true, userId: user.userId, role: "user" });
    }

    // Generate unique userId
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
    const initials = `${firstName[0].toUpperCase()}${lastName[0].toUpperCase()}`;
    const cityCode = city && city.length >= 3 ? city.slice(0, 3).toUpperCase() : "NAN";
    const hash = crypto.createHash("sha256").update(email + phone).digest("hex").slice(0, 7);
    const userId = `${initials}-${month}-${year}-${cityCode}-${hash}`;

    // Save new user
    user = new User({ userId, firstName, lastName, email, phone, city, latitude, longitude });
    await user.save();

    res.json({ ok: true, userId, role: "user" });
  } catch (err) {
    console.error("Auth Route Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
