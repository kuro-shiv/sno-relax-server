const express = require("express");
const router = express.Router();
const community = require("../controllers/communityController");
const adminAuth = require("../middleware/adminAuth");

// Groups
router.get("/groups", community.getGroups);
router.post("/group", adminAuth, community.createGroup); // admin creates
router.delete("/group/:id", adminAuth, community.deleteGroup);
router.post("/group/:id/member", adminAuth, community.addMember);
router.delete("/group/:id/member", adminAuth, community.removeMember);

// Group messages
router.get("/group/:id/messages", community.getGroupMessages);
router.post("/group/:id/message", community.postGroupMessage);

// Private messages
router.get("/private/:id/messages", community.getPrivateMessages); // requires ?me=<yourId>
router.post("/private/message", community.postPrivateMessage);

// Announcements
router.get("/announcements", community.getAnnouncements);
router.post("/announcement", adminAuth, community.createAnnouncement);
router.delete("/announcement/:id", adminAuth, community.deleteAnnouncement);

module.exports = router;
