import express from "express";
import User from "../models/User.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { createNotification } from "../utils/createNotification.js"; // 🔔 Import notification helper

const router = express.Router();

// 📌 Get all other users (for searching in MyNetwork)
router.get("/all", authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user._id;

    // Fetch all users except current user
    const users = await User.find({ _id: { $ne: currentUserId } }).select(
      "firstname lastname username role profilePic"
    );

    res.json({ users });
  } catch (err) {
    console.error("GET /follow/all error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// 📌 Get users current user is following
router.get("/following", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: "following",
      select: "firstname lastname username role profilePic",
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ following: user.following || [] });
  } catch (err) {
    console.error("GET /follow/following error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// 📌 Get users who follow the current user
router.get("/followers", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: "followers",
      select: "firstname lastname username role profilePic",
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ followers: user.followers || [] });
  } catch (err) {
    console.error("GET /follow/followers error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// 📌 Follow a user (with notification)
router.post("/follow/:id", authMiddleware, async (req, res) => {
  try {
    const targetId = req.params.id;
    const currentId = req.user._id.toString();

    if (targetId === currentId) {
      return res.status(400).json({ message: "Can't follow yourself" });
    }

    const [currentUser, targetUser] = await Promise.all([
      User.findById(currentId),
      User.findById(targetId),
    ]);
    if (!targetUser)
      return res.status(404).json({ message: "Target user not found" });

    // Add follow only if not already following
    if (!currentUser.following.includes(targetId)) {
      currentUser.following.push(targetId);
      targetUser.followers.push(currentId);

      await currentUser.save();
      await targetUser.save();

      // 🔔 Create follow notification
      await createNotification({
        recipient: targetUser._id,
        sender: req.user._id,
        type: "follow",
        text: `${req.user.username} started following you.`,
      });
    }

    res.json({ message: "Followed", following: currentUser.following });
  } catch (err) {
    console.error("POST /follow/:id error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// 📌 Unfollow a user
router.post("/unfollow/:id", authMiddleware, async (req, res) => {
  try {
    const targetId = req.params.id;
    const currentId = req.user._id.toString();

    if (targetId === currentId) {
      return res.status(400).json({ message: "Can't unfollow yourself" });
    }

    const [currentUser, targetUser] = await Promise.all([
      User.findById(currentId),
      User.findById(targetId),
    ]);
    if (!targetUser)
      return res.status(404).json({ message: "Target user not found" });

    // Remove from followers/following lists
    currentUser.following = currentUser.following.filter(
      (id) => id.toString() !== targetId
    );
    targetUser.followers = targetUser.followers.filter(
      (id) => id.toString() !== currentId
    );

    await currentUser.save();
    await targetUser.save();

    res.json({ message: "Unfollowed", following: currentUser.following });
  } catch (err) {
    console.error("POST /unfollow/:id error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
