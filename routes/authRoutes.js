const express = require("express");
const User = require("../models/User");
const findUserInGoogleSheet = require("../utils/findUserInGoogleSheet");

const router = express.Router();

router.post("/create-user", async (req, res) => {
  try {
    const { firstName, lastName, email, phone, city, latitude, longitude } = req.body;

    if (!firstName || !lastName || !email || !phone) {
      return res.status(400).json({ error: "All fields are required" });
    }

    let user = await User.findOne({ $or: [{ email }, { phone }] });

    if (!user) {
      const userId = `${firstName[0].toUpperCase()}${lastName[0].toUpperCase()}-${Date.now()}`;
      user = new User({
        userId,
        firstName,
        lastName,
        email,
        phone,
        city: city || "NAN",
        latitude: latitude || 0,
        longitude: longitude || 0,
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
