const nodemailer = require('nodemailer');
const config = require('../config');
const qrService = require('./qrService');

/**
 * Transactional Email Dispatch Engine
 * Supports real SMTP providers (Resend, Brevo, SendGrid, Gmail, AWS SES)
 * and automatic Ethereal test inbox fallback with live web preview links.
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
    this.providerName = 'uninitialized';
  }

  async initTransporter() {
    if (this.initialized) return;

    const { email } = config;

    // Check if real SMTP credentials are provided
    if (email.host && email.user && email.pass) {
      try {
        this.transporter = nodemailer.createTransport({
          host: email.host,
          port: email.port,
          secure: email.secure,
          auth: {
            user: email.user,
            pass: email.pass
          }
        });

        // Verify SMTP connection
        await this.transporter.verify();
        this.providerName = `SMTP (${email.host})`;
        this.initialized = true;
        console.log(`✉️ Email Service connected to real SMTP provider: ${email.host}`);
        return;
      } catch (err) {
        console.warn(`⚠️ Real SMTP connection failed (${err.message}). Falling back to Ethereal sandbox.`);
      }
    }

    // Default to Ethereal sandbox for instant testing without manual setup
    try {
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      this.providerName = 'Ethereal Test Mailer (Auto-Sandbox)';
      this.initialized = true;
      console.log(`✉️ Email Service initialized with Ethereal Sandbox (${testAccount.user})`);
    } catch (err) {
      console.error('❌ Failed to initialize Ethereal mailer:', err.message);
      // Fallback null transporter that simulates email sending
      this.providerName = 'Console Logger';
      this.initialized = true;
    }
  }

  /**
   * Generates a modern HTML email template with embedded QR code
   */
  generateEmailHtml({ event, ticket, qrDataUrl }) {
    const formattedDate = new Date(event.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Event Ticket - ${event.title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0b0f19;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #0b0f19;
      padding: 30px 15px;
      box-sizing: border-box;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background: #111827;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid #1f2937;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
    }
    .header-banner {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #db2777 100%);
      padding: 30px 25px;
      text-align: center;
      color: #ffffff;
    }
    .badge {
      display: inline-block;
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(8px);
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 12px;
    }
    .event-title {
      font-size: 24px;
      font-weight: 800;
      line-height: 1.25;
      margin: 0 0 8px 0;
    }
    .event-tagline {
      font-size: 13px;
      opacity: 0.9;
      margin: 0;
    }
    .content {
      padding: 30px 25px;
    }
    .greeting {
      font-size: 16px;
      margin-bottom: 20px;
      color: #94a3b8;
    }
    .greeting strong {
      color: #f8fafc;
    }
    .meta-card {
      background: #1a2234;
      border-radius: 12px;
      padding: 16px 20px;
      margin-bottom: 25px;
      border: 1px solid #2d3748;
    }
    .meta-row {
      display: flex;
      margin-bottom: 10px;
      font-size: 13px;
    }
    .meta-row:last-child {
      margin-bottom: 0;
    }
    .meta-label {
      color: #64748b;
      width: 90px;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.5px;
    }
    .meta-value {
      color: #f1f5f9;
      font-weight: 500;
    }
    .qr-section {
      text-align: center;
      background: #0f172a;
      border-radius: 14px;
      padding: 24px 20px;
      border: 1px dashed #334155;
      margin-bottom: 25px;
    }
    .qr-wrapper {
      display: inline-block;
      background: #ffffff;
      padding: 14px;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
    }
    .qr-img {
      display: block;
      width: 190px;
      height: 190px;
      margin: 0 auto;
    }
    .ticket-code {
      margin-top: 15px;
      font-size: 18px;
      font-weight: 800;
      letter-spacing: 2px;
      color: #38bdf8;
      font-family: monospace;
    }
    .security-note {
      font-size: 11px;
      color: #10b981;
      margin-top: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .instructions {
      background: #1e293b;
      border-left: 4px solid #6366f1;
      padding: 14px 16px;
      border-radius: 0 8px 8px 0;
      font-size: 12px;
      color: #cbd5e1;
      line-height: 1.5;
    }
    .footer {
      text-align: center;
      padding: 20px;
      background: #0d131f;
      font-size: 11px;
      color: #64748b;
      border-top: 1px solid #1e293b;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header-banner">
        <span class="badge">Official Admission Pass</span>
        <h1 class="event-title">${event.title}</h1>
        <p class="event-tagline">${event.tagline || 'Campus Event Entry Ticket'}</p>
      </div>

      <div class="content">
        <p class="greeting">Hello <strong>${ticket.student_name}</strong>, your seat has been confirmed! Here is your entry ticket.</p>

        <div class="meta-card">
          <div class="meta-row">
            <span class="meta-label">📅 Date:</span>
            <span class="meta-value">${formattedDate}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">⏰ Time:</span>
            <span class="meta-value">${event.time}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">📍 Venue:</span>
            <span class="meta-value">${event.location}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">🎓 Attendee:</span>
            <span class="meta-value">${ticket.student_name} (${ticket.student_id}) - ${ticket.department}</span>
          </div>
        </div>

        <div class="qr-section">
          <div class="qr-wrapper">
            <!-- Embedded QR Code using CID attachment -->
            <img class="qr-img" src="cid:ticketqr" alt="Entry QR Ticket" />
          </div>
          <div class="ticket-code">${ticket.ticket_code}</div>
          <div class="security-note">
            🔒 Cryptographically Signed • Non-Transferable • One-Time Entry
          </div>
        </div>

        <div class="instructions">
          <strong>Entry Check-in Protocol:</strong>
          <br>Please present this QR code directly on your mobile screen or bring a printed copy to the entry desk. The event organizers will scan and authenticate this code at the venue.
        </div>
      </div>

      <div class="footer">
        Automated Campus Event Ticketing Engine • Powered by Node.js & HMAC-SHA256
        <br>Ticket Reference: #${ticket.id} • Issued: ${new Date().toUTCString()}
      </div>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Dispatches a dynamic HTML email containing the embedded signed QR code
   */
  async sendTicketEmail({ event, ticket }) {
    await this.initTransporter();

    // Generate QR PNG Buffer for CID embedding
    const qrBuffer = await qrService.generateQrBuffer(ticket.qr_token);
    const qrDataUrl = await qrService.generateQrDataUrl(ticket.qr_token);

    const htmlContent = this.generateEmailHtml({ event, ticket, qrDataUrl });

    const mailOptions = {
      from: config.email.from,
      to: ticket.student_email,
      subject: `🎟️ Entry Ticket Confirmed: ${event.title} [${ticket.ticket_code}]`,
      html: htmlContent,
      text: `Hello ${ticket.student_name},\n\nYour registration for ${event.title} is confirmed!\nTicket Code: ${ticket.ticket_code}\nVenue: ${event.location}\nDate: ${event.date} at ${event.time}\n\nPlease present your QR code pass at check-in.`,
      attachments: [
        {
          filename: `ticket-${ticket.ticket_code}.png`,
          content: qrBuffer,
          cid: 'ticketqr' // Embedded inline image cid
        }
      ]
    };

    if (!this.transporter) {
      console.log(`[Email Mock] Email simulated to ${ticket.student_email} for ticket ${ticket.ticket_code}`);
      return {
        success: true,
        mock: true,
        previewUrl: null,
        provider: 'Console Simulated'
      };
    }

    try {
      const info = await this.transporter.sendMail(mailOptions);
      const previewUrl = nodemailer.getTestMessageUrl(info);

      console.log(`✅ Ticket email dispatched to: ${ticket.student_email} (MsgID: ${info.messageId})`);
      if (previewUrl) {
        console.log(`🔗 Ethereal Live Preview URL: ${previewUrl}`);
      }

      return {
        success: true,
        messageId: info.messageId,
        previewUrl: previewUrl || null,
        provider: this.providerName
      };
    } catch (err) {
      console.error(`❌ Failed to send ticket email to ${ticket.student_email}:`, err.message);
      return {
        success: false,
        error: err.message,
        provider: this.providerName
      };
    }
  }
}

module.exports = new EmailService();
