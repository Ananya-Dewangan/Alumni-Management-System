import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import User from "../models/User.js";

import upload from "../middleware/multerMiddleware.js";
import uploadOnCloudinary from "../uploadconfig.js";
import fs from "fs"

const router = express.Router();

// Get logged-in user profile
router.get("/", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: "Server Error" });
  }
});

// Update user profile
router.put("/details", authMiddleware, async (req, res) => {
  try {
    var userData = req.body.profile;
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: userData },
      { new: true, runValidators: true }
    ).select("-password");

    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ msg: "Server Error" });
  }
});


router.put("/photo", authMiddleware, upload.single("profilePic"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const cloudRes = await uploadOnCloudinary(req.file.path);
    
    
    if (!cloudRes) return res.status(500).json({ error: "Cloudinary upload failed" });
    
    // Delete the file from local storage after upload
    fs.unlinkSync(req.file.path);

    // Update user profile in DB with Cloudinary URL
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { profilePic: cloudRes.secure_url }, // store Cloudinary URL
      { new: true }
    );
    res.json(updatedUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
