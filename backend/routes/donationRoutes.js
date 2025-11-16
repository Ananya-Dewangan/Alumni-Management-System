import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import Razorpay from "razorpay";
import crypto from "crypto";
import DonationRequest from "../models/DonationRequest.js";
import {
  authMiddleware as verifyToken,
  adminAuthMiddleware as verifyAdmin,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// ====================
// 📸 Multer setup for image uploads
// ====================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// ====================
// 🟢 Create new donation request (Admin Only)
// ====================
router.post(
  "/request",
  verifyToken,
  verifyAdmin,
  upload.array("images", 5),
  async (req, res) => {
    try {
      const { title, description, targetAmount, deadline } = req.body;

      const imagePaths = req.files.map((file) => `/uploads/${file.filename}`);

      const newRequest = new DonationRequest({
        title,
        description,
        targetAmount,
        deadline,
        images: imagePaths,
        status: "active",
        collectedAmount: 0,
      });

      await newRequest.save();
      res.status(201).json({
        message: "Donation request created successfully",
        request: newRequest,
      });
    } catch (error) {
      console.error("Error creating donation request:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// ====================
// 🟣 Get all donation requests
// ====================
router.get("/requests", verifyToken, async (req, res) => {
  try {
    let requests;
    if (req.user.role === "admin") {
      requests = await DonationRequest.find().sort({ createdAt: -1 });
    } else {
      requests = await DonationRequest.find({ status: "active" }).sort({
        createdAt: -1,
      });
    }

    res.json({ requests });
  } catch (error) {
    console.error("Error fetching donation requests:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ====================
// 🔴 Close donation request (Admin Only)
// ====================
router.patch("/request/:id/close", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const request = await DonationRequest.findById(req.params.id);
    if (!request)
      return res.status(404).json({ message: "Donation request not found" });

    request.status = "closed";
    await request.save();

    res.json({ message: "Donation request closed successfully" });
  } catch (error) {
    console.error("Error closing donation request:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ====================
// 🗑 Delete donation request (Admin Only)
// ====================
router.delete("/request/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const request = await DonationRequest.findById(req.params.id);
    if (!request)
      return res.status(404).json({ message: "Donation request not found" });

    // remove uploaded images
    if (request.images && request.images.length > 0) {
      request.images.forEach((imgPath) => {
        const localPath = imgPath.replace("/uploads/", "");
        const fullPath = path.join(process.cwd(), "uploads", localPath);

        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      });
    }

    await request.deleteOne();
    res.json({ message: "Donation request deleted successfully" });
  } catch (error) {
    console.error("Error deleting donation request:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ====================
// 💳 Razorpay Integration
// ====================
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// 🟢 Create Order
router.post("/payment/order", verifyToken, async (req, res) => {
  try {
    const { amount, requestId } = req.body;
    if (!amount || !requestId)
      return res.status(400).json({ message: "Missing amount or requestId" });

    const options = {
      amount: Number(amount) * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    res.json({
      keyId: process.env.RAZORPAY_KEY_ID,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({ message: "Payment order creation failed" });
  }
});

// 🟣 Verify Payment
router.post("/payment/verify", verifyToken, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      requestId,
      amount,
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature)
      return res.status(400).json({ message: "Invalid signature" });

    // Update collected amount
    const request = await DonationRequest.findById(requestId);
    if (request) {
      request.collectedAmount += Number(amount);
      await request.save();
    }

    res.json({ message: "Payment verified successfully" });
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ message: "Payment verification failed" });
  }
});

export default router;
