import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import Post from "../models/Post.js";
import { createNotification } from "../utils/createNotification.js";

const router = express.Router();

/**
 * 📤 Send post to selected users
 */
router.post("/send-post", authMiddleware, async (req, res) => {
  try {
    const { postId, recipients } = req.body;
    const senderId = req.user._id;

    if (!postId || !recipients?.length) {
      return res
        .status(400)
        .json({ message: "Post ID and recipients are required." });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    const senderUser = await User.findById(senderId).select("username");
    const io = req.app.get("io");

    // ✅ Notify each recipient properly
    await Promise.all(
      recipients.map((recipientId) =>
        createNotification({
          recipient: recipientId, // correct variable
          sender: senderId, // sender
          type: "send_post", // use correct notification type
          postId: post._id, // include post reference
          text: `${senderUser.username} sent you a post.`, // ✅ fixed template literal
          io, // socket instance
        })
      )
    );

    res.status(200).json({ message: "Post sent successfully." });
  } catch (error) {
    console.error("❌ Send Post Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

export default router;
