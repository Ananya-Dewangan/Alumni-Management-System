import express from "express";
import Notification from "../models/Notification.js";
import { authMiddleware } from "../middleware/authMiddleware.js";


const router = express.Router();

// Get current user's notifications
router.get("/", authMiddleware, async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id })
    .populate("sender", "username")
    .sort({ createdAt: -1 });
  res.json(notifications);
});

// GET /api/notifications/count
router.get("/count", authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const count = await Notification.countDocuments({ recipient: userId });
    
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch notification count" });
  }
});


// Mark as read
router.put("/:id/read", authMiddleware, async (req, res) => {
  await Notification.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});


// DELETE /api/notifications/sender/:senderId
router.delete("/sender/:senderId", authMiddleware, async (req, res) => {
  try {
    const { senderId } = req.params;
    const userId = req.user._id; // logged-in user

    await Notification.deleteMany({
      sender: senderId,
      recipient: userId,
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete notifications" });
  }
});

export default router;