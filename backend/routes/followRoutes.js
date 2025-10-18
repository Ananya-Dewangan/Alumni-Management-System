// routes/follow.js
import express from "express";
import User from "../models/User.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get all following users
router.get("/following", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("following", "username email profilePic role");
    res.json(user.following);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

router.get("/followers", authMiddleware, async (req, res) => {
    try {
      const user = await User.findById(req.user.id).populate("followers", "username role profilePic");
      res.json(user.followers);
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  });
  

// Follow an alumni
router.post("/follow/:id", authMiddleware, async (req, res) => {
  try {
    const student = req.user;
    const alumniId = req.params.id;

    if (student.role !== "student") {
      return res.status(403).json({ msg: "Only students can follow alumni" });
    }

    const alumni = await User.findById(alumniId);
    if (!alumni || alumni.role !== "alumni") {
      return res.status(404).json({ msg: "Alumni not found" });
    }

    if (student.following.includes(alumniId)) {
      return res.status(400).json({ msg: "Already following this alumni" });
    }

    student.following.push(alumniId);
    alumni.followers.push(student._id);

    await student.save();
    await alumni.save();

    res.json({ msg: "Followed successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// Unfollow
router.post("/unfollow/:id", authMiddleware, async (req, res) => {
  try {
    const student = req.user;
    const alumniId = req.params.id;

    student.following = student.following.filter(
      (id) => id.toString() !== alumniId
    );

    await student.save();

    const alumni = await User.findById(alumniId);
    if (alumni) {
      alumni.followers = alumni.followers.filter(
        (id) => id.toString() !== student._id.toString()
      );
      await alumni.save();
    }

    res.json({ msg: "Unfollowed successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

export default router;
