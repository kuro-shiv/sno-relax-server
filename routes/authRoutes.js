const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const router = express.Router();
const USERS_FILE = path.join(__dirname, "../users.json");

// Helpers
function readJson(file) {
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function normalizeEmail(email = "") {
  return String(email).trim().toLowerCase();
}

function normalizePhone(phone = "") {
  return String(phone).replace(/\s+/g, "").replace(/[^\d+]/g, "");
}

// ✅ Create User
router.post("/create-user", (req, res) => {
  let { firstName, lastName, email, phone, city } = req.body;

  if (!firstName || !lastName || !email || !phone) {
    return res.status(400).json({ error: "Missing fields" });
  }

  email = normalizeEmail(email);
  phone = normalizePhone(phone);

  const users = readJson(USERS_FILE);
  const existing = users.find((u) => u.email === email || u.phone === phone);

  if (existing) {
    return res.status(400).json({ error: "User already exists", userId: existing.userId });
  }

  // Generate structured userId
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  const initials = `${firstName[0].toUpperCase()}${lastName[0].toUpperCase()}`;
  const cityCode = city && city.length >= 3 ? city.slice(0, 3).toUpperCase() : "NAN";

  const hash = crypto.createHash("sha256").update(email + phone).digest("hex").slice(0, 7);
  const userId = `${initials}-${month}-${year}-${cityCode}-${hash}`;

  const user = {
    userId,
    firstName,
    lastName,
    email,
    phone,
    city: city || null,
    role: "user",
  };

  users.push(user);
  writeJson(USERS_FILE, users);

  res.json({ ok: true, userId, role: "user" });
});

module.exports = router;
// ✅ Error handler