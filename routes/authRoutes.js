const express = require("express");
const crypto = require("crypto");
const User = require("../models/User");

const router = express.Router();

// POST /api/auth/create-user
router.post("/create-user", async (req, res) => {
  try {
    const { firstName, lastName, email, phone, city, latitude, longitude } = req.body;

    // All fields required
    if (!firstName || !lastName || !email || !phone || !city || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: "All fields including location are required" });
    }

    // Check existing user by email or phone
    let user = await User.findOne({ $or: [{ email }, { phone }] });

    if (!user) {
      // === ID Generation ===
      const initials = `${firstName[0]}${lastName[0]}`.toUpperCase();

      const date = new Date();
      const day = String(date.getDate()).padStart(2, "0"); // e.g. "01"
      const year = date.getFullYear();

      const cityCode = city.substring(0, 3).toUpperCase();

      // Unique part from email + phone
      const uniqueHash = crypto
        .createHash("md5")
        .update(email + phone)
        .digest("hex")
        .substring(0, 8) // 8 chars
        .toUpperCase();

      const userId = `${initials}-${day}-${year}-${cityCode}-${uniqueHash}`;

      // Save new user
      user = new User({
        userId,
        firstName,
        lastName,
        email,
        phone,
        city,
        latitude,
        longitude,
      });

      await user.save();
    }

    res.json({ userId: user.userId, user });
  } catch (err) {
    console.error("Error in create-user:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
