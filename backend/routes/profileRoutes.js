import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import User from "../models/User.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

/* ---------------------- FETCH PROFILE ---------------------- */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------------- UPDATE DETAILS ---------------------- */
router.put("/details", authMiddleware, async (req, res) => {
  try {
    const updates = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) return res.status(404).json({ message: "User not found" });
    res.json(updatedUser);
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ message: "Server error updating profile" });
  }
});

/* ---------------------- MULTER SETUP ---------------------- */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads/profile");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.user._id}_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png/;
    const validExt = allowed.test(path.extname(file.originalname).toLowerCase());
    const validMime = allowed.test(file.mimetype);
    validExt && validMime ? cb(null, true) : cb(new Error("Only JPG, PNG allowed"));
  },
});

/* ---------------------- UPLOAD / UPDATE PHOTO ---------------------- */
router.put("/photo", authMiddleware, upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No photo uploaded" });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Delete old photo if stored locally
    if (user.photo && user.photo.startsWith("http://localhost:5000/uploads")) {
      const oldPath = path.join(process.cwd(), user.photo.replace("http://localhost:5000", ""));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    // ✅ Save full URL (not relative path)
    const fullURL = `${req.protocol}://${req.get("host")}/uploads/profile/${req.file.filename}`;
    user.photo = fullURL;
    await user.save();

    console.log("✅ Profile photo uploaded:", fullURL);
    res.json({ message: "Profile photo updated successfully", photo: fullURL });
  } catch (err) {
    console.error("❌ Error updating profile photo:", err);
    res.status(500).json({ message: "Server error while updating photo" });
  }
});

/* ---------------------- DELETE PHOTO ---------------------- */
router.delete("/photo", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Delete existing photo if stored locally
    if (user.photo && user.photo.startsWith("http://localhost:5000/uploads")) {
      const filePath = path.join(process.cwd(), user.photo.replace("http://localhost:5000", ""));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    // ✅ Set proper default avatar
    const defaultAvatar =
      user.gender === "female"
        ? "https://cdn-icons-png.freepik.com/256/6997/6997662.png?semt=ais_white_label"
        : "https://cdn-icons-png.freepik.com/256/4140/4140048.png?semt=ais_white_label";

    user.photo = defaultAvatar;
    await user.save();

    console.log("🗑️ Profile photo deleted, reverted to default");
    res.json({ message: "Profile photo removed successfully", photo: defaultAvatar });
  } catch (err) {
    console.error("❌ Error deleting profile photo:", err);
    res.status(500).json({ message: "Server error while deleting photo" });
  }
});

export default router;
