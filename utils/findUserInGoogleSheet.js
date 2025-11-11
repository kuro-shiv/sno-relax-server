const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const USERS_FILE = path.join(__dirname, "../users.json");
const LOCAL_CREDENTIALS_PATH = path.join(__dirname, "../google-credentials.json");

// ===== Helper functions =====
function readUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  return JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
}

function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function loadServiceAccountCredentials() {
  if (process.env.GOOGLE_SERVICE_ACCOUNT) {
    const json = Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT, "base64").toString("utf-8");
    return JSON.parse(json);
  }

  if (fs.existsSync(LOCAL_CREDENTIALS_PATH)) {
    return require(LOCAL_CREDENTIALS_PATH);
  }

  throw new Error(
    "Google service account credentials not found. " +
    "Set GOOGLE_SERVICE_ACCOUNT env (base64) or place google-credentials.json in project root."
  );
}

// ===== Find user in Google Sheet =====
async function findUserInGoogleSheet(email, phone, extraData = {}) {
  const SHEET_ID = process.env.GOOGLE_SHEET_ID;
  const SHEET_RANGE = process.env.GOOGLE_SHEET_RANGE || "Users!A:D";
  if (!SHEET_ID) return null;

  const creds = loadServiceAccountCredentials();
  const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  const result = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: SHEET_RANGE,
  });

  const rows = result.data.values || [];
  if (rows.length === 0) return null;

  // Skip header if exists
  let startIndex = 0;
  const headerRow = rows[0].map((c) => String(c).toLowerCase());
  if (headerRow.includes("firstname") || headerRow.includes("email")) startIndex = 1;

  const normEmail = (email || "").trim().toLowerCase();
  const normPhone = (phone || "").replace(/\s+/g, "").replace(/[^\d+]/g, "");

  let matchingRow = null;
  for (let i = startIndex; i < rows.length; i++) {
    const row = rows[i];
    const rowEmail = (row[2] || "").trim().toLowerCase();
    const rowPhone = (row[3] || "").replace(/\s+/g, "").replace(/[^\d+]/g, "");
    if ((normEmail && rowEmail === normEmail) || (normPhone && rowPhone === normPhone)) {
      matchingRow = row;
      break;
    }
  }

  if (!matchingRow) return null;

  const [firstName, lastName, sheetEmail, sheetPhone] = [
    matchingRow[0] || "",
    matchingRow[1] || "",
    (matchingRow[2] || "").trim().toLowerCase(),
    (matchingRow[3] || "").replace(/\s+/g, "").replace(/[^\d+]/g, ""),
  ];

  // Check local users
  const users = readUsers();
  let user = users.find(
    (u) => (u.email && u.email === sheetEmail) || (u.phone && u.phone === sheetPhone)
  );
  if (user) return user;

  // Generate userId
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  const initials = `${(firstName[0] || "X").toUpperCase()}${(lastName[0] || "X").toUpperCase()}`;
  const cityCode =
    extraData.city && extraData.city.length >= 3
      ? extraData.city.slice(0, 3).toUpperCase()
      : "NAN";

  const hash = crypto.createHash("sha256").update(sheetEmail + sheetPhone).digest("hex").slice(0, 7);
  const userId = `${initials}-${month}-${year}-${cityCode}-${hash}`;

  user = {
    userId,
    firstName,
    lastName,
    email: sheetEmail,
    phone: sheetPhone,
    city: extraData.city || null,
    latitude: extraData.latitude || null,
    longitude: extraData.longitude || null,
    role: "user",
    source: "google_sheet",
  };

  users.push(user);
  writeUsers(users);

  return user;
}

module.exports = findUserInGoogleSheet;
