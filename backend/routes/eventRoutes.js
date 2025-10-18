// routes/eventRoutes.js
import express from "express";
import Event from "../models/Event.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import upload from "../middleware/multerMiddleware.js";

import uploadOnCloudinary from "../uploadconfig.js";
import fs from "fs"

const router = express.Router();

// Alumni creates an event
router.post("/", authMiddleware, upload.single("image"), async (req, res) => {
    try {
        if (req.user.role !== "alumni") {
            return res.status(403).json({ error: "Only alumni can create events" });
        }

        if (!req.file) {
            return res.status(400).json({ message: "Image is required" });
        }

        // Upload to Cloudinary
        const cloudRes = await uploadOnCloudinary(req.file.path);
        if (!cloudRes) return res.status(500).json({ error: "Cloudinary upload failed" });

        // Delete the local file after upload
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
        res.json(event);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all events
router.get("/", authMiddleware, async (req, res) => {
    const events = await Event.find()
        .populate("createdBy", "username role")
        .populate("participants", "username");
    res.json(events);
});

// Student participates
router.post("/:id/participate", authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== "student") {
            return res.status(403).json({ error: "Only students can participate" });
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

// Cancel participation
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

export default router;
