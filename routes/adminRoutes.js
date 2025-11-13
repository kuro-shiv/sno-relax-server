const express = require("express");
const router = express.Router();
const User = require("../models/User");
const ChatHistory = require("../models/ChatHistory");
const Content = require("../models/Content");
const Community = require("../models/Community");
const fs = require("fs");
const path = require("path");
const communityController = require("../controllers/communityController");
const GroupMessage = require("../models/GroupMessage");
const CommunityGroup = require("../models/CommunityGroup");
const Announcement = require("../models/Announcement");
const PrivateMessage = require("../models/PrivateMessage");

// Simple helpers for community groups stored in a JSON file
const COMMUNITY_FILE = path.join(__dirname, "..", "data", "communities.json");
function readCommunity() {
  if (!fs.existsSync(COMMUNITY_FILE)) return { groups: [], messages: [] };
  return JSON.parse(fs.readFileSync(COMMUNITY_FILE, "utf8"));
}
function writeCommunity(data) {
  fs.mkdirSync(path.dirname(COMMUNITY_FILE), { recursive: true });
  fs.writeFileSync(COMMUNITY_FILE, JSON.stringify(data, null, 2));
}

// ----------------- USERS -----------------

router.get("/users", async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/users/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User updated successfully", user });
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/users/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ----------------- CHATS -----------------

router.get("/chats", async (req, res) => {
  try {
    const { userId } = req.query;
    let query = {};
    if (userId) query.userId = userId;
    const chats = await ChatHistory.find(query).sort({ timestamp: -1 });
    res.json(chats);
  } catch (err) {
    console.error("Error fetching chats:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ----------------- PRIVATE MESSAGES (admin) -----------------
// Fetch private messages for a user (admin view)
router.get("/private-messages", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "userId required" });
    const msgs = await PrivateMessage.find({ $or: [{ senderId: userId }, { receiverId: userId }] }).sort({ createdAt: 1 });
    res.json({ ok: true, messages: msgs });
  } catch (err) {
    console.error("Error fetching private messages (admin):", err);
    res.status(500).json({ error: err.message });
  }
});

// Admin can post a private message (reply to user)
router.post("/private-message", async (req, res) => {
  try {
    const { senderId, receiverId, message } = req.body;
    if (!senderId || !receiverId || !message) return res.status(400).json({ error: "senderId, receiverId and message required" });
    const m = await PrivateMessage.create({ senderId, receiverId, message: String(message).trim() });
    const io = req.app && req.app.get("io");
    if (io && receiverId) io.to(`user_${receiverId}`).emit("receivePrivateMessage", m);
    res.status(201).json({ ok: true, message: m });
  } catch (err) {
    console.error("Error creating private message (admin):", err);
    res.status(500).json({ error: err.message });
  }
});

// ----------------- COMMUNITY -----------------

router.get("/community", async (req, res) => {
  try {
    const posts = await Community.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    console.error("Error fetching community posts:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/community/:id", async (req, res) => {
  try {
    const post = await Community.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    res.json(post);
  } catch (err) {
    console.error("Error fetching post:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/community/:id", async (req, res) => {
  try {
    const updatedPost = await Community.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedPost) return res.status(404).json({ error: "Post not found" });
    res.json({ message: "Post updated successfully", post: updatedPost });
  } catch (err) {
    console.error("Error updating post:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/community/:id", async (req, res) => {
  try {
    const deletedPost = await Community.findByIdAndDelete(req.params.id);
    if (!deletedPost) return res.status(404).json({ error: "Post not found" });
    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error("Error deleting post:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/community/group/:groupId", (req, res) => {
  const { groupId } = req.params;
  const db = readCommunity();
  const groupIndex = db.groups.findIndex((g) => g.id === groupId);

  if (groupIndex === -1) return res.status(404).json({ error: "Group not found" });

  db.groups.splice(groupIndex, 1);
  db.messages = db.messages.filter((m) => m.groupId !== groupId);
  writeCommunity(db);
  res.json({ ok: true, message: "Group deleted successfully" });
});

// ---------- Admin: Mongo-backed community management (reuses communityController)
// List groups (mongo)
router.get("/community/groups", async (req, res) => {
  try {
    const groups = await CommunityGroup.find().populate("createdBy", "name email");
    res.json({ ok: true, groups });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Create group (admin)
router.post("/community/group", async (req, res) => {
  // expect { name, description, createdBy }
  return communityController.createGroup(req, res);
});

// Delete group (admin)
router.delete("/community/group/mongo/:id", async (req, res) => {
  return communityController.deleteGroup(req, res);
});

// Delete a specific group message (moderation)
router.delete("/community/group/:groupId/message/:messageId", async (req, res) => {
  try {
    const { messageId } = req.params;
    const deleted = await GroupMessage.findByIdAndDelete(messageId);
    if (!deleted) return res.status(404).json({ error: "Message not found" });
    // notify clients in group room if io available
    const io = req.app && req.app.get("io");
    if (io && deleted.groupId) io.to(String(deleted.groupId)).emit("messageDeleted", { messageId });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Add / remove members (admin)
router.post("/community/group/:id/member", async (req, res) => communityController.addMember(req, res));
router.delete("/community/group/:id/member", async (req, res) => communityController.removeMember(req, res));

// Announcements (admin)
router.post("/announcement", async (req, res) => communityController.createAnnouncement(req, res));
router.delete("/announcement/:id", async (req, res) => communityController.deleteAnnouncement(req, res));

// Fetch announcements (admin view)
router.get("/announcements", async (req, res) => communityController.getAnnouncements(req, res));

// ----------------- STATS -----------------

router.get("/stats", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalChats = await ChatHistory.countDocuments();
    res.json({ totalUsers, totalChats });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/stats/chats", async (req, res) => {
  try {
    const today = new Date();
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(today.getDate() - i);
      return d;
    }).reverse();

    const chatCounts = await Promise.all(
      last7Days.map(async (day) => {
        const start = new Date(day.setHours(0, 0, 0, 0));
        const end = new Date(day.setHours(23, 59, 59, 999));
        const count = await ChatHistory.countDocuments({ timestamp: { $gte: start, $lte: end } });
        return { day: start.toLocaleDateString("en-US", { weekday: "short" }), chats: count };
      })
    );

    res.json(chatCounts);
  } catch (err) {
    console.error("Error fetching chat stats:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ----------------- CONTENT -----------------

router.get("/content", async (req, res) => {
  try {
    const contents = await Content.find().sort({ createdAt: -1 });
    res.json(contents);
  } catch (err) {
    console.error("Error fetching content:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/content/:id", async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    if (!content) return res.status(404).json({ error: "Content not found" });
    res.json(content);
  } catch (err) {
    console.error("Error fetching content:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/content", async (req, res) => {
  try {
    const { title, description, type, mediaUrl } = req.body;
    if (!title || !description || !type) return res.status(400).json({ error: "Title, description, and type required" });
    const newContent = await Content.create({ title, description, type, mediaUrl });
    res.json(newContent);
  } catch (err) {
    console.error("Error creating content:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/content/:id", async (req, res) => {
  try {
    const updatedContent = await Content.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedContent) return res.status(404).json({ error: "Content not found" });
    res.json(updatedContent);
  } catch (err) {
    console.error("Error updating content:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/content/:id", async (req, res) => {
  try {
    const deletedContent = await Content.findByIdAndDelete(req.params.id);
    if (!deletedContent) return res.status(404).json({ error: "Content not found" });
    res.json({ message: "Content deleted successfully" });
  } catch (err) {
    console.error("Error deleting content:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
