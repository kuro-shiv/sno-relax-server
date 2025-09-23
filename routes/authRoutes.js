const express = require("express");
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
      const userId = `${firstName[0].toUpperCase()}${lastName[0].toUpperCase()}-${Date.now()}`;
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
