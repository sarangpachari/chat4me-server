require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const authRoutes = require('./Router/authRoutes');
const userRoutes = require('./Router/userRoutes')
require('./DB/connection');
const { initializeSocket, getSocketInstance } = require("./Config/socket"); // Import socket functions
const ChatApp = express();
const server = createServer(ChatApp);

ChatApp.use(cors());
ChatApp.use(express.json());
ChatApp.use("/auth", authRoutes);
ChatApp.use("/user", userRoutes);

// Initialize Socket.io
initializeSocket(server);

const io = getSocketInstance(); // Get io instance after initialization

const PORT = process.env.PORT || 3000;

// Start server correctly
server.listen(PORT, () => {
    console.log(`Server is running on PORT ${PORT}`);
});

// Test route
ChatApp.get('/', (req, res) => {
    res.send("Server started running");
});

// Example: Use io in an API route
ChatApp.post('/send-message', (req, res) => {
    const { senderId, receiverId, chat } = req.body;

    if (!senderId || !receiverId || !chat) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    io.emit("message", { senderId, receiverId, chat }); // Emit message globally
    res.status(200).json({ message: "Message sent" });
});
