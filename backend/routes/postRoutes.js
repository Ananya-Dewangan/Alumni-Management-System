import express from "express";
import fs from "fs";
import Post from "../models/Post.js";
import User from "../models/User.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import upload from "../middleware/multerMiddleware.js";
import uploadOnCloudinary from "../uploadconfig.js";
import { createNotification } from "../utils/createNotification.js";

const router = express.Router();

/* -----------------------------------------------------------
   📌 GET all posts
----------------------------------------------------------- */
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("author", "username profilePic role")
      .populate("comments.user", "username profilePic role")
      .populate({
        path: "repostFrom",
        populate: { path: "author", select: "username profilePic role" },
      })
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    console.error("GET /posts error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* -----------------------------------------------------------
   📌 CREATE new post
----------------------------------------------------------- */
router.post("/", authMiddleware, upload.single("image"), async (req, res) => {
  try {
    let imageUrl = null;

    if (req.file) {
      try {
        const cloudRes = await uploadOnCloudinary(req.file.path);
        if (cloudRes) {
          imageUrl = cloudRes.secure_url;
          fs.unlinkSync(req.file.path);
        }
      } catch (uploadErr) {
        console.error("Cloudinary upload failed:", uploadErr);
        return res.status(500).json({ message: "Image upload failed" });
      }
    }

    const newPost = new Post({
      author: req.user._id,
      title: req.body.title,
      content: req.body.content,
      image_url: imageUrl,
    });

    const savedPost = await newPost.save();
    await savedPost.populate("author", "username profilePic role");

    const author = await User.findById(req.user._id).populate("followers", "_id username");
    if (author && author.followers.length > 0) {
      const notifications = author.followers.map((follower) =>
        createNotification({
          recipient: follower._id,
          sender: req.user._id,
          type: "post",
          postId: savedPost._id,
          text: `${req.user.username} posted a new update.`,
        })
      );

      await Promise.all(notifications);

      const io = req.app.get("io");
      author.followers.forEach((f) => {
        io.to(f._id.toString()).emit("newNotification", {
          message: `${req.user.username} posted a new update.`,
        });
      });
    }

    res.status(201).json(savedPost);
  } catch (err) {
    console.error("POST /posts error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* -----------------------------------------------------------
   📌 LIKE / UNLIKE post
----------------------------------------------------------- */
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

/* -----------------------------------------------------------
   📌 ADD comment or reply
----------------------------------------------------------- */
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
      const parentComment = post.comments.id(parentCommentId);
      if (!parentComment)
        return res.status(404).json({ message: "Parent comment not found" });

      parentComment.replies = parentComment.replies || [];
      parentComment.replies.push({
        user: req.user._id,
        text: text.trim(),
      });

      await post.save();

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
      post.comments.push({
        user: req.user._id,
        text: text.trim(),
      });

      await post.save();

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

/* -----------------------------------------------------------
   📌 REPOST (reference another post)
----------------------------------------------------------- */
router.post("/repost/:id", authMiddleware, async (req, res) => {
  try {
    const repostFrom = await Post.findById(req.params.id).populate("author", "username profilePic role");
    if (!repostFrom) return res.status(404).json({ message: "Original post not found" });

    const newPost = new Post({
      author: req.user._id,
      title: repostFrom.title,
      content: repostFrom.content,
      image_url: repostFrom.image_url,
      isRepost: true,
      repostFrom: repostFrom._id,
    });

    const savedRepost = await newPost.save();
    await savedRepost.populate("author", "username profilePic role");

    if (repostFrom.author._id.toString() !== req.user._id.toString()) {
      await createNotification({
        recipient: repostFrom.author._id,
        sender: req.user._id,
        type: "repost",
        postId: savedRepost._id,
        text: `${req.user.username} reposted your post.`,
      });

      const io = req.app.get("io");
      io.to(repostFrom.author._id.toString()).emit("newNotification", {
        message: `${req.user.username} reposted your post.`,
      });
    }

    res.status(201).json(savedRepost);
  } catch (err) {
    console.error("POST /repost/:id error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* -----------------------------------------------------------
   📌 SEND post to another user (DM)
----------------------------------------------------------- */
router.post("/send/:postId", authMiddleware, async (req, res) => {
  try {
    const { recipientUsername } = req.body;
    if (!recipientUsername)
      return res.status(400).json({ message: "Recipient username required" });

    const recipient = await User.findOne({ username: recipientUsername });
    if (!recipient) return res.status(404).json({ message: "Recipient not found" });

    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    await createNotification({
      recipient: recipient._id,
      sender: req.user._id,
      type: "send_post",
      postId: post._id,
      text: `${req.user.username} sent you a post.`,
    });

    const io = req.app.get("io");
    io.to(recipient._id.toString()).emit("newNotification", {
      message: `${req.user.username} sent you a post.`,
    });

    res.json({ message: "Post sent successfully" });
  } catch (err) {
    console.error("POST /send/:postId error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* -----------------------------------------------------------
   📌 GET single post by ID
----------------------------------------------------------- */
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("author", "username profilePic role")
      .populate("comments.user", "username profilePic role")
      .populate({
        path: "repostFrom",
        populate: { path: "author", select: "username profilePic role" },
      });

    if (!post) return res.status(404).json({ message: "Post not found" });

    res.json(post);
  } catch (err) {
    console.error("Error fetching post:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* -----------------------------------------------------------
   📌 DELETE a post by ID
----------------------------------------------------------- */
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // ✅ Only allow the author (or admin) to delete
    if (
      post.author.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not authorized to delete this post" });
    }

    // ✅ Delete post image from Cloudinary if it exists
    if (post.image_url && post.image_url.includes("cloudinary.com")) {
      try {
        const publicId = post.image_url
          .split("/")
          .pop()
          .split(".")[0];
        const cloudinary = await import("cloudinary");
        await cloudinary.v2.uploader.destroy(publicId);
      } catch (cloudErr) {
        console.error("Cloudinary delete failed:", cloudErr);
      }
    }

    await post.deleteOne();

    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error("DELETE /posts/:id error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
