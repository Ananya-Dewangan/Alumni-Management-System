import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import upload from "../middleware/multerMiddleware.js";
import uploadOnCloudinary from "../uploadconfig.js";
import fs from "fs";

const router = express.Router();

// Get profile
router.get("/", authMiddleware, async (req, res) => {
  try {
    res.json(req.user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server Error fetching profile" });
  }
});

// Update profile details
router.put("/details", authMiddleware, async (req, res) => {
  try {
    const userData = req.body.profile;
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: userData },
      { new: true, runValidators: true }
    ).select("-password");

    res.json(updatedUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server Error updating profile" });
  }
});

// Update profile photo
router.put("/photo", authMiddleware, upload.single("profilePic"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const cloudRes = await uploadOnCloudinary(req.file.path);
    if (!cloudRes) return res.status(500).json({ error: "Cloudinary upload failed" });

    fs.unlinkSync(req.file.path);

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { profilePic: cloudRes.secure_url },
      { new: true }
    ).select("-password");

    res.json(updatedUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error updating photo" });
  }
});

export default router;