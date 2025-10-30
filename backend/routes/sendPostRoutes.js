import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import Post from "../models/Post.js";
import Notification from "../models/Notification.js";

const router = express.Router();

/**
 * 📤 Send post to selected users
 */
router.post("/send-post", authMiddleware, async (req, res) => {
  try {
    const { postId, recipients } = req.body; // recipients = array of user IDs
    const senderId = req.user._id;

    console.log("📨 Send post request:", { postId, recipients, senderId });

    if (!postId || !recipients?.length) {
      return res.status(400).json({ message: "Post ID and recipients are required." });
    }

    // ✅ Ensure post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    // ✅ Create a notification for each recipient
    const notifications = recipients.map((recipientId) => ({
      sender: senderId,
      recipient: recipientId,
      text: "sent you a post.",  // ✅ Fixed
      type: "post",
      post: postId,
    }));

    await Notification.insertMany(notifications);

    console.log("✅ Notifications created successfully!");
    res.status(200).json({ message: "Post sent successfully to recipients." });
  } catch (error) {
    console.error("❌ Send Post Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

export default router;
