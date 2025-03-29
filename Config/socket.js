const { Server } = require("socket.io");
const Chats = require("../Model/chatShema"); // Import the Chat model
const cloudinary = require("cloudinary").v2;
const Group = require('../Model/groupSchema')
// Initialize Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Store connected users
const onlineUsers = new Map();
let io; // Global io instance

function initializeSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // Register user and store socket ID
    socket.on("register", async (userId) => {
      onlineUsers.set(userId, socket.id);
      console.log(`User ${userId} registered with socket ID: ${socket.id}`);
      io.emit("updateUserStatus", Array.from(onlineUsers.keys())); // Update online users

      // Fetch previous chats involving this user
      const previousChats = await Chats.find({
        $or: [{ senderId: userId }, { receiverId: userId }],
      }).sort({ createdAt: 1 }); // Sort by timestamp

      // Send previous chats to the user
      socket.emit("previousChats", previousChats);
      //Fetch the groups the user has joined
      const userGroups = await Group.find({ groupMembers: userId });
      socket.emit("joinedGroups",userGroups);
    });

    // Listen for incoming messages
    socket.on("message", async ({ senderId, receiverId, chat }) => {
      try {
        const message = new Chats({ senderId, receiverId, chat });
        await message.save();

        const receiverSocketId = onlineUsers.get(receiverId);

        if (receiverSocketId) {
          io.to(receiverSocketId).emit("message", message);
        }

        io.to(socket.id).emit("message", message);
      } catch (error) {
        console.error("Message saving error:", error);
      }
    });

    // Handle file transfer
    socket.on("sendFile", async ({ senderId, receiverId, file }) => {
      try {
        // Upload file to Cloudinary
        const result = await cloudinary.uploader.upload(
          `data:${file.mimetype};base64,${file.data}`,
          {
            resource_type: "auto",
          }
        );

        // Save message in MongoDB
        const message = new Chats({
          senderId,
          receiverId,
          chat: result.secure_url,
        });
        await message.save();

        const receiverSocketId = onlineUsers.get(receiverId);

        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receiveFile", message);
        }

        io.to(socket.id).emit("receiveFile", message);

        io.to(socket.id).emit("fileUploaded");
        console.log(
          `File sent from ${senderId} to ${receiverId}:`,
          result.secure_url
        );
      } catch (error) {
        console.error("File upload error:", error);
      }
    });
    socket.on("groupMessage", async ({ senderId, groupId, message }) => {
      try {
        const group = await Group.findById(groupId);
    
        if (!group) return;
    
        const newMessage = { senderId, content: message, createdAt: new Date() };
        group.groupMessages.push(newMessage);
        await group.save();
    
        // Send the message to all online members of the group
        group.groupMembers.forEach((memberId) => {
          const memberSocketId = onlineUsers.get(memberId.toString());
          if (memberSocketId) {
            io.to(memberSocketId).emit("groupMessage", { groupId, newMessage });
          }
        });
      } catch (error) {
        console.error("Error in group messaging:", error);
      }
    });
    socket.on("sendGroupFile", async ({ senderId, groupId, file }) => {
      try {
        // Upload file to Cloudinary
        const result = await cloudinary.uploader.upload(
          `data:${file.mimetype};base64,${file.data}`,
          { resource_type: "auto" }
        );
    
        const group = await Group.findById(groupId);
        if (!group) return;
    
        const fileMessage = { senderId, content: result.secure_url, createdAt: new Date() };
        group.groupMessages.push(fileMessage);
        await group.save();
    
        // Emit file to all group members
        group.groupMembers.forEach((memberId) => {
          const memberSocketId = onlineUsers.get(memberId.toString());
          if (memberSocketId) {
            io.to(memberSocketId).emit("receiveGroupFile", { groupId, fileMessage });
          }
        });
    
        console.log(`File sent in group ${groupId}:`, result.secure_url);
      } catch (error) {
        console.error("Group file upload error:", error);
      }
    });
    // Handle user disconnection
    socket.on("disconnect", () => {
      for (let [key, value] of onlineUsers.entries()) {
        if (value === socket.id) {
          onlineUsers.delete(key);
        }
      }
      io.emit("updateUserStatus", Array.from(onlineUsers.keys()));
      console.log("User disconnected:", socket.id);
    });
  });

  return io; // Return the io instance
}

function getSocketInstance() {
  return io; // Export io instance
}

module.exports = { initializeSocket, getSocketInstance };
