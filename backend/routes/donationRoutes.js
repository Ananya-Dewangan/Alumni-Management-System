// backend/routes/donationRoutes.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import DonationRequest from "../models/DonationRequest.js";
import {
  authMiddleware as verifyToken,
  adminAuthMiddleware as verifyAdmin,
} from "../middleware/authMiddleware.js";
import Donation from "../models/Donation.js";
import { generateReceiptPdf } from "../utils/receiptService.js";
import { sendDonationEmail, sendSms } from "../utils/notificationService.js";

import {
  createMockOrder,
  createMockPayment,
  verifyMockPayment,
} from "../utils/mockPhonepe.js";

const router = express.Router();

/* -------------------------------------------------------
   📸 Multer setup 
------------------------------------------------------- */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${unique}-${file.originalname}`);
  },
});
const upload = multer({ storage });

/* -------------------------------------------------------
   🟢 Create Donation Request (Admin)
------------------------------------------------------- */
router.post(
  "/request",
  verifyToken,
  verifyAdmin,
  upload.array("images", 5),
  async (req, res) => {
    try {
      const { title, description, targetAmount, deadline } = req.body;
      const imagePaths = req.files.map((f) => `/uploads/${f.filename}`);
      
      const newReq = new DonationRequest({
        title,
        description,
        targetAmount,
        deadline,
        images: imagePaths,
        collectedAmount: 0,
        status: "active",
      });

      await newReq.save();
      res.status(201).json({
        message: "Donation request created successfully",
        request: newReq,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/* -------------------------------------------------------
   🟣 Get All Donation Requests
------------------------------------------------------- */
router.get("/requests", verifyToken, async (req, res) => {
  try {
    let results;
    if (req.user.role === "admin") {
      results = await DonationRequest.find().sort({ createdAt: -1 });
    } else {
      results = await DonationRequest.find({ status: "active" }).sort({ createdAt: -1 });
    }

    res.json({ requests: results });
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* -------------------------------------------------------
   🔴 Close Donation Request (Admin)
------------------------------------------------------- */
router.patch("/request/:id/close", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const reqDoc = await DonationRequest.findById(req.params.id);
    if (!reqDoc) return res.status(404).json({ message: "Not found" });

    reqDoc.status = "closed";
    await reqDoc.save();
    res.json({ message: "Closed successfully" });
  } catch (err) {
    console.error("Close error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* -------------------------------------------------------
   🗑 Delete Donation Request
------------------------------------------------------- */
router.delete("/request/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const doc = await DonationRequest.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Not found" });

    // delete images
    doc.images?.forEach((img) => {
      const full = path.join(process.cwd(), img.replace("/uploads", "uploads"));
      if (fs.existsSync(full)) fs.unlinkSync(full);
    });

    await doc.deleteOne();
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* -------------------------------------------------------
   💳 CREATE MOCK ORDER (moved from paymentRoutes)
------------------------------------------------------- */
router.post("/payment/order", verifyToken, async (req, res) => {
  try {
    const { amount, requestId } = req.body;
    if (!amount || !requestId) {
      return res.status(400).json({ success: false, message: "Missing params" });
    }

    const campaign = await DonationRequest.findById(requestId).lean();
    if (!campaign) {
      return res.status(404).json({ success: false, message: "Campaign not found" });
    }

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


/* ------------------------------------------------------------------
   💳 MOCK PAYMENT VERIFY + CREATE DONATION + RECEIPT + EMAIL + SMS
--------------------------------------------------------------------- */
router.post("/payment/verify", verifyToken, async (req, res) => {
  try {
    const { orderId, requestId, amount, paymentId, signature } = req.body;
        console.log("VERIFY BODY:", req.body);
    console.log("TYPES:", {
      orderId: typeof orderId,
      requestId: typeof requestId,
      amount: typeof amount,
    });

    if (!orderId || !requestId || !amount) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    // Step 1: Verify using Mock Logic
    const mockResult = verifyMockPayment(orderId);
    if (!mockResult.success) {
      return res.status(400).json({ success: false, message: "Mock verification failed" });
    }

    // Step 2: Save donation entry
    const donation = new Donation({
      donorId: req.user._id,
      requestId,
      amount,
      razorpayPaymentId: paymentId || mockResult.paymentId,
      razorpayOrderId: orderId,
      razorpaySignature: signature || mockResult.signature,
    });

    await donation.save();

    // Step 3: Generate Receipt PDF (with error handling)
    let receiptPath = null;
    try {
      receiptPath = await generateReceiptPdf(donation._id);
      donation.receiptPath = receiptPath;
      await donation.save();
      console.log("✅ Receipt generated:", receiptPath);
    } catch (pdfErr) {
      console.error("❌ Receipt generation failed:", pdfErr.message);
      // Continue without receipt - don't block donation
    }

    // Step 4: Increase collectedAmount in campaign
    await DonationRequest.findByIdAndUpdate(requestId, {
      $inc: { collectedAmount: Number(amount) },
    });

    // Step 5: Send Email
    const campaign = await DonationRequest.findById(requestId).lean();
    await sendDonationEmail({
      to: req.user.email,
      name: `${req.user.firstname || ""} ${req.user.lastname || ""}`.trim() || req.user.name || "Donor",
      amount,
      campaignTitle: campaign?.title || "Donation Campaign",
      paymentId: donation.razorpayPaymentId,
      receiptPath,
    });

    // Step 6: Send SMS (optional)
    if (req.user.contact_no) {
      try {
        const campaign = await DonationRequest.findById(requestId).lean();
        const cleanPaymentId = donation.razorpayPaymentId.replace(/^MOCK_(PAY|PAYMENT)_?/i, '');
        const smsMsg = `✅ Thank you ${req.user.firstname || req.user.name}! ₹${amount} donated to ${campaign?.title || "Donation"}. Ref: ${cleanPaymentId}`;
        
        await sendSms({ 
          toNumber: req.user.contact_no, 
          message: smsMsg,
          paymentId: donation.razorpayPaymentId  // Pass full ID for cleaning
        });
        console.log("✅ SMS sent successfully");
      } catch (smsErr) {
        console.error("❌ SMS failed:", smsErr.message);
        // Don't block response
      }
    }


    // Step 7: Respond to frontend
    return res.json({
      success: true,
      message: "Payment verified (MOCK), Donation saved, Email & Receipt sent",
    });

  } catch (err) {
    console.error("Mock verify error:", err);
    return res.status(500).json({
      success: false,
      message: "Payment verification failed",
      error: err.message,
    });
  }
});

//------------------------------------------------------------
// 🟢 Get My Donations (logged-in user)
//------------------------------------------------------------

router.get("/my", verifyToken, async (req, res) => {
  try {
    const donations = await Donation.find({ donorId: req.user._id })
      .populate("requestId")   // so we get campaign title
      .sort({ createdAt: -1 });

    res.json({ donations });
  } catch (err) {
    console.error("My donations error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* -------------------------------------------------------
   📄 DOWNLOAD RECEIPT PDF
------------------------------------------------------- */
router.get("/receipt/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const donation = await Donation.findOne({ 
      _id: id, 
      donorId: req.user._id 
    }).populate("requestId");
    
    if (!donation) {
      return res.status(404).json({ 
        success: false, 
        message: "Receipt not found or access denied" 
      });
    }

    // Show helpful message instead of "not generated yet"
    if (!donation.receiptPath) {
      return res.status(200).json({ 
        success: false, 
        message: "Receipt generation failed. Please contact support or try donating again.",
        donationId: id
      });
    }

    const receiptPath = path.join(process.cwd(), "uploads", "receipts", path.basename(donation.receiptPath));
    const isViewMode = req.query.view === 'true';
    
    if (fs.existsSync(receiptPath)) {
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': isViewMode ? 'inline' : 'attachment; filename="receipt.pdf"',
        'Content-Length': fs.statSync(receiptPath).size
      });
    } else {
      res.status(404).json({ 
        success: false, 
        message: "Receipt file missing on server" 
      });
      fs.createReadStream(receiptPath).pipe(res);
    }
  } catch (err) {
    console.error("Receipt route error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* -------------------------------------------------------
  ADMIN: Get ALL donations for a specific campaign
------------------------------------------------------- */
router.get("/admin/:requestId/donations", verifyAdmin, async (req, res) => {
  try {
    const { requestId } = req.params;
    
    const donations = await Donation.find({ requestId })
      .populate("donorId", "firstname lastname email phone username name")
      .populate("requestId", "title")
      .sort({ createdAt: -1 })
      .lean();
    
    res.json({ 
      donations,
      total: donations.length,
      totalAmount: donations.reduce((sum, d) => sum + Number(d.amount), 0)
    });
  } catch (err) {
    console.error("Admin donations error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* -------------------------------------------------------
   👑 ADMIN: Download ANY donor's receipt (admin override)
------------------------------------------------------- */
router.get("/admin/receipt/:donationId", verifyAdmin, async (req, res) => {
  try {
    const { donationId } = req.params;
    
    // Find donation (admin can see any)
    const donation = await Donation.findById(donationId)
      .populate("requestId", "title")
      .populate("donorId", "firstname lastname email")
      .lean();
    
    if (!donation) {
      return res.status(404).json({ 
        success: false, 
        message: "Donation not found" 
      });
    }

    if (!donation.receiptPath) {
      return res.status(404).json({ 
        success: false, 
        message: "No receipt generated for this donation" 
      });
    }

    // Serve the EXACT SAME receipt file donor gets
    const receiptPath = path.join(process.cwd(), "uploads", "receipts", path.basename(donation.receiptPath));
    
    if (fs.existsSync(receiptPath)) {
      res.download(receiptPath, `admin-receipt-${donationId}.pdf`, (err) => {
        if (err) {
          console.error("Admin receipt download error:", err);
          if (!res.headersSent) {
            res.status(500).json({ success: false, message: "Download failed" });
          }
        }
      });
    } else {
      res.status(404).json({ 
        success: false, 
        message: "Receipt file missing on server" 
      });
    }
  } catch (err) {
    console.error("Admin receipt route error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* -------------------------------------------------------
   👁️ ADMIN: VIEW receipt in browser (INLINE)
------------------------------------------------------- */
router.get("/admin/receipt/:donationId/view", verifyAdmin, async (req, res) => {
  try {
    const { donationId } = req.params;
    const donation = await Donation.findById(donationId).lean();
    
    if (!donation || !donation.receiptPath) {
      return res.status(404).json({ success: false, message: "Receipt not found" });
    }

    const receiptPath = path.join(process.cwd(), "uploads", "receipts", path.basename(donation.receiptPath));
    
    if (fs.existsSync(receiptPath)) {
      // INLINE = View in browser
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline',
        'Content-Length': fs.statSync(receiptPath).size
      });
      fs.createReadStream(receiptPath).pipe(res);
    } else {
      res.status(404).json({ success: false, message: "File missing" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;