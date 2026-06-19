const nodemailer = require('nodemailer');
const settings   = require('./settingsService');

async function _buildTransporter() {
  const emailUser = await settings.get('emailSmtpUser',     process.env.EMAIL_USER);
  const emailPass = await settings.get('emailSmtpPassword', process.env.EMAIL_PASS);
  const smtpHost  = await settings.get('emailSmtpHost');
  const smtpPort  = await settings.get('emailSmtpPort',     587);
  const service   = await settings.get('emailService',      process.env.EMAIL_SERVICE || 'gmail');

  if (!emailUser || !emailPass) return null;

  const config = smtpHost
    ? { host: smtpHost, port: Number(smtpPort), secure: Number(smtpPort) === 465, auth: { user: emailUser, pass: emailPass } }
    : { service, auth: { user: emailUser, pass: emailPass } };

  return { transport: nodemailer.createTransport(config), emailUser };
}

/**
 * Send a plain HTML email
 * @param {string} to
 * @param {string} subject
 * @param {string} html
 */
const sendEmail = async (to, subject, html) => {
  const built = await _buildTransporter();
  if (!built) {
    console.warn('Email not configured — skipping');
    return;
  }
  const { transport, emailUser } = built;

  try {
    await transport.sendMail({ from: `"Zutsav 🪔" <${emailUser}>`, to, subject, html });
    console.log(`✅ Email sent to ${to}: ${subject}`);
  } catch (err) {
    console.error(`❌ Email error to ${to}:`, err.message);
  }
};

const sendBookingConfirmedEmail = (booking, poojaName) => {
  if (!booking.userDetails?.email) return;
  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
      <h2 style="color:#b91c1c">🪔 Zutsav — Booking Confirmed</h2>
      <p>Namaste <strong>${booking.userDetails.name}</strong>,</p>
      <p>Your booking for <strong>${poojaName}</strong> has been received.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:8px 0;color:#6b7280">Booking No</td><td><strong>#${booking.bookingNumber}</strong></td></tr>
        <tr><td style="padding:8px 0;color:#6b7280">Pooja</td><td>${poojaName}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280">Date</td><td>${new Date(booking.scheduledDate).toLocaleDateString('en-IN',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280">Time</td><td>${booking.scheduledTime}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280">Amount</td><td><strong>₹${booking.amount}</strong></td></tr>
      </table>
      <p style="color:#6b7280;font-size:14px">A pandit will be assigned shortly. You will be notified once assigned.</p>
      <p style="color:#b91c1c">🙏 Team Zutsav</p>
    </div>`;
  return sendEmail(booking.userDetails.email, `Booking Confirmed — ${poojaName}`, html);
};

const sendPanditAssignedEmail = (booking, pandit) => {
  if (!booking.userDetails?.email) return;
  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
      <h2 style="color:#b91c1c">🪔 Zutsav — Pandit Assigned</h2>
      <p>Namaste <strong>${booking.userDetails.name}</strong>,</p>
      <p>A pandit has been assigned for your booking <strong>#${booking.bookingNumber}</strong>.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:8px 0;color:#6b7280">Pandit</td><td><strong>${pandit.name}</strong></td></tr>
        <tr><td style="padding:8px 0;color:#6b7280">Contact</td><td>+91-${pandit.phone}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280">Date</td><td>${new Date(booking.scheduledDate).toLocaleDateString('en-IN',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280">Time</td><td>${booking.scheduledTime}</td></tr>
      </table>
      <p style="color:#b91c1c">🙏 Team Zutsav</p>
    </div>`;
  return sendEmail(booking.userDetails.email, `Pandit Assigned — Booking #${booking.bookingNumber}`, html);
};

module.exports = { sendEmail, sendBookingConfirmedEmail, sendPanditAssignedEmail };
