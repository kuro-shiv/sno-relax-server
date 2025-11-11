const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const router = express.Router();
const COMMUNITY_FILE = path.join(__dirname, "../community.json");

// ===== Helper functions =====
function readCommunity() {
  if (!fs.existsSync(COMMUNITY_FILE)) {
    return { groups: [], messages: [] };
  }
  return JSON.parse(fs.readFileSync(COMMUNITY_FILE, "utf-8"));
}

function writeCommunity(data) {
  fs.writeFileSync(COMMUNITY_FILE, JSON.stringify(data, null, 2));
}

function ensureDefaultGroups() {
  const db = readCommunity();

  if (!db.groups || db.groups.length === 0) {
    db.groups = [
      {
        id: crypto.randomUUID(),
        name: "Motivation",
        description: "Daily motivational talks 💪",
        adminId: "HOST",
        members: ["HOST"],
      },
      {
        id: crypto.randomUUID(),
        name: "Mindfulness",
        description: "Relax, meditate and share peace 🧘",
        adminId: "HOST",
        members: ["HOST"],
      },
      {
        id: crypto.randomUUID(),
        name: "Support",
        description: "A safe place to talk and be heard 💙",
        adminId: "HOST",
        members: ["HOST"],
      },
    ];
    db.messages = [];
    writeCommunity(db);
  }
}

// ===== Routes =====

// ✅ Create a new group
router.post("/create", (req, res) => {
  const { name, description, adminId } = req.body;
  if (!name || !adminId) {
    return res.status(400).json({ error: "name & adminId required" });
  }

  const db = readCommunity();
  const newGroup = {
    id: crypto.randomUUID(),
    name,
    description: description || "",
    adminId,
    members: [adminId],
  };

  db.groups.push(newGroup);
  writeCommunity(db);

  res.json({ ok: true, group: newGroup });
});

// ✅ Get all groups
router.get("/groups", (req, res) => {
  ensureDefaultGroups();
  const db = readCommunity();
  res.json({ ok: true, groups: db.groups });
});

// ✅ Join a group
router.post("/join/:groupId", (req, res) => {
  const { userId } = req.body;
  const { groupId } = req.params;

  if (!userId) return res.status(400).json({ error: "userId required" });

  const db = readCommunity();
  const group = db.groups.find((g) => g.id === groupId);
  if (!group) return res.status(404).json({ error: "Group not found" });

  if (!group.members.includes(userId)) {
    group.members.push(userId);
    writeCommunity(db);
  }

  res.json({ ok: true, group });
});

// ✅ Leave a group
router.post("/leave/:groupId", (req, res) => {
  const { userId } = req.body;
  const { groupId } = req.params;

  if (!userId) return res.status(400).json({ error: "userId required" });

  const db = readCommunity();
  const group = db.groups.find((g) => g.id === groupId);
  if (!group) return res.status(404).json({ error: "Group not found" });

  group.members = group.members.filter((id) => id !== userId);
  writeCommunity(db);

  res.json({ ok: true, group });
});

// ✅ Send a message in group
router.post("/:groupId/message", (req, res) => {
  const { userId, text } = req.body;
  const { groupId } = req.params;

  if (!userId || !text) {
    return res.status(400).json({ error: "userId & text required" });
  }

  const db = readCommunity();
  const group = db.groups.find((g) => g.id === groupId);
  if (!group) return res.status(404).json({ error: "Group not found" });

  if (!group.members.includes(userId)) {
    return res.status(403).json({ error: "You are not a member of this group" });
  }

  const newMessage = {
    id: crypto.randomUUID(),
    groupId,
    userId,
    text,
    date: new Date().toISOString(),
  };

  if (!db.messages) db.messages = [];
  db.messages.push(newMessage);
  writeCommunity(db);

  res.json({ ok: true, message: newMessage });
});

// ✅ Get messages of a group
router.get("/:groupId/messages", (req, res) => {
  const { groupId } = req.params;
  const db = readCommunity();
  const messages = db.messages.filter((m) => m.groupId === groupId);
  res.json({ ok: true, messages });
});

module.exports = router;
