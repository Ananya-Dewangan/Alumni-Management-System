import express from "express";
import User from "../models/User.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { createNotification } from "../utils/createNotification.js";

const router = express.Router();

/* -----------------------------------------------------------
   📌 Get all other users (for search or Send Post page)
----------------------------------------------------------- */
router.get("/all", authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const users = await User.find({ _id: { $ne: currentUserId } }).select(
      "firstname lastname username role profilePic followers"
    );

    // ✅ Add isFollowing boolean for frontend
    const formatted = users.map((u) => ({
      ...u._doc,
      isFollowing: u.followers.some(
        (followerId) => followerId.toString() === currentUserId.toString()
      ),
    }));

    res.json({ users: formatted });
  } catch (err) {
    console.error("GET /follow/all error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* -----------------------------------------------------------
   📌 Get following list
----------------------------------------------------------- */
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

/* -----------------------------------------------------------
   📌 Get followers list
----------------------------------------------------------- */
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

/* -----------------------------------------------------------
   📌 Follow a user (with notification)
----------------------------------------------------------- */
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
    if (!targetUser) return res.status(404).json({ message: "Target user not found" });

    if (!currentUser.following.includes(targetId)) {
      currentUser.following.push(targetId);
      targetUser.followers.push(currentId);

      await currentUser.save();
      await targetUser.save();

      // ✅ Fixed string interpolation inside template literal
      await createNotification({
        recipient: targetUser._id,
        sender: req.user._id,
        type: "follow",
        text: `${req.user.username} started following you.`,
      });
    }

    res.json({ message: "Followed successfully", following: currentUser.following });
  } catch (err) {
    console.error("POST /follow/:id error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* -----------------------------------------------------------
   📌 Unfollow a user
----------------------------------------------------------- */
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
    if (!targetUser) return res.status(404).json({ message: "Target user not found" });

    currentUser.following = currentUser.following.filter(
      (id) => id.toString() !== targetId
    );
    targetUser.followers = targetUser.followers.filter(
      (id) => id.toString() !== currentId
    );

    await currentUser.save();
    await targetUser.save();

    res.json({ message: "Unfollowed successfully", following: currentUser.following });
  } catch (err) {
    console.error("POST /unfollow/:id error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
