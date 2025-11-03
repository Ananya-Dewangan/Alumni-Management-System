// routes/postRoutes.js
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
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    console.error("GET /posts error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* -----------------------------------------------------------
   📌 CREATE new post (✅ all roles: alumni, admin, student)
----------------------------------------------------------- */
router.post("/", authMiddleware, upload.single("image"), async (req, res) => {
  try {
    let imageUrl = null;

    // ✅ Upload image if provided
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

    // ✅ Create new post
    const newPost = new Post({
      author: req.user._id,
      title: req.body.title,
      content: req.body.content,
      image_url: imageUrl,
    });

    const savedPost = await newPost.save();
    await savedPost.populate("author", "username profilePic role");

    // ✅ Notify followers of the author
    const author = await User.findById(req.user._id).populate(
      "followers",
      "_id username"
    );

    if (author && author.followers.length > 0) {
      const io = req.app.get("io");

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

      // 🔹 Emit socket event to followers
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
    const post = await Post.findById(req.params.postId).populate(
      "author",
      "username"
    );
    if (!post) return res.status(404).json({ message: "Post not found" });

    const userId = req.user._id.toString();
    const index = post.likes.findIndex((id) => id.toString() === userId);

    if (index === -1) {
      post.likes.push(req.user._id);

      // ✅ Notify post author (not self)
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
      post.likes.splice(index, 1); // Unlike
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
      // 🔹 New comment
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

/* -----------------------------------------------------------
   📌 GET comments with pagination
----------------------------------------------------------- */
router.get("/comment/:postId", authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 5 } = req.query;
    const post = await Post.findById(req.params.postId).populate(
      "comments.user",
      "username profilePic role"
    );

    if (!post) return res.status(404).json({ message: "Post not found" });

    const sortedComments = [...post.comments].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    const startIndex = (page - 1) * limit;
    const paginated = sortedComments.slice(
      startIndex,
      startIndex + parseInt(limit)
    );

    res.json({
      comments: paginated,
      total: post.comments.length,
    });
  } catch (err) {
    console.error("GET /comment/:postId error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* -----------------------------------------------------------
   📌 EDIT post (✅ title, content & image)
----------------------------------------------------------- */
router.put("/:id", authMiddleware, upload.single("image"), async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const { title, content } = req.body;
    post.title = title || post.title;
    post.content = content || post.content;

    // ✅ Update image if provided
    if (req.file) {
      try {
        const cloudRes = await uploadOnCloudinary(req.file.path);
        if (cloudRes) {
          post.image_url = cloudRes.secure_url;
          fs.unlinkSync(req.file.path);
        }
      } catch (uploadErr) {
        console.error("Image update failed:", uploadErr);
        return res.status(500).json({ message: "Image upload failed" });
      }
    }

    await post.save();
    await post.populate("author", "username profilePic role");
    res.json(post);
  } catch (err) {
    console.error("PUT /posts/:id error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* -----------------------------------------------------------
   📌 DELETE post (only author)
----------------------------------------------------------- */
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error("DELETE /posts/:id error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* -----------------------------------------------------------
   📌 REPOST (reference another post + notify author)
----------------------------------------------------------- */
router.post("/repost/:id", authMiddleware, async (req, res) => {
  try {
    const originalPost = await Post.findById(req.params.id).populate(
      "author",
      "username profilePic role"
    );
    if (!originalPost)
      return res.status(404).json({ message: "Original post not found" });

    // ✅ Create a new post with reference to the original
    const newPost = new Post({
      author: req.user._id,
      title: originalPost.title,
      content: originalPost.content,
      image_url: originalPost.image_url,
      isRepost: true,
      originalPost: originalPost._id,
    });

    const savedRepost = await newPost.save();
    await savedRepost.populate("author", "username profilePic role");

    // ✅ Notify the original author (if not self)
    if (originalPost.author._id.toString() !== req.user._id.toString()) {
      await createNotification({
        recipient: originalPost.author._id,
        sender: req.user._id,
        type: "repost",
        postId: savedRepost._id,
        text: `${req.user.username} reposted your post.`,
      });

      const io = req.app.get("io");
      io.to(originalPost.author._id.toString()).emit("newNotification", {
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
   📩 SEND post to another user (via DM)
----------------------------------------------------------- */
router.post("/send/:postId", authMiddleware, async (req, res) => {
  try {
    const { recipientUsername } = req.body;
    if (!recipientUsername)
      return res.status(400).json({ message: "Recipient username required" });

    const recipient = await User.findOne({ username: recipientUsername });
    if (!recipient)
      return res.status(404).json({ message: "Recipient not found" });

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
   📍 Get a single post by ID
----------------------------------------------------------- */
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("author", "username profilePic role")
      .populate("comments.user", "username profilePic role");

    if (!post) return res.status(404).json({ message: "Post not found" });

    res.json(post);
  } catch (err) {
    console.error("Error fetching post:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
