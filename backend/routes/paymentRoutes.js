// backend/routes/paymentRoutes.js
import express from "express";
import Donation from "../models/Donation.js";
import DonationRequest from "../models/DonationRequest.js";
import { generateReceiptPdf } from "../utils/receiptService.js";
import { sendDonationEmail, sendSms } from "../utils/notificationService.js";
import { createMockOrder, createMockPayment } from "../utils/mockPhonepe.js";
import { authMiddleware } from "../middleware/authMiddleware.js"; // adjust path if different

const router = express.Router();

/**
 * POST /api/donation/payment/order
 * Body: { amount, requestId }
 * Response: { orderId, amount, currency, keyId }  (keyId retained for parity)
 */
router.post("/order", authMiddleware, async (req, res) => {
  try {
    const { amount, requestId } = req.body;
    if (!amount || !requestId) return res.status(400).json({ success: false, message: "Missing params" });

    const campaign = await DonationRequest.findById(requestId).lean();
    if (!campaign) return res.status(404).json({ success: false, message: "Campaign not found" });

    // Create readable fake order (frontend uses orderId)
    const order = createMockOrder(Number(amount));
    return res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.MOCK_KEY_ID || "MOCK_KEY"
    });
  } catch (err) {
    console.error("Mock order error:", err);
    res.status(500).json({ success: false, message: "Order creation failed" });
  }
});

/**
 * POST /api/donation/payment/verify
 * Body: {
 *   orderId (or razorpay_order_id),
 *   paymentId (or razorpay_payment_id) — optional (modal may not supply),
 *   signature (or razorpay_signature) — optional,
 *   requestId,
 *   amount
 * }
 *
 * Behavior:
 *  - if paymentId/signature not provided, generate mock ones server-side
 *  - create Donation record
 *  - update DonationRequest.collectedAmount
 *  - generate PDF receipt, send email & SMS
 */
router.post("/verify", authMiddleware, async (req, res) => {
  try {
    const {
      orderId,
      paymentId,
      signature,
      requestId,
      amount,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    const r_order = orderId || razorpay_order_id;
    let r_payment = paymentId || razorpay_payment_id;
    let r_signature = signature || razorpay_signature;

    if (!r_order || !requestId || !amount) {
      return res.status(400).json({ success: false, message: "Missing verification fields" });
    }

    // If frontend didn't send paymentId/signature (likely because it's mock), create them
    let mockPayment;
    if (!r_payment || !r_signature) {
      mockPayment = createMockPayment(r_order);
      r_payment = mockPayment.paymentId;
      r_signature = mockPayment.signature;
    } else {
      // If provided, we could validate format — but accept for mock
      mockPayment = { paymentId: r_payment, orderId: r_order, signature: r_signature, status: "SUCCESS" };
    }

    // Save donation using your existing schema fields (map fake ids to razorpay fields)
    const donation = await Donation.create({
      donorId: req.user._id,
      requestId,
      amount: Number(amount),
      razorpayPaymentId: r_payment,
      razorpayOrderId: r_order,
      razorpaySignature: r_signature
    });

    // Update collectedAmount
    await DonationRequest.findByIdAndUpdate(requestId, {
      $inc: { collectedAmount: Number(amount) }
    });

    // Generate receipt PDF (attempt; if fails, continue)
    let receiptPath = null;
    try {
      receiptPath = await generateReceiptPdf(donation._id);
      donation.receiptPath = receiptPath;
      await donation.save();
    } catch (pdfErr) {
      console.error("Receipt generation failed:", pdfErr);
    }

    // Send email (async)
    try {
      const campaign = await DonationRequest.findById(requestId).lean();
      sendDonationEmail({
        to: req.user.email,
        name: req.user.name,
        amount,
        campaignTitle: campaign?.title || "Donation",
        paymentId: r_payment,
        receiptPath
      }).catch(e => console.error("sendDonationEmail error:", e));
    } catch (e) {
      console.error("Email flow top-level error:", e);
    }

    // Send SMS if user phone present
    if (req.user.phone) {
      try {
        const campaign = await DonationRequest.findById(requestId).lean();
        const smsMsg = `Thank you ${req.user.name} for donating ₹${amount} to ${campaign?.title || "Donation"}. Payment ID: ${r_payment}`;
        sendSms({ toNumber: req.user.phone, message: smsMsg }).catch(e => console.error("sendSms error", e));
      } catch (e) {
        console.error("SMS flow top-level error:", e);
      }
    }

    // Return success (mimic real gateway response)
    return res.json({
      success: true,
      donationId: donation._id,
      payment: {
        id: r_payment,
        orderId: r_order,
        signature: r_signature,
        status: mockPayment?.status || "SUCCESS"
      }
    });
  } catch (err) {
    console.error("Mock verify error:", err);
    return res.status(500).json({ success: false, message: "Verification failed" });
  }
});

export default router;