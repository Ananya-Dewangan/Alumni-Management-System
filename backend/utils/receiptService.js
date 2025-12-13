// Replace the ENTIRE receiptService.js with this:

import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { mkdirp } from "mkdirp";
import Donation from "../models/Donation.js";
import DonationRequest from "../models/DonationRequest.js";
import User from "../models/User.js";

const receiptsDir = path.join(process.cwd(), "uploads", "receipts");
mkdirp.sync(receiptsDir);

export async function generateReceiptPdf(donationId) {
  if (!donationId) throw new Error("donationId is required");

  // load donation with populated references
  const donation = await Donation.findById(donationId)
    .populate("donorId")
    .populate("requestId")
    .lean();

  if (!donation) throw new Error("Donation not found");

  // resolve donor display name
  const donor = donation.donorId || {};
  const donorName =
    (donor.firstname || "").trim() || (donor.lastname || "").trim()
      ? `${(donor.firstname || "").trim()} ${(donor.lastname || "").trim()}`.trim()
      : donor.email || donor.username || "Anonymous";

  // resolve campaign title
  const campaignTitle = donation.requestId?.title || "Donation";

  // Accept a variety of payment/order field names
  const paymentId = donation.paymentId || donation.razorpayPaymentId || donation.payment?.id || donation.txnId || "N/A";
  const orderId = donation.orderId || donation.razorpayOrderId || donation.payment?.orderId || donation.order || "N/A";

  // Clean IDs (remove MOCK_ prefix)
  const cleanPaymentId = paymentId.replace(/^MOCK_(PAY|PAYMENT)_?/i, '');
  const cleanOrderId = orderId.replace(/^MOCK_(ORDER)_?/i, '');

  // Safe receipt ID (fallback if donationId not string)
  const receiptId = typeof donationId === 'string' ? donationId.slice(-8).toUpperCase() : donationId.toString().slice(-8).toUpperCase();

  // filename
  const filename = `receipt_${donationId}.pdf`;
  const savePath = path.join(receiptsDir, filename);

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 0, size: 'A4' });
      const stream = fs.createWriteStream(savePath);
      doc.pipe(stream);

      // ========== HEADER SECTION ==========
      const pageWidth = 595; // A4 width in points
      
      // Top colored header
      doc.rect(0, 0, pageWidth, 100).fill("#1e40af");
      
      // CampusSetu Logo (backend copy - create this manually)
      const logoPath = path.join(process.cwd(), "uploads", "campussetu-logo.png");
      try {
        if (fs.existsSync(logoPath)) {
          doc.image(logoPath, 40, 15, { width: 70, height: 70 });
        }
      } catch (err) {
        console.warn("Logo not found, using text only:", err.message);
      }
      
      // Organization name (shifted right for logo space)
      doc.fontSize(28)
        .font("Helvetica-Bold")
        .fillColor("white")
        .text("CampusSetu", 120, 25);
      
      doc.fontSize(14)
        .font("Helvetica")
        .fillColor("white")
        .text("Alumni Association", 120, 55);

      // Receipt label on right
      doc.fontSize(16)
        .font("Helvetica-Bold")
        .fillColor("white")
        .text("DONATION RECEIPT", 300, 35, { align: "right", width: 255 });

      doc.fontSize(10)
        .font("Helvetica")
        .fillColor("white")
        .text(`Receipt #: ${receiptId}`, 300, 60, { align: "right", width: 255 });

      // ========== MAIN CONTENT SECTION ==========
      doc.fillColor("black");
      
      // Donor details
      doc.fontSize(11)
        .font("Helvetica-Bold")
        .text("DONOR DETAILS", 40, 130);
      
      doc.fontSize(10).font("Helvetica").text(`Name: ${donorName}`, 40, 150);
      doc.text(`Email: ${donor.email || "N/A"}`, 40, 165);

      // Donation details
      doc.fontSize(11)
        .font("Helvetica-Bold")
        .text("DONATION DETAILS", 40, 195);
      doc.fontSize(10).font("Helvetica-Bold").text(campaignTitle, 40, 215, { width: 515 });

      // Payment box
      const boxY = 245;
      doc.rect(40, boxY, 515, 110).stroke("#e5e7eb");
      doc.fontSize(11).font("Helvetica-Bold").fillColor("#1e40af").text("PAYMENT INFORMATION", 50, boxY + 10);

      // Amount (big green)
      doc.fontSize(9).fillColor("black").text("Amount", 50, boxY + 35);
      doc.fontSize(20).font("Helvetica-Bold").fillColor("#10b981").text(`${donation.amount} Rs`, 50, boxY + 45);

      // Payment details
      doc.fontSize(9).fillColor("black").text("Payment ID:", 280, boxY + 35);
      doc.fontSize(10).font("Helvetica-Bold").text(cleanPaymentId, 280, boxY + 45);
      
      doc.fontSize(9).fillColor("black").text("Order ID:", 280, boxY + 70);
      doc.fontSize(10).font("Helvetica-Bold").text(cleanOrderId, 280, boxY + 80);
      
      doc.fontSize(9).fillColor("black").text("Date:", 50, boxY + 70);
      doc.fontSize(10).font("Helvetica-Bold").text(new Date(donation.createdAt).toLocaleString('en-IN'), 50, boxY + 80);

      // Thank you
      doc.fillColor("#1e40af").fontSize(12).font("Helvetica-Bold")
        .text("Thank you for your generous contribution!", 40, 370, { align: "center", width: 515 });
      
      doc.fillColor("#666").fontSize(9).font("Helvetica")
        .text("Your support makes a real difference in our community.", 40, 395, { align: "center", width: 515 });

      // Footer
      doc.moveTo(40, 720).lineTo(555, 720).stroke("#e5e7eb");
      doc.fillColor("#666").fontSize(9).font("Helvetica")
        .text("CampusSetu Alumni Association | Authorized Digital Receipt", 40, 735, { align: "center", width: 515 });
      doc.fillColor("#999").fontSize(8)
        .text("Electronically generated - no signature required", 40, 750, { align: "center", width: 515 });

      doc.end();

      stream.on("finish", () => resolve(savePath));
      stream.on("error", (err) => reject(err));
    } catch (err) {
      console.error("generateReceiptPdf error:", err);
      reject(err);
    }
  });
}