const express = require("express");
const router = express.Router();
const community = require("../controllers/communityController");
const adminAuth = require("../middleware/adminAuth");

// ==================== GROUPS ====================
router.get("/groups", community.getGroups);
router.post("/group", community.createGroup); // Any user can create group
router.delete("/group/:id", community.deleteGroup);

// ==================== GROUP MEMBERS ====================
router.post("/group/:groupId/join", community.joinGroup);
router.delete("/group/:groupId/leave", community.leaveGroup);
router.get("/group/:groupId/members", community.getGroupMembers);
router.put("/group/:groupId/member/nickname", community.updateMemberNickname);

// ==================== GROUP MESSAGES ====================
router.get("/group/:groupId/messages", community.getGroupMessages);
router.post("/group/:groupId/message", community.postGroupMessage);
router.delete("/message/:messageId", community.deleteMessage);
router.put("/message/:messageId", community.editMessage);

// ==================== NICKNAMES ====================
router.put("/user/:userId/nickname", community.updateNickname);
router.get("/user/:userId/nickname", community.getNickname);

// ==================== ANNOUNCEMENTS ====================
router.get("/announcements", community.getAnnouncements);
router.post("/announcement", adminAuth, community.createAnnouncement);
router.delete("/announcement/:id", adminAuth, community.deleteAnnouncement);

module.exports = router;
