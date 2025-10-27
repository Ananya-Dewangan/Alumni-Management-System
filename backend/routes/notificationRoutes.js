import express from "express";
import Notification from "../models/Notification.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * ✅ Get all notifications (both read and unread)
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate("sender", "username profilePic")
      .populate("postId", "title")
      .sort({ createdAt: -1 });

    res.json(notifications);
  } catch (err) {
    console.error("GET /notifications error:", err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

/**
 * ✅ Get unread notification count
 */
router.get("/count", authMiddleware, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user._id,
      read: false,
    });
    res.json({ count });
  } catch (err) {
    console.error("GET /notifications/count error:", err);
    res.status(500).json({ error: "Failed to fetch count" });
  }
});

/**
 * ✅ Mark a single notification as read
 */
router.put("/:id/read", authMiddleware, async (req, res) => {
  try {
    const notif = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    if (!notif)
      return res.status(404).json({ error: "Notification not found" });
    res.json({ success: true, notif });
  } catch (err) {
    console.error("PUT /notifications/:id/read error:", err);
    res.status(500).json({ error: "Failed to mark as read" });
  }
});

/**
 * ✅ Mark all notifications as read for the logged-in user
 */
router.put("/read/all", authMiddleware, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { $set: { read: true } }
    );
    res.json({ success: true });
  } catch (err) {
    console.error("PUT /notifications/read/all error:", err);
    res.status(500).json({ error: "Failed to mark all as read" });
  }
});

/**
 * ✅ Mark all notifications as read when opening notifications page
 */
router.put("/mark-read", authMiddleware, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { $set: { read: true } }
    );
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;