const axios    = require('axios');
const settings = require('./settingsService');

async function _cfg() {
  const phoneNumberId = await settings.get('whatsappPhoneNumberId', process.env.WHATSAPP_PHONE_NUMBER_ID);
  const accessToken   = await settings.get('whatsappAccessToken',   process.env.WHATSAPP_ACCESS_TOKEN);
  const apiVersion    = await settings.get('whatsappApiVersion',    process.env.WHATSAPP_API_VERSION || 'v18.0');
  return { phoneNumberId, accessToken, apiVersion };
}

const sendWhatsApp = async (to, templateName, components = []) => {
  const { phoneNumberId, accessToken, apiVersion } = await _cfg();
  if (!accessToken || !phoneNumberId) {
    console.warn('WhatsApp not configured — skipping notification');
    return;
  }

  const phone = to.startsWith('+') ? to.replace('+', '') : `91${to}`;
  const url   = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

  try {
    const res = await axios.post(
      url,
      {
        messaging_product: 'whatsapp',
        recipient_type:    'individual',
        to:                phone,
        type:              'template',
        template:          { name: templateName, language: { code: 'en' }, components },
      },
      { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
    );
    console.log(`✅ WhatsApp sent to ${phone}:`, res.data);
    return res.data;
  } catch (err) {
    console.error('❌ WhatsApp error:', err.response?.data || err.message);
  }
};

const sendWhatsAppText = async (to, text) => {
  const { phoneNumberId, accessToken, apiVersion } = await _cfg();
  if (!accessToken || !phoneNumberId) {
    console.warn('WhatsApp not configured — message:', text);
    return;
  }

  const phone = to.startsWith('+') ? to.replace('+', '') : `91${to}`;
  const url   = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

  try {
    const res = await axios.post(
      url,
      {
        messaging_product: 'whatsapp',
        recipient_type:    'individual',
        to:                phone,
        type:              'text',
        text:              { body: text },
      },
      { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
    );
    return res.data;
  } catch (err) {
    console.error('❌ WhatsApp text error:', err.response?.data || err.message);
  }
};

/**
 * Notify user when pandit is assigned to their booking
 */
const notifyPanditAssigned = async (booking, pandit) => {
  const message =
    `🙏 *Namaste ${booking.userDetails.name}!*\n\n` +
    `Your booking has been confirmed!\n\n` +
    `📋 *Booking Details:*\n` +
    `• Booking No: ${booking.bookingNumber}\n` +
    `• Pandit: ${pandit.name}\n` +
    `• Contact: +91-${pandit.phone}\n` +
    `• Date: ${new Date(booking.scheduledDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n` +
    `• Time: ${booking.scheduledTime}\n\n` +
    `For any queries, please contact us.\n\n` +
    `🙏 *Jai Shri Ram — Team Zutsav*`;

  return sendWhatsAppText(booking.userDetails.phone, message);
};

/**
 * Booking confirmation after payment
 */
const notifyBookingConfirmed = async (booking, poojaName) => {
  const message =
    `🙏 *Booking Confirmed — Zutsav*\n\n` +
    `Dear ${booking.userDetails.name},\n\n` +
    `Your booking for *${poojaName}* has been received successfully!\n\n` +
    `📋 *Details:*\n` +
    `• Booking No: ${booking.bookingNumber}\n` +
    `• Date: ${new Date(booking.scheduledDate).toLocaleDateString('en-IN')}\n` +
    `• Time: ${booking.scheduledTime}\n` +
    `• Amount Paid: ₹${booking.amount}\n\n` +
    `A pandit will be assigned to you shortly. You will receive another notification once assigned.\n\n` +
    `🙏 *Team Zutsav*`;

  return sendWhatsAppText(booking.userDetails.phone, message);
};

module.exports = { sendWhatsApp, sendWhatsAppText, notifyPanditAssigned, notifyBookingConfirmed };
