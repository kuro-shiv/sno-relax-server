const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const findUserInGoogleSheet = require("../utils/findUserInGoogleSheet");

const router = express.Router();

const USERS_FILE = path.join(__dirname, "../users.json");
const ADMINS_FILE = path.join(__dirname, "../admins.json");

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
  let { firstName, lastName, email, phone, city, latitude, longitude } = req.body;

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
    latitude: latitude || null,
    longitude: longitude || null,
    role: "user",
  };

  users.push(user);
  writeJson(USERS_FILE, users);

  res.json({ ok: true, userId, role: "user" });
});

// ✅ Login
router.post("/login", async (req, res) => {
  let { email, phone, userId, city, latitude, longitude } = req.body;

  email = normalizeEmail(email);
  phone = normalizePhone(phone);
  userId = userId ? String(userId).trim() : null;

  if (!email && !phone && !userId) {
    return res.status(400).json({ error: "Provide email, phone, or userId" });
  }

  // 1) Admins
  const admins = readJson(ADMINS_FILE);
  const admin = admins.find(
    (a) =>
      (a.email && a.email.toLowerCase() === email) ||
      (a.phone && normalizePhone(a.phone) === phone) ||
      (a.userId && a.userId === userId)
  );
  if (admin) {
    return res.json({ ok: true, role: "admin", user: admin });
  }

  // 2) Google Sheet
  try {
    const sheetUser = await findUserInGoogleSheet(email, phone, { city, latitude, longitude });
    if (sheetUser) {
      return res.json({ ok: true, role: "user", user: sheetUser });
    }
  } catch (err) {
    console.error("Google Sheet check failed:", err);
  }

  // 3) Local users
  const users = readJson(USERS_FILE);
  const user = users.find(
    (u) =>
      (u.email && u.email.toLowerCase() === email) ||
      (u.phone && normalizePhone(u.phone) === phone) ||
      (u.userId && u.userId === userId)
  );
  if (user) {
    return res.json({ ok: true, role: "user", user });
  }

  res.status(404).json({ error: "User not found" });
});

module.exports = router;
