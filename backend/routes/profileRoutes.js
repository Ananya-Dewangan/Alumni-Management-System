import express from "express";
import User from "../models/User.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Fetch current user's profile
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

// Update profile details
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

/**
 * ✅ Update user experiences
 */
router.put("/experience", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { experience } = req.body;

    if (!Array.isArray(experience)) {
      return res.status(400).json({ message: "Experience must be an array" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { experience },
      { new: true }
    );

    res.status(200).json({
      message: "Experiences updated successfully",
      experience: updatedUser.experience,
    });
  } catch (error) {
    console.error("Error updating experiences:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;