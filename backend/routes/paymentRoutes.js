// backend/routes/paymentRoutes.js
import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import Donation from "../models/Donation.js";
import DonationRequest from "../models/DonationRequest.js";
import { generateReceiptPdf } from "../utils/receiptService.js";
import { sendDonationEmail, sendSms } from "../utils/notificationService.js";

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// auth middleware stubs - replace with your actual middleware
const isAuth = (req, res, next) => {
  if (req.user) return next();
  return res.status(401).json({ message: "Unauthorized" });
};

// ===============================
// 🔵 Create Razorpay Order
// ===============================
router.post("/order", isAuth, async (req, res) => {
  try {
    const { amount, requestId } = req.body;
    if (!amount || !requestId)
      return res.status(400).json({ message: "Missing params" });

    const options = {
      amount: Math.round(amount * 100), // ₹ to paise
      currency: "INR",
      receipt: `donation_rcpt_${Date.now()}`,
      payment_capture: 1
    };

    const order = await razorpay.orders.create(options);

    res.json({
      orderId: order.id,
      amount: options.amount,
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (err) {
    console.error("Razorpay order error:", err);
    res.status(500).json({ message: "Order creation failed" });
  }
});

// ===============================
// 🔵 Verify Razorpay Payment
// ===============================
router.post("/verify", isAuth, async (req, res) => {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      paymentId,
      orderId,
      signature,
      amount,
      requestId
    } = req.body;

    const r_payment_id = razorpay_payment_id || paymentId;
    const r_order_id = razorpay_order_id || orderId;
    const r_signature = razorpay_signature || signature;

    if (!r_payment_id || !r_order_id || !r_signature || !requestId || !amount) {
      return res.status(400).json({ message: "Missing verification fields" });
    }

    // Create signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${r_order_id}|${r_payment_id}`)
      .digest("hex");

    if (generatedSignature !== r_signature) {
      return res.status(400).json({ message: "Invalid signature" });
    }

    // Save donation record
    const donation = await Donation.create({
      donorId: req.user._id,
      requestId,
      amount,
      razorpayPaymentId: r_payment_id,
      razorpayOrderId: r_order_id,
      razorpaySignature: r_signature
    });

    // Increase collected amount
    await DonationRequest.findByIdAndUpdate(requestId, {
      $inc: { collectedAmount: amount }
    });

    // ===============================
    // Generate Receipt PDF
    // ===============================
    let receiptPath;
    try {
      receiptPath = await generateReceiptPdf(donation._id);
      donation.receiptPath = receiptPath;
      await donation.save();
    } catch (err) {
      console.error("Receipt generation error:", err);
    }

    // ===============================
    // Send Email Notification
    // ===============================
    const campaign = await DonationRequest.findById(requestId);

    sendDonationEmail({
      to: req.user.email,
      name: req.user.name,
      amount,
      campaignTitle: campaign.title,
      paymentId: r_payment_id,
      receiptPath
    }).catch((e) => console.error("Email error:", e));

    // ===============================
    // Send SMS Notification
    // ===============================
    if (req.user.phone) {
      const smsMsg = `Thank you ${req.user.name || ""} for donating ₹${amount} to ${campaign.title}. Payment ID: ${r_payment_id}`;
      sendSms({ toNumber: req.user.phone, message: smsMsg })
        .catch((e) => console.error("SMS error", e));
    }

    res.json({ success: true, donationId: donation._id });
  } catch (err) {
    console.error("Verify payment error:", err);
    res.status(500).json({ message: "Verification failed" });
  }
});

export default router;
