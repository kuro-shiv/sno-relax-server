// sno-relax-server/controllers/communityController.js
const CommunityGroup = require("../models/CommunityGroup");
const GroupMessage = require("../models/GroupMessage");
const Announcement = require("../models/Announcement");

module.exports = {
  // Groups
  getGroups: async (req, res) => {
    try {
      const groups = await CommunityGroup.find().populate("createdBy", "name email");
      res.json(groups);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch groups" });
    }
  },
  createGroup: async (req, res) => {
    try {
      const { name, description, createdBy } = req.body;
      if (!name || !createdBy) return res.status(400).json({ error: "Name and createdBy required" });
      const group = await CommunityGroup.create({ name, description, createdBy });
      res.json(group);
    } catch (err) {
      res.status(500).json({ error: "Failed to create group" });
    }
  },
  deleteGroup: async (req, res) => {
    try {
      const { id } = req.params;
      await CommunityGroup.findByIdAndDelete(id);
      res.json({ message: "Group deleted" });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete group" });
    }
  },
  addMember: async (req, res) => {
    res.json({ message: "addMember placeholder" });
  },
  removeMember: async (req, res) => {
    res.json({ message: "removeMember placeholder" });
  },

  // Group messages
  getGroupMessages: async (req, res) => {
    res.json([]);
  },
  postGroupMessage: async (req, res) => {
    res.json({ message: "postGroupMessage placeholder" });
  },

  // Private messages
  getPrivateMessages: async (req, res) => {
    res.json([]);
  },
  postPrivateMessage: async (req, res) => {
    res.json({ message: "postPrivateMessage placeholder" });
  },

  // Announcements
  getAnnouncements: async (req, res) => {
    try {
      const announcements = await Announcement.find().sort({ createdAt: -1 });
      res.json(announcements);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch announcements" });
    }
  },
  createAnnouncement: async (req, res) => {
    try {
      const { title, message } = req.body;
      if (!title || !message) return res.status(400).json({ error: "Title and message required" });
      const announcement = await Announcement.create({ title, message });
      res.json(announcement);
    } catch (err) {
      res.status(500).json({ error: "Failed to create announcement" });
    }
  },
  deleteAnnouncement: async (req, res) => {
    try {
      const { id } = req.params;
      await Announcement.findByIdAndDelete(id);
      res.json({ message: "Announcement deleted" });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete announcement" });
    }
  }
};
