// sno-relax-server/controllers/communityController.js
const CommunityGroup = require("../models/CommunityGroup");
const GroupMessage = require("../models/GroupMessage");
const Announcement = require("../models/Announcement");
const User = require("../models/User");

module.exports = {
  // ==================== GROUPS ====================
  
  getGroups: async (req, res) => {
    try {
      console.log("📢 [getGroups] Request received");
      console.log("📢 [getGroups] CommunityGroup model:", CommunityGroup ? "✅ loaded" : "❌ not loaded");
      
      try {
        // Try MongoDB first
        const groups = await CommunityGroup.find({ isActive: true })
          .select("name description createdBy adminId members isActive maxMembers createdAt")
          .sort({ createdAt: -1 });
        
        console.log("📢 [getGroups] Found", groups.length, "groups in MongoDB");
        
        // If no groups exist, create default ones
        if (groups.length === 0) {
          console.log("📢 [getGroups] No active groups found. Creating default groups in MongoDB...");
          const defaultGroups = [
            {
              name: "Motivation",
              description: "Daily motivational talks 💪",
              createdBy: "HOST",
              adminId: "HOST",
              members: [{ userId: "HOST", nickname: "System Admin", joinedAt: new Date() }],
              isActive: true
            },
            {
              name: "Mindfulness",
              description: "Relax, meditate and share peace 🧘",
              createdBy: "HOST",
              adminId: "HOST",
              members: [{ userId: "HOST", nickname: "System Admin", joinedAt: new Date() }],
              isActive: true
            },
            {
              name: "Support",
              description: "A safe place to talk and be heard 💙",
              createdBy: "HOST",
              adminId: "HOST",
              members: [{ userId: "HOST", nickname: "System Admin", joinedAt: new Date() }],
              isActive: true
            }
          ];
          
          try {
            const createdGroups = await CommunityGroup.insertMany(defaultGroups);
            console.log("✅ [getGroups] Default groups created in MongoDB:", createdGroups.length);
            
            const groupsWithCount = createdGroups.map(group => ({
              ...group.toObject(),
              memberCount: group.members.length,
            }));
            
            return res.json(groupsWithCount);
          } catch (insertErr) {
            console.error("❌ [getGroups] Error creating default groups in MongoDB:", insertErr.message);
            // Fall through to use fallback
          }
        }
        
        // Return groups with member count
        const groupsWithCount = groups.map(group => ({
          ...group.toObject(),
          memberCount: group.members.length,
        }));
        
        console.log(`✅ [getGroups] Returning ${groupsWithCount.length} groups from MongoDB`);
        return res.json(groupsWithCount);
      } catch (mongoErr) {
        console.warn("⚠️ [getGroups] MongoDB error:", mongoErr.message);
        console.log("📢 [getGroups] Falling back to in-memory store...");
      }
      
      // Fallback: Use in-memory store
      if (global.communityStore && global.communityStore.groups) {
        console.log(`✅ [getGroups] Returning ${global.communityStore.groups.length} groups from fallback store`);
        return res.json(global.communityStore.groups);
      }
      
      // If no fallback, return empty
      console.warn("⚠️ [getGroups] No data source available, returning empty array");
      res.json([]);
      
    } catch (err) {
      console.error("❌ [getGroups] Unexpected error:", err.message);
      console.error("❌ [getGroups] Full error:", err);
      res.status(500).json({ error: "Failed to fetch groups", details: err.message });
    }
  },

  createGroup: async (req, res) => {
    try {
      const { name, description, createdBy, maxMembers = 50 } = req.body;
      
      if (!name || !createdBy) {
        return res.status(400).json({ error: "Name and createdBy (userId) required" });
      }
      
      if (name.length < 3 || name.length > 50) {
        return res.status(400).json({ error: "Group name must be 3-50 characters" });
      }

      // Try to resolve the creator user; if not found (e.g. admin created group outside of users table)
      // allow creation but fall back to a sensible nickname.
      const user = await User.findOne({ userId: createdBy });
      const creatorNickname = user ? (user.communityNickname || `${user.firstName || 'Admin'}`) : "Group Admin";

      const group = await CommunityGroup.create({
        name,
        description: description || "",
        createdBy,
        adminId: createdBy,
        members: [{
          userId: createdBy,
          nickname: creatorNickname,
          joinedAt: new Date(),
        }],
        maxMembers,
        isActive: true,
      });

      res.status(201).json(group);
    } catch (err) {
      console.error("Error creating group:", err);
      res.status(500).json({ error: "Failed to create group" });
    }
  },

  deleteGroup: async (req, res) => {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      const group = await CommunityGroup.findById(id);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }

      // Only admin can delete
      if (group.adminId !== userId) {
        return res.status(403).json({ error: "Only admin can delete group" });
      }

      await CommunityGroup.findByIdAndDelete(id);
      res.json({ message: "Group deleted successfully" });
    } catch (err) {
      console.error("Error deleting group:", err);
      res.status(500).json({ error: "Failed to delete group" });
    }
  },

  updateGroup: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, maxMembers, isActive } = req.body;
      const group = await CommunityGroup.findById(id);
      if (!group) return res.status(404).json({ error: 'Group not found' });
      if (name) group.name = name;
      if (description !== undefined) group.description = description;
      if (maxMembers !== undefined) group.maxMembers = maxMembers;
      if (isActive !== undefined) group.isActive = isActive;
      await group.save();
      res.json({ message: 'Group updated', group });
    } catch (err) {
      console.error('Error updating group:', err);
      res.status(500).json({ error: 'Failed to update group' });
    }
  },

  clearGroupMessages: async (req, res) => {
    try {
      const { groupId } = req.params;
      await GroupMessage.deleteMany({ groupId });
      res.json({ ok: true, message: 'Group messages cleared' });
    } catch (err) {
      console.error('Error clearing messages:', err);
      res.status(500).json({ error: 'Failed to clear messages' });
    }
  },

  // ==================== GROUP MEMBERS ====================

  joinGroup: async (req, res) => {
    try {
      const { groupId } = req.params;
      const { userId, nickname } = req.body;

      if (!userId) {
        return res.status(400).json({ error: "userId required" });
      }

      const group = await CommunityGroup.findById(groupId);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }

      if (!group.isActive) {
        return res.status(400).json({ error: "Group is inactive" });
      }

      // Check if already a member
      if (group.members.some(m => m.userId === userId)) {
        return res.status(400).json({ error: "Already a member of this group" });
      }

      // Check max members
      if (group.members.length >= group.maxMembers) {
        return res.status(400).json({ error: "Group is full" });
      }

      // Get user to verify existence
      const user = await User.findOne({ userId });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const finalNickname = nickname || user.communityNickname || "Anonymous";

      group.members.push({
        userId,
        nickname: finalNickname,
        joinedAt: new Date(),
      });

      await group.save();
      res.status(200).json({ message: "Joined group successfully", group });
    } catch (err) {
      console.error("Error joining group:", err);
      res.status(500).json({ error: "Failed to join group" });
    }
  },

  leaveGroup: async (req, res) => {
    try {
      const { groupId } = req.params;
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: "userId required" });
      }

      const group = await CommunityGroup.findById(groupId);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }

      const memberIndex = group.members.findIndex(m => m.userId === userId);
      if (memberIndex === -1) {
        return res.status(400).json({ error: "Not a member of this group" });
      }

      // Don't allow admin to leave without assigning new admin
      if (group.adminId === userId && group.members.length > 1) {
        return res.status(403).json({ 
          error: "Admin cannot leave group. Assign a new admin first." 
        });
      }

      group.members.splice(memberIndex, 1);

      // If group is empty, mark as inactive
      if (group.members.length === 0) {
        group.isActive = false;
      }

      await group.save();
      res.json({ message: "Left group successfully" });
    } catch (err) {
      console.error("Error leaving group:", err);
      res.status(500).json({ error: "Failed to leave group" });
    }
  },

  getGroupMembers: async (req, res) => {
    try {
      const { groupId } = req.params;

      const group = await CommunityGroup.findById(groupId);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }

      res.json(group.members);
    } catch (err) {
      console.error("Error fetching members:", err);
      res.status(500).json({ error: "Failed to fetch members" });
    }
  },

  updateMemberNickname: async (req, res) => {
    try {
      const { groupId } = req.params;
      const { userId, nickname } = req.body;

      if (!userId || !nickname) {
        return res.status(400).json({ error: "userId and nickname required" });
      }

      if (nickname.length < 3 || nickname.length > 20) {
        return res.status(400).json({ error: "Nickname must be 3-20 characters" });
      }

      const group = await CommunityGroup.findById(groupId);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }

      const member = group.members.find(m => m.userId === userId);
      if (!member) {
        return res.status(404).json({ error: "Member not found in group" });
      }

      member.nickname = nickname;
      await group.save();

      res.json({ message: "Nickname updated", member });
    } catch (err) {
      console.error("Error updating nickname:", err);
      res.status(500).json({ error: "Failed to update nickname" });
    }
  },

  removeMember: async (req, res) => {
    try {
      const { groupId } = req.params;
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: "userId required" });
      }

      const group = await CommunityGroup.findById(groupId);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }

      const memberIndex = group.members.findIndex(m => m.userId === userId);
      if (memberIndex === -1) {
        return res.status(404).json({ error: "Member not found in group" });
      }

      group.members.splice(memberIndex, 1);

      // If group is empty, mark as inactive
      if (group.members.length === 0) {
        group.isActive = false;
      }

      await group.save();
      res.json({ message: "Member removed successfully" });
    } catch (err) {
      console.error("Error removing member:", err);
      res.status(500).json({ error: "Failed to remove member" });
    }
  },

  // ==================== GROUP MESSAGES ====================

  getGroupMessages: async (req, res) => {
    try {
      const { groupId } = req.params;
      const { limit = 50, skip = 0 } = req.query;

      // Verify group exists
      const group = await CommunityGroup.findById(groupId);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }

      const messages = await GroupMessage.find({ groupId })
        .sort({ createdAt: 1 })
        .skip(parseInt(skip))
        .limit(parseInt(limit));

      const totalCount = await GroupMessage.countDocuments({ groupId });

      res.json({
        messages,
        total: totalCount,
        limit: parseInt(limit),
        skip: parseInt(skip),
      });
    } catch (err) {
      console.error("Error fetching messages:", err);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  },

  postGroupMessage: async (req, res) => {
    try {
      const { groupId } = req.params;
      const { senderId, senderNickname, message } = req.body;

      if (!senderId || !message) {
        return res.status(400).json({ error: "senderId and message required" });
      }

      if (message.trim().length === 0) {
        return res.status(400).json({ error: "Message cannot be empty" });
      }

      // Verify group exists
      const group = await CommunityGroup.findById(groupId);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }

      // Verify sender is a member
      const member = group.members.find(m => m.userId === senderId);
      if (!member) {
        return res.status(403).json({ error: "Not a member of this group" });
      }

      const finalNickname = senderNickname || member.nickname || "Anonymous";

      const newMessage = await GroupMessage.create({
        groupId,
        senderId,
        senderNickname: finalNickname,
        message: message.trim(),
        isEdited: false,
      });

      res.status(201).json(newMessage);
    } catch (err) {
      console.error("Error posting message:", err);
      res.status(500).json({ error: "Failed to post message" });
    }
  },

  deleteMessage: async (req, res) => {
    try {
      const { messageId } = req.params;
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: "userId required" });
      }

      const message = await GroupMessage.findById(messageId);
      if (!message) {
        return res.status(404).json({ error: "Message not found" });
      }

      // Only sender or admin can delete
      if (message.senderId !== userId) {
        // Check if user is group admin
        const group = await CommunityGroup.findById(message.groupId);
        if (!group || group.adminId !== userId) {
          return res.status(403).json({ error: "Cannot delete message" });
        }
      }

      await GroupMessage.findByIdAndDelete(messageId);
      res.json({ message: "Message deleted successfully" });
    } catch (err) {
      console.error("Error deleting message:", err);
      res.status(500).json({ error: "Failed to delete message" });
    }
  },

  editMessage: async (req, res) => {
    try {
      const { messageId } = req.params;
      const { userId, message } = req.body;

      if (!userId || !message) {
        return res.status(400).json({ error: "userId and message required" });
      }

      const existingMessage = await GroupMessage.findById(messageId);
      if (!existingMessage) {
        return res.status(404).json({ error: "Message not found" });
      }

      // Only sender can edit
      if (existingMessage.senderId !== userId) {
        return res.status(403).json({ error: "Cannot edit message" });
      }

      // Can only edit within 15 minutes
      const editTimeLimit = 15 * 60 * 1000; // 15 minutes
      if (Date.now() - new Date(existingMessage.createdAt).getTime() > editTimeLimit) {
        return res.status(400).json({ error: "Message is too old to edit" });
      }

      existingMessage.message = message.trim();
      existingMessage.isEdited = true;
      existingMessage.editedAt = new Date();

      await existingMessage.save();
      res.json(existingMessage);
    } catch (err) {
      console.error("Error editing message:", err);
      res.status(500).json({ error: "Failed to edit message" });
    }
  },

  // ==================== ANNOUNCEMENTS ====================

  getAnnouncements: async (req, res) => {
    try {
      const announcements = await Announcement.find()
        .sort({ createdAt: -1 })
        .limit(20);
      res.json(announcements);
    } catch (err) {
      console.error("Error fetching announcements:", err);
      res.status(500).json({ error: "Failed to fetch announcements" });
    }
  },

  createAnnouncement: async (req, res) => {
    try {
      const { title, message, createdBy } = req.body;

      if (!title || !message) {
        return res.status(400).json({ error: "Title and message required" });
      }

      const announcement = await Announcement.create({
        title,
        message,
        createdBy: createdBy || "Admin",
      });

      res.status(201).json(announcement);
    } catch (err) {
      console.error("Error creating announcement:", err);
      res.status(500).json({ error: "Failed to create announcement" });
    }
  },

  deleteAnnouncement: async (req, res) => {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      const announcement = await Announcement.findById(id);
      if (!announcement) {
        return res.status(404).json({ error: "Announcement not found" });
      }

      // Basic permission check - you may want to implement role-based access
      await Announcement.findByIdAndDelete(id);
      res.json({ message: "Announcement deleted successfully" });
    } catch (err) {
      console.error("Error deleting announcement:", err);
      res.status(500).json({ error: "Failed to delete announcement" });
    }
  },

  // ==================== NICKNAMES ====================

  updateNickname: async (req, res) => {
    try {
      const { userId } = req.params;
      const { nickname } = req.body;

      if (!nickname) {
        return res.status(400).json({ error: "Nickname required" });
      }

      if (nickname.length < 3 || nickname.length > 20) {
        return res.status(400).json({ error: "Nickname must be 3-20 characters" });
      }

      const user = await User.findOneAndUpdate(
        { userId },
        { communityNickname: nickname },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ message: "Nickname updated", nickname: user.communityNickname });
    } catch (err) {
      console.error("Error updating nickname:", err);
      res.status(500).json({ error: "Failed to update nickname" });
    }
  },

  getNickname: async (req, res) => {
    try {
      const { userId } = req.params;

      const user = await User.findOne({ userId });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ nickname: user.communityNickname || "Anonymous" });
    } catch (err) {
      console.error("Error fetching nickname:", err);
      res.status(500).json({ error: "Failed to fetch nickname" });
    }
  },
};
