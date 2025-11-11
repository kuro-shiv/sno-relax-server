const GroupMessage = require("../models/GroupMessage");
const PrivateMessage = require("../models/PrivateMessage");

module.exports = function (io) {
  io.on("connection", (socket) => {
    // identify user (optional): clients can emit `identify` with their userId to join a personal room
    socket.on("identify", (userId) => {
      if (userId) socket.join(`user_${userId}`);
    });

    socket.on("joinGroup", (groupId) => {
      socket.join(groupId);
    });

    socket.on("leaveGroup", (groupId) => {
      socket.leave(groupId);
    });

    // Support both legacy ('sendMessage'/'newMessage') and newer ('sendGroupMessage'/'receiveGroupMessage') events
    socket.on("sendGroupMessage", async (payload) => {
      // payload: { groupId, senderId, message }
      try {
        const { groupId, senderId, message } = payload;
        const m = new GroupMessage({ groupId, senderId, message });
        await m.save();
        const populated = await m.populate("senderId", "name");
        // emit both new and receive events for backward compatibility
        io.to(groupId).emit("receiveGroupMessage", populated);
        io.to(groupId).emit("newMessage", populated);
      } catch (err) {
        console.error("socket sendGroupMessage error", err);
      }
    });

    socket.on("sendMessage", async (payload) => {
      // legacy payload shape: { groupId, message }
      try {
        const groupId = payload.groupId || payload?.message?.groupId;
        const message = payload.message || payload;
        // Try to persist if senderId available
        const senderId = message.senderId || message.userId || null;
        const text = message.message || message.text || (typeof message === "string" ? message : "");
        const m = new GroupMessage({ groupId, senderId, message: text });
        await m.save();
        const populated = await m.populate("senderId", "name");
        io.to(groupId).emit("newMessage", populated);
        io.to(groupId).emit("receiveGroupMessage", populated);
      } catch (err) {
        console.error("socket sendMessage error", err);
      }
    });

    socket.on("sendPrivateMessage", async (payload) => {
      // payload: { senderId, receiverId, message }
      try {
        const { senderId, receiverId, message } = payload;
        const m = new PrivateMessage({ senderId, receiverId, message });
        await m.save();
        io.to(`user_${receiverId}`).emit("receivePrivateMessage", m);
      } catch (err) {
        console.error("socket sendPrivateMessage error", err);
      }
    });

    socket.on("disconnect", () => {
      // cleanup if necessary
    });
  });
};
