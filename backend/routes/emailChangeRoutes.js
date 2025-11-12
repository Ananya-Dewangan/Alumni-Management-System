// backend/routes/emailChangeRoutes.js
import express from "express";
import EmailChangeRequest from "../models/EmailChangeRequest.js";
import User from "../models/User.js";
import { authMiddleware, adminAuthMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🔹 Create a new email change request (student/alumni)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "User not authenticated." });

    const { newEmail, reason } = req.body;
    if (!newEmail || !newEmail.trim()) {
      return res.status(400).json({ message: "New email is required." });
    }

    // Check for existing pending request
    const existing = await EmailChangeRequest.findOne({ userId, status: "pending" });
    if (existing) {
      return res.status(400).json({ message: "You already have a pending request." });
    }

    // Create new request
    const newReq = await EmailChangeRequest.create({
      userId,
      currentEmail: req.user.email,
      newEmail: newEmail.trim(),
      reason: reason?.trim() || "",
      status: "pending",
    });

    res.status(201).json(newReq);
  } catch (err) {
    console.error("❌ Error creating email change request:", err);
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// 🔹 Admin: List all email change requests
router.get("/", authMiddleware, adminAuthMiddleware, async (req, res) => {
  try {
    const requests = await EmailChangeRequest.find()
      .populate("userId", "username firstname lastname email role contact_no"); // ✅ matches schema
    res.json(requests);
  } catch (err) {
    console.error("❌ Error fetching email change requests:", err);
    res.status(500).json({ message: "Server error." });
  }
});

// 🔹 Admin: Approve or Deny request
router.put("/:id", authMiddleware, adminAuthMiddleware, async (req, res) => {
  try {
    const { action } = req.body;
    const reqId = req.params.id;

    if (!action || !["approve", "deny"].includes(action)) {
      return res.status(400).json({ message: "Invalid action." });
    }

    const request = await EmailChangeRequest.findById(reqId);
    if (!request) return res.status(404).json({ message: "Request not found." });

    if (request.status !== "pending") {
      return res.status(400).json({ message: "Request already processed." });
    }

    // 🔹 DENY
    if (action === "deny") {
      request.status = "denied";
      await request.save();
      return res.json({ message: "Email change denied.", request });
    }

    // 🔹 APPROVE
    if (action === "approve") {
      const user = await User.findById(request.userId);
      if (!user) return res.status(404).json({ message: "User not found." });

      const emailExists = await User.findOne({ email: request.newEmail });
      if (emailExists) return res.status(400).json({ message: "Email already in use." });

      user.email = request.newEmail;
      await user.save();

      request.status = "approved";
      await request.save();

      return res.json({ message: "Email change approved.", request });
    }
  } catch (err) {
    console.error("❌ Error approving/denying email request:", err);
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

export default router;