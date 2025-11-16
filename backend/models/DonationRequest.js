// backend/models/DonationRequest.js
import mongoose from "mongoose";

const donationRequestSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: "" },
  targetAmount: { type: Number, required: true },
  collectedAmount: { type: Number, default: 0 },
  deadline: { type: Date, default: null },
  status: { type: String, enum: ["active", "closed"], default: "active" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
  images: [String]
}, { timestamps: true });

export default mongoose.model("DonationRequest", donationRequestSchema);