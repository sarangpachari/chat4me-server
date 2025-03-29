const User = require("../Model/userSchema");
const { sendOtpMail } = require('../Config/nodeMailer')
const jwt = require("jsonwebtoken");
const mongoose = require('mongoose')

// Temporary OTP storage
const otpStore = new Map(); // { "email": { otp: "123456", expiresAt: Date } }
console.log(otpStore);

// ✅ Register or Send OTP
exports.generateOtp = async (req, res) => {
  const { email } = req.body;

  try {

    // Generate OTP for login
    const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP

    // Store OTP in memory (expires in 5 minutes)
    otpStore.set(email, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });

    // Send OTP via email
    await sendOtpMail(email, otp);

    return res.status(200).json({ message: "OTP sent to your email" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.verifyOtpLogin = async (req, res) => {
  const { email, otp } = req.body;

  try {
    // Check if OTP exists
    const storedOtp = otpStore.get(email);

    if (!storedOtp || storedOtp.expiresAt < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    if (storedOtp.otp !== parseInt(otp)) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // OTP is valid, remove it from storage
    otpStore.delete(email);

    // Check if the user exists
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(202).json({ message: "Create a username" });
    }

    //  Generate JWT Token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    return res.status(201).json({ message: "Login successful", token, username: user.username, user });

  } catch (error) {
    console.error("Error in OTP verification:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


exports.getUsername = async (req, res) => {

  const { email, username } = req.body;

  try {
    // Check if username exists in the database
    const existingUser = await User.findOne({ username });

    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    // Create new user with email & username
    const newUser = new User({ email, username });
    await newUser.save();

    return res.status(201).json({
      message: "User created successfully",
      newUser
    });


  } catch (error) {
    console.error("Error in username creation:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}



exports.getUserInfo = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.params);
    const user = await User.findById(userId);

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user info:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();

    if (!users.length) {
      return res.status(404).json({ message: "No users found" });
    }

    res.status(200).json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


exports.getSearchUser = async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};

    // If search query is provided, filter users
    if (search) {
      query = { username: { $regex: search, $options: "i" } };

    }

    const users = await User.find(query);

    if (!users.length) {
      return res.status(404).json({ message: "No users found" });
    }

    res.status(200).json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.payload; // Extract user ID from JWT middleware
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // ✅ Get the S3 file URL
    const imageUrl = req.file.location;

    // ✅ Update user profile in MongoDB
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profileImage: imageUrl },
      { new: true }
    );

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.updateUsername = async (req, res) => {
  try {
    const { userId, newUsername } = req.body; // Extract userId & new username

    // Check if username already exists
    const existingUsername = await User.findOne({ username: newUsername });
    if (existingUsername) {
      return res.status(400).json({ error: "Username already exists. Please try another one." });
    }

    // Find user by ID and update username
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { username: newUsername },
      { new: true } // Return the updated document
    );

    return res.status(200).json({
      message: "Username updated successfully",
      user: updatedUser
    });

  } catch (error) {
    console.error("Error updating username:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.updateProfile = async (req, res) => {
  console.log("inside update profile");

  try {
    const { id } = req.params; // Get user ID from params

    // Check if a file is uploaded
    if (!req.file) {
      return res.status(401).json({ success: false, message: "No file uploaded" });
    }

    // Get Cloudinary details

    const url = req.file.path || req.file.secure_url; // Cloudinary Image URL
    console.log(url);

    // Find user by ID and update profileImg field
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { profileImg: url }, // Update profileImg field
      { new: true, runValidators: true } // Return updated user & validate data
    );

    if (!updatedUser) {
      return res.status(400).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "Profile image updated successfully",
      profileImg: updatedUser.profileImg, // Return updated profile image
    });

  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ success: false, message: "Error updating profile image" });
  }
};
