// backend/utils/receiptService.js
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { mkdirp } from "mkdirp";
import Donation from "../models/Donation.js";
import User from "../models/User.js";
import DonationRequest from "../models/DonationRequest.js";

// Directory for storing PDF receipts
const receiptsDir = path.join(process.cwd(), "uploads", "receipts");
mkdirp.sync(receiptsDir);

export async function generateReceiptPdf(donationId) {
  const donation = await Donation.findById(donationId)
    .populate("donorId")
    .populate("requestId");

  if (!donation) throw new Error("Donation not found");

  // Correct filename using template string
  const filename = `receipt_${donationId}.pdf`;
  const savePath = path.join(receiptsDir, filename);

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40 });
      const stream = fs.createWriteStream(savePath);

      doc.pipe(stream);

      // ==============================
      // HEADER
      // ==============================
      doc
        .fontSize(20)
        .text("College / Alumni Association", { align: "center" });

      doc.moveDown(0.5);

      doc
        .fontSize(16)
        .text("Donation Receipt", { align: "center" });

      doc.moveDown(1);

      // ==============================
      // BODY CONTENT
      // ==============================
      doc.fontSize(12);

      doc.text(
        `Donor: ${donation.donorId?.name || donation.donorId?.email || "Anonymous"}`
      );
      doc.text(`Campaign: ${donation.requestId?.title || "N/A"}`);
      doc.text(`Amount: ₹${donation.amount}`);
      doc.text(`Payment ID: ${donation.razorpayPaymentId}`);
      doc.text(`Order ID: ${donation.razorpayOrderId}`);
      doc.text(
        `Date: ${new Date(donation.createdAt).toLocaleString()}`
      );

      doc.moveDown(1.5);

      doc.text("Thank you for your generous contribution!", {
        underline: false,
      });

      doc.moveDown(2);

      // Signature placeholder
      doc.text("Authorized Signature:");
      doc.moveDown(3);

      doc.text(""); // empty space

      // End PDF
      doc.end();

      stream.on("finish", () => resolve(savePath));
      stream.on("error", (err) => reject(err));

    } catch (err) {
      reject(err);
    }
  });
}
