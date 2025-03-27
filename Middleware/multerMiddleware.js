const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
require("dotenv").config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer storage using Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "uploads", 
    format: async (req, file) => "png", // Convert to PNG
    public_id: (req, file) => file.originalname.split(".")[0], // Use filename as ID
  },
});

const upload = multer({ storage });

module.exports = upload;