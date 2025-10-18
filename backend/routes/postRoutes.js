import express from "express";
import Post from "../models/Post.js"; // protect routes
import { authMiddleware } from "../middleware/authMiddleware.js";
import { alumniOnly } from "../middleware/alumniMiddleware.js";

import upload from "../middleware/multerMiddleware.js";
import uploadOnCloudinary from "../uploadconfig.js";
import fs from "fs"


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
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
// 📌 Create new post
router.post("/", authMiddleware, alumniOnly, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Image is required" });
    }

    // Upload to Cloudinary
    const cloudRes = await uploadOnCloudinary(req.file.path);
    if (!cloudRes) return res.status(500).json({ error: "Cloudinary upload failed" });

    // Delete the local file after upload
    fs.unlinkSync(req.file.path);

    // Create post in DB with Cloudinary URL
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
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Like or unlike a post
router.put("/like/:postId", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const userId = req.user._id.toString();
    const index = post.likes.findIndex((id) => id.toString() === userId);

    if (index === -1) {
      // Not liked yet → add like
      post.likes.push(req.user._id);
    } else {
      // Already liked → remove like
      post.likes.splice(index, 1);
    }

    await post.save();
    res.json(post.likes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


// Add a comment
router.post("/comment/:postId", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ message: "Comment text required" });

    post.comments.push({
      user: req.user._id,
      text: text.trim(),
    });

    await post.save();
    await post.populate("comments.user", "username profilePic role");

    res.json(post.comments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


// Get comments with pagination
router.get("/comment/:postId", authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 5 } = req.query; // default 5 per page
    const post = await Post.findById(req.params.postId)
      .populate("comments.user", "username profilePic role");

    if (!post) return res.status(404).json({ message: "Post not found" });

    // sort by newest first
    const sortedComments = [...post.comments].sort(
      (a, b) => b.created_at - a.created_at
    );

    const startIndex = (page - 1) * limit;
    const paginated = sortedComments.slice(startIndex, startIndex + parseInt(limit));

    res.json({
      comments: paginated,
      total: post.comments.length
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});



export default router;
