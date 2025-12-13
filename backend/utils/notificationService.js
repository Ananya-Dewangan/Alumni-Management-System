// backend/utils/notificationService.js
import nodemailer from "nodemailer";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

// Build nodemailer transporter only if SMTP_USER is provided.
// This allows the code to safely continue when email config is missing.
let transporter = null;
if (process.env.SMTP_USER) {
  try {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true", // true for port 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // verify transporter once (non-blocking)
    transporter.verify().catch((err) => {
      // Log but keep transporter (attempt may still work)
      console.warn("SMTP verification failed:", err && err.message ? err.message : err);
    });
  } catch (err) {
    console.error("Failed to create email transporter:", err);
    transporter = null;
  }
} else {
  console.warn("No SMTP_USER configured — email notifications disabled");
}

// Lazily init Twilio client only if env present
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  try {
    // dynamic import so module load won't break if not installed
    const Twilio = await import("twilio").then((m) => m.default || m);
    twilioClient = Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  } catch (err) {
    console.warn("Twilio import failed — SMS disabled:", err?.message || err);
    twilioClient = null;
  }
}

/**
 * Send donation email with optional receipt attachment.
 * - accepts: { to, name, amount, campaignTitle, paymentId, receiptPath }
 * - returns { success: boolean, error?: string }
 */
export async function sendDonationEmail({ to, name, amount, campaignTitle, paymentId, receiptPath }) {
  if (!transporter) {
    console.warn("Email transporter not configured; skipping sendDonationEmail");
    return { success: false, error: "Email transporter not configured" };
  }

  if (!to) {
    console.warn("No recipient provided to sendDonationEmail");
    return { success: false, error: "Missing recipient" };
  }

  const cleanPaymentId = paymentId.replace(/^MOCK_(PAY|PAYMENT)_?/i, '');
  const subject = `✅ Donation Successful - Thank you for supporting ${campaignTitle}!`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; }
        .logo { font-size: 32px; font-weight: bold; margin-bottom: 5px; }
        .tagline { font-size: 16px; opacity: 0.9; }
        .content { padding: 30px 25px; background: #f8fafc; }
        .success-box { background: #dcfce7; border: 2px solid #10b981; border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center; }
        .amount-highlight { font-size: 36px; font-weight: bold; color: #10b981; margin: 10px 0; }
        .details-table { width: 100%; background: white; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); margin: 25px 0; }
        .details-table td { padding: 15px; border-bottom: 1px solid #e2e8f0; }
        .details-table td:first-child { background: #f1f5f9; font-weight: 600; color: #1e40af; width: 35%; }
        .footer { background: #1f2937; color: white; padding: 25px; text-align: center; font-size: 14px; }
        .btn { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 15px 0; }
        .campaign-highlight { background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0; }
      </style>
    </head>
    <body>
    <div class="header" style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center;">
      <img src="cid:campussetu-logo" alt="CampusSetu Logo" style="height: 60px; margin-bottom: 10px; border-radius: 8px;" />
      <div style="font-size: 18px;">Alumni Association</div>
    </div>

      <div class="content">
        <h2 style="color: #1e40af; margin-bottom: 20px;">🎉 Donation Successful!</h2>
        
        <div class="success-box">
          <div class="amount-highlight">₹${amount}</div>
          <p style="margin: 10px 0 0 0; font-size: 18px; color: #059669; font-weight: 600;">
            Thank you for supporting <strong>${campaignTitle}</strong>!
          </p>
        </div>

        <div class="campaign-highlight">
          <strong>🌟 Campaign:</strong> ${campaignTitle}<br>
          <em>Your contribution brings us closer to our goal!</em>
        </div>

        <table class="details-table">
          <tr>
            <td>Payment ID</td>
            <td>${cleanPaymentId}</td>
          </tr>
          <tr>
            <td>Transaction Date</td>
            <td>${new Date().toLocaleString('en-IN')}</td>
          </tr>
          <tr>
            <td>Donor</td>
            <td>${name}</td>
          </tr>
        </table>

        ${receiptPath && fs.existsSync(receiptPath) ? `
          <p style="text-align: center; margin: 30px 0;">
            <a href="#" class="btn">📄 Download Receipt</a>
          </p>
        ` : ''}

        <div style="background: #f8fafc; padding: 20px; border-radius: 10px; border-left: 4px solid #3b82f6; margin: 25px 0;">
          <p><strong>Next Steps:</strong></p>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>Track your donation on <strong>Donations</strong> page</li>
            <li>Share with friends to support this cause</li>
            <li>Follow campaign progress in your dashboard</li>
          </ul>
        </div>

        <p style="text-align: center; color: #64748b; font-style: italic; margin-top: 30px;">
          Together, we're building a stronger alumni community! 🙏
        </p>
      </div>

      <div class="footer">
        <p>CampusSetu Alumni Association | <strong>Secure Digital Receipt</strong></p>
        <p style="margin-top: 5px; opacity: 0.8; font-size: 12px;">
          This is an authorized electronic receipt • No signature required
        </p>
        <p style="margin-top: 10px; font-size: 12px;">
          Need help? <a href="#" style="color: #60a5fa;">Contact Support</a>
        </p>
      </div>
    </body>
    </html>
  `;

  const attachments = [];

  // 1. Always embed logo
  const logoPath = path.join(process.cwd(), "uploads", "campussetu-logo.png");
  if (fs.existsSync(logoPath)) {
    attachments.push({
      filename: 'campussetu-logo.png',
      path: logoPath,
      cid: 'campussetu-logo'  // Matches src="cid:campussetu-logo"
    });
  }

  // 2. Add receipt if exists
  if (receiptPath && fs.existsSync(receiptPath)) {
    attachments.push({
      filename: `CampusSetu-Donation-Receipt.pdf`,
      path: receiptPath,
      contentType: 'application/pdf'
    });
  } 

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || `"CampusSetu Alumni" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      attachments,
    });

    return { success: true };
  } catch (err) {
    console.error("sendDonationEmail failed:", err);
    return { success: false, error: (err && err.message) || "send failed" };
  }
}


/**
 * Send SMS notification using Twilio (if configured).
 * - args: { toNumber, message }
 * - returns { success: boolean, error?: string }
 */
export async function sendSms({ toNumber, message, paymentId }) {  // Add paymentId param
  if (!twilioClient) {
    console.warn("Twilio not configured - skipping SMS");
    return { success: false, error: "Twilio not configured" };
  }
  if (!toNumber) {
    console.warn("No recipient phone number provided for sendSms");
    return { success: false, error: "Missing toNumber" };
  }

  // Clean payment ID if provided
  const cleanPaymentId = paymentId ? paymentId.replace(/^MOCK_(PAY|PAYMENT)_?/i, '') : '';
  const smsMessage = cleanPaymentId 
    ? `${message} | Ref: ${cleanPaymentId}`
    : message;

  try {
    await twilioClient.messages.create({
      body: smsMessage.slice(0, 160), // SMS length limit
      from: process.env.TWILIO_MOBILE_FROM,
      to: toNumber,
    });
    return { success: true };
  } catch (err) {
    console.error("sendSms failed:", err);
    return { success: false, error: (err && err.message) || "sms failed" };
  }
}