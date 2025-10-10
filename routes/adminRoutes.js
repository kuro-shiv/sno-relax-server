const express = require("express");
const router = express.Router();
const User = require("../models/User");
const ChatHistory = require("../models/ChatHistory");
const Content = require("../models/Content");
const Community = require("../models/Community");

// ----------------- USERS -----------------

// Get all users
router.get("/users", async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get single user by ID
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

// ✅ Update user (Ban/Unban or Edit Info)
router.put("/users/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User updated successfully", user });
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Delete user
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

// Get chat history (optionally filter by user)
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

// ----------------- COMMUNITY -----------------

// Get all community posts
router.get("/community", async (req, res) => {
  try {
    const posts = await Community.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    console.error("Error fetching community posts:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get single community post by ID
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

// Update a community post (edit content, approve, or reject)
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

// Delete a community post
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

// ----------------- STATS -----------------

router.get("/stats", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalChats = await ChatHistory.countDocuments();

    res.json({
      totalUsers,
      totalChats,
    });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ----------------- CHAT STATS (Last 7 Days) -----------------
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
        const count = await ChatHistory.countDocuments({
          timestamp: { $gte: start, $lte: end },
        });
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

// Get all content
router.get("/content", async (req, res) => {
  try {
    const contents = await Content.find().sort({ createdAt: -1 });
    res.json(contents);
  } catch (err) {
    console.error("Error fetching content:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get single content by ID
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

// Create new content
router.post("/content", async (req, res) => {
  try {
    const { title, description, type, mediaUrl } = req.body;
    if (!title || !description || !type)
      return res.status(400).json({ error: "Title, description, and type required" });

    const newContent = await Content.create({ title, description, type, mediaUrl });
    res.json(newContent);
  } catch (err) {
    console.error("Error creating content:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update content
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

// Delete content
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
