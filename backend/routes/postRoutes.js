import express from "express";
import fs from "fs";
import Post from "../models/Post.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { alumniOnly } from "../middleware/alumniMiddleware.js";
import upload from "../middleware/multerMiddleware.js";
import uploadOnCloudinary from "../uploadconfig.js";
import { createNotification } from "../utils/createNotification.js";

const router = express.Router();

// 📌 Get all posts
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("author", "username profilePic role")
      .populate("comments.user", "username profilePic role")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    console.error("GET /posts error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// 📌 Create new post (Alumni only)
router.post("/", authMiddleware, alumniOnly, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Image is required" });
    }

    const cloudRes = await uploadOnCloudinary(req.file.path);
    if (!cloudRes) return res.status(500).json({ error: "Cloudinary upload failed" });
    fs.unlinkSync(req.file.path);

    const newPost = new Post({
      author: req.user._id,
      title: req.body.title,
      content: req.body.content,
      image_url: cloudRes.secure_url,
    });

    const savedPost = await newPost.save();
    await savedPost.populate("author", "username profilePic role");

    res.status(201).json(savedPost);
  } catch (err) {
    console.error("POST /posts error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// 📌 Like or Unlike a post
router.put("/like/:postId", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId).populate("author", "username");
    if (!post) return res.status(404).json({ message: "Post not found" });

    const userId = req.user._id.toString();
    const index = post.likes.findIndex((id) => id.toString() === userId);

    if (index === -1) {
      post.likes.push(req.user._id);

      if (post.author._id.toString() !== userId) {
        await createNotification({
          recipient: post.author._id,
          sender: req.user._id,
          type: "like",
          postId: post._id,
          text: `${req.user.username} liked your post.`,
        });
      }
    } else {
      post.likes.splice(index, 1);
    }

    await post.save();
    res.json(post.likes);
  } catch (err) {
    console.error("PUT /like/:postId error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// 📌 Add a comment or reply
router.post("/comment/:postId", authMiddleware, async (req, res) => {
  try {
    const { text, parentCommentId } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Comment text required" });
    }

    const post = await Post.findById(req.params.postId)
      .populate("author", "username")
      .populate("comments.user", "username");

    if (!post) return res.status(404).json({ message: "Post not found" });

    if (parentCommentId) {
      // 🔹 Reply to a comment
      const parentComment = post.comments.id(parentCommentId);
      if (!parentComment)
        return res.status(404).json({ message: "Parent comment not found" });

      parentComment.replies = parentComment.replies || [];
      parentComment.replies.push({
        user: req.user._id,
        text: text.trim(),
      });

      await post.save();

      // 🔔 Notify original commenter if not self
      if (parentComment.user.toString() !== req.user._id.toString()) {
        await createNotification({
          recipient: parentComment.user,
          sender: req.user._id,
          type: "reply",
          postId: post._id,
          text: `${req.user.username} replied to your comment on a post.`,
        });
      }
    } else {
      // 🔹 New comment on post
      post.comments.push({
        user: req.user._id,
        text: text.trim(),
      });

      await post.save();

      // 🔔 Notify post author if not self
      if (post.author._id.toString() !== req.user._id.toString()) {
        await createNotification({
          recipient: post.author._id,
          sender: req.user._id,
          type: "comment",
          postId: post._id,
          text: `${req.user.username} commented on your post.`,
        });
      }
    }

    await post.populate("comments.user", "username profilePic role");
    res.json(post.comments);
  } catch (err) {
    console.error("POST /comment/:postId error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// 📌 Get comments with pagination
router.get("/comment/:postId", authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 5 } = req.query;
    const post = await Post.findById(req.params.postId).populate(
      "comments.user",
      "username profilePic role"
    );

    if (!post) return res.status(404).json({ message: "Post not found" });

    const sortedComments = [...post.comments].sort(
      (a, b) => b.created_at - a.created_at
    );

    const startIndex = (page - 1) * limit;
    const paginated = sortedComments.slice(startIndex, startIndex + parseInt(limit));

    res.json({
      comments: paginated,
      total: post.comments.length,
    });
  } catch (err) {
    console.error("GET /comment/:postId error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
