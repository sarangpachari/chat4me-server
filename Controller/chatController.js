const Chats = require("../Model/chatShema"); // Adjust path based on your project structure
const mongoose = require("mongoose");
const User = require("../Model/userSchema");

exports.getChatUsers = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.params); 

    const chats = await Chats.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
    }).select("senderId receiverId -_id"); // Fetch only senderId & receiverId

    if (!chats.length) {
      return res.status(400).json({ message: "No chats found", users: [] });
    }

    let chatUserIds = new Set(); // Store unique user IDs

    chats.forEach((chat) => {
      const senderId = chat.senderId.toString();
      const receiverId = chat.receiverId.toString();

      // Add the opposite user ID
      if (senderId === userId.toString()) {
        chatUserIds.add(receiverId);
      } else {
        chatUserIds.add(senderId);
      }
    });

    const users = await User.find(
      { _id: { $in: Array.from(chatUserIds) } },
      "username email"
    );

    return res.status(200).json({
      users: users, // Return user details instead of just IDs
    });
  } catch (error) {
    console.error("Error fetching chat users:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.deleteSingleChat = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(401).json({ message: "Chat ID is required" });
    }
    const deletedChat = await Chats.findByIdAndDelete(id);
    if (!deletedChat) {
      return res.status(400).json({ message: "Chat not found" });
    }
    res.status(200).json({ message: "Chat deleted successfully", deletedChat });
  } catch (error) {
    console.error("Error deleting chat:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};

exports.clearAllChats = async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;

    if (!senderId || !receiverId) {
      return res
        .status(400)
        .json({ message: "Sender ID and Receiver ID are required" });
    }

    // Delete all chats where senderId and receiverId match in either direction
    const result = await Chats.deleteMany({
      $or: [
        { senderId: senderId, receiverId: receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    });

    if (result.deletedCount === 0) {
      return res.status(401).json({ message: "No chats found to delete" });
    }

    res
      .status(200)
      .json({
        message: "Chats deleted successfully",
        deletedCount: result.deletedCount,
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
