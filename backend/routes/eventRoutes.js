// routes/eventRoutes.js
import express from "express";
import Event from "../models/Event.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import upload from "../middleware/multerMiddleware.js";
import uploadOnCloudinary from "../uploadconfig.js";
import fs from "fs";
import User from "../models/User.js";
import { createNotification } from "../utils/createNotification.js";

const router = express.Router();

// 🎯 Alumni or Admin creates an event
router.post("/", authMiddleware, upload.single("image"), async (req, res) => {
  try {
    // Allow both alumni and admin
    if (req.user.role !== "alumni" && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ error: "Only alumni or admin can create events" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Image is required" });
    }

    // 📤 Upload to Cloudinary
    const cloudRes = await uploadOnCloudinary(req.file.path);
    if (!cloudRes)
      return res.status(500).json({ error: "Cloudinary upload failed" });

    // 🧹 Delete local file after upload
    fs.unlinkSync(req.file.path);

    const { title, description, date, seats } = req.body;

    const event = new Event({
      title,
      description,
      date,
      seats,
      image: cloudRes.secure_url,
      createdBy: req.user._id,
    });

    await event.save();

    // ✅ Create notifications for all users except the creator
    const allUsers = await User.find({ _id: { $ne: req.user._id } });

    const io = req.app.get("io");

    await Promise.all(
      allUsers.map((user) =>
        createNotification({
          recipient: user._id,
          sender: req.user._id,
          type: "event",
          eventId: event._id,
          text: `New event "${title}" has been created by ${req.user.username}`,
          io,
        })
      )
    );

    res.json(event);
  } catch (err) {
    console.error("Error creating event:", err);
    res.status(500).json({ error: err.message });
  }
});

// 🧾 Get all events
router.get("/", authMiddleware, async (req, res) => {
  try {
    const events = await Event.find()
      .populate("createdBy", "username role")
      .populate("participants", "username");
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🧍‍♀ Participate in event (student or alumni)
router.post("/:id/participate", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "student" && req.user.role !== "alumni") {
      return res
        .status(403)
        .json({ error: "Only students or alumni can participate" });
    }

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });

    if (event.participants.includes(req.user._id)) {
      return res.status(400).json({ error: "Already participating" });
    }

    if (event.participants.length >= event.seats) {
      return res.status(400).json({ error: "No seats available" });
    }

    event.participants.push(req.user._id);
    await event.save();

    res.json({ success: true, event });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ❌ Cancel participation
router.post("/:id/cancel", authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });

    event.participants = event.participants.filter(
      (id) => id.toString() !== req.user._id.toString()
    );
    await event.save();

    res.json({ success: true, event });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🗑 Delete an event (only admin or creator)
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    if (
      req.user.role !== "admin" &&
      event.createdBy.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ error: "You are not authorized to delete this event" });
    }

    await event.deleteOne();
    res.json({ message: "Event deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 👥 Get participants (only creator or admin)
router.get("/:id/participants", authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate(
      "participants",
      "username email role"
    );

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    if (
      req.user.role !== "admin" &&
      event.createdBy.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ error: "You are not authorized to view participants" });
    }

    res.json(event.participants);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
