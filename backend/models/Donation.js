// backend/models/Donation.js
import mongoose from "mongoose";

const donationSchema = new mongoose.Schema({
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  requestId: { type: mongoose.Schema.Types.ObjectId, ref: "DonationRequest", required: true },
  amount: { type: Number, required: true },
  razorpayPaymentId: { type: String },
  razorpayOrderId: { type: String },
  razorpaySignature: { type: String },
  receiptPath: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Donation", donationSchema);