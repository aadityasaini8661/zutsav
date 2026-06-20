const nodemailer = require('nodemailer');
const https      = require('https');
const settings   = require('./settingsService');

const TIMEOUT_MS = 10_000; // 10 seconds — hard cap for all email delivery

// ── Resend API (HTTPS port 443 — works on Railway/Vercel) ─────────────────────
async function _sendViaResend(to, subject, html) {
  const apiKey      = process.env.RESEND_API_KEY;
  const fromAddress = process.env.RESEND_FROM || `Zutsav <onboarding@resend.dev>`;
  if (!apiKey) return false;

  const payload = JSON.stringify({ from: fromAddress, to: [to], subject, html });

  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: 'api.resend.com',
        port:     443,
        path:     '/emails',
        method:   'POST',
        headers:  {
          Authorization:  `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (c) => { body += c; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(true);
          } else {
            console.error(`[Email] Resend error ${res.statusCode}:`, body);
            resolve(false);
          }
        });
      }
    );
    req.on('error', (err) => {
      console.error('[Email] Resend network error:', err.message);
      resolve(false);
    });
    req.setTimeout(TIMEOUT_MS, () => {
      console.error('[Email] Resend request timed out');
      req.destroy();
      resolve(false);
    });
    req.write(payload);
    req.end();
  });
}

// ── Nodemailer / SMTP (fallback) ──────────────────────────────────────────────
async function _sendViaSmtp(to, subject, html) {
  const emailUser = await settings.get('emailSmtpUser',     process.env.EMAIL_USER);
  const emailPass = await settings.get('emailSmtpPassword', process.env.EMAIL_PASS);
  const smtpHost  = await settings.get('emailSmtpHost');
  const smtpPort  = await settings.get('emailSmtpPort', 587);
  const service   = await settings.get('emailService',  process.env.EMAIL_SERVICE || 'gmail');

  if (!emailUser || !emailPass) return false;

  const timeouts = {
    connectionTimeout: TIMEOUT_MS,
    greetingTimeout:   TIMEOUT_MS,
    socketTimeout:     TIMEOUT_MS,
  };

  const config = smtpHost
    ? { host: smtpHost, port: Number(smtpPort), secure: Number(smtpPort) === 465, auth: { user: emailUser, pass: emailPass }, ...timeouts }
    : { service, auth: { user: emailUser, pass: emailPass }, ...timeouts };

  const transport = nodemailer.createTransport(config);

  try {
    await transport.sendMail({ from: `"Zutsav" <${emailUser}>`, to, subject, html });
    return true;
  } catch (err) {
    console.error(`[Email] SMTP error to ${to}:`, err.message);
    return false;
  } finally {
    transport.close();
  }
}

/**
 * Send an HTML email.
 *
 * For OTP / critical flows — throws on failure so the caller can return a
 * meaningful error to the user (prevents infinite loading).
 *
 * For fire-and-forget notifications (booking confirmed, etc.) — callers wrap
 * in .catch(() => {}) so a send failure never crashes the request.
 *
 * Delivery order: Resend API (if RESEND_API_KEY set) → SMTP fallback.
 * Hard timeout: 10 seconds regardless of provider.
 */
const sendEmail = async (to, subject, html) => {
  const withTimeout = (promise) =>
    Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Email delivery timed out after 10 seconds')), TIMEOUT_MS + 1000)
      ),
    ]);

  // 1. Try Resend (HTTP API — unblocked on Railway)
  if (process.env.RESEND_API_KEY) {
    const sent = await withTimeout(_sendViaResend(to, subject, html));
    if (sent) {
      console.log(`[Email] Sent via Resend to ${to}`);
      return;
    }
    console.warn('[Email] Resend failed — trying SMTP fallback');
  }

  // 2. SMTP fallback
  const sent = await withTimeout(_sendViaSmtp(to, subject, html));
  if (!sent) {
    throw new Error(
      'Email could not be delivered. On Railway, Gmail SMTP port 587 is often blocked. ' +
      'Set RESEND_API_KEY in Railway environment variables to fix this.'
    );
  }
  console.log(`[Email] Sent via SMTP to ${to}`);
};

// ── Notification emails (fire-and-forget — never throw) ───────────────────────
const sendBookingConfirmedEmail = (booking, poojaName) => {
  if (!booking.userDetails?.email) return;
  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
      <h2 style="color:#b91c1c">Zutsav — Booking Confirmed</h2>
      <p>Namaste <strong>${booking.userDetails.name}</strong>,</p>
      <p>Your booking for <strong>${poojaName}</strong> has been received.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:8px 0;color:#6b7280">Booking No</td><td><strong>#${booking.bookingNumber}</strong></td></tr>
        <tr><td style="padding:8px 0;color:#6b7280">Pooja</td><td>${poojaName}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280">Date</td><td>${new Date(booking.scheduledDate).toLocaleDateString('en-IN',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280">Time</td><td>${booking.scheduledTime}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280">Amount</td><td><strong>&#8377;${booking.amount}</strong></td></tr>
      </table>
      <p style="color:#6b7280;font-size:14px">A pandit will be assigned shortly.</p>
      <p style="color:#b91c1c">Team Zutsav</p>
    </div>`;
  return sendEmail(booking.userDetails.email, `Booking Confirmed — ${poojaName}`, html)
    .catch((err) => console.error('[Email] Booking confirmation failed:', err.message));
};

const sendPanditAssignedEmail = (booking, pandit) => {
  if (!booking.userDetails?.email) return;
  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
      <h2 style="color:#b91c1c">Zutsav — Pandit Assigned</h2>
      <p>Namaste <strong>${booking.userDetails.name}</strong>,</p>
      <p>A pandit has been assigned for your booking <strong>#${booking.bookingNumber}</strong>.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:8px 0;color:#6b7280">Pandit</td><td><strong>${pandit.name}</strong></td></tr>
        <tr><td style="padding:8px 0;color:#6b7280">Contact</td><td>+91-${pandit.phone}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280">Date</td><td>${new Date(booking.scheduledDate).toLocaleDateString('en-IN',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280">Time</td><td>${booking.scheduledTime}</td></tr>
      </table>
      <p style="color:#b91c1c">Team Zutsav</p>
    </div>`;
  return sendEmail(booking.userDetails.email, `Pandit Assigned — Booking #${booking.bookingNumber}`, html)
    .catch((err) => console.error('[Email] Pandit assigned email failed:', err.message));
};

module.exports = { sendEmail, sendBookingConfirmedEmail, sendPanditAssignedEmail };
