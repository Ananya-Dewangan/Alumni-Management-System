// backend/utils/notificationService.js
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

// ==========================
// 📧 Email Transporter Setup
// ==========================
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === "true", // true for port 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// ==========================
// 📱 Twilio SMS Setup (optional)
// ==========================
let twilioClient = null;

if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  const Twilio = (await import("twilio")).default;
  twilioClient = Twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
}

// ==========================
// 📧 Send Donation Email
// ==========================
export async function sendDonationEmail({
  to,
  name,
  amount,
  campaignTitle,
  paymentId,
  receiptPath
}) {
  const subject = `Thank you for your donation, ${name || ""}!`;

  const html = `
    <p>Dear ${name || "Donor"},</p>
    <p>Thank you for donating <b>₹${amount}</b> towards <b>${campaignTitle}</b>.</p>
    <p><b>Payment ID:</b> ${paymentId}</p>
    <p>Your receipt is attached (if available) or can be downloaded from your Donations page.</p>
    <p>Warm regards,<br/>Alumni Relations Team</p>
  `;

  // Attachment (if receipt exists)
  const attachments = receiptPath
    ? [{ filename: "receipt.pdf", path: receiptPath }]
    : [];

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
      attachments
    });
  } catch (err) {
    console.error("Email send failed:", err);
    // Don't throw — avoid blocking donation process
  }
}

// ==========================
// 📱 Send SMS Notification
// ==========================
export async function sendSms({ toNumber, message }) {
  if (!twilioClient) {
    console.warn("Twilio not configured — skipping SMS");
    return;
  }

  try {
    await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_MOBILE_FROM,
      to: toNumber
    });
  } catch (err) {
    console.error("SMS send failed:", err);
  }
}
