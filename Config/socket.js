const { Server } = require("socket.io");
const Chats = require("../Model/chatShema"); // Import the Chat model

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
