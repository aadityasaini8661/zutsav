/**
 * Centralized notification service.
 * Tries WhatsApp first; if WhatsApp is not configured, falls back to email.
 * If NOTIFY_ALWAYS_EMAIL=true, sends both.
 */
const { sendWhatsAppText, notifyBookingConfirmed: waBookingConfirmed, notifyPanditAssigned: waPanditAssigned } = require('./whatsapp');
const { sendBookingConfirmedEmail, sendPanditAssignedEmail } = require('./email');

const waConfigured = () =>
  !!(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);

const alwaysEmail = () => process.env.NOTIFY_ALWAYS_EMAIL === 'true';

/**
 * Notify user that booking was confirmed after payment
 */
const notifyBookingConfirmed = async (booking, poojaName) => {
  const phone = booking.userDetails?.phone;
  const email = booking.userDetails?.email;

  if (waConfigured() && phone) {
    await waBookingConfirmed(booking, poojaName);
  }
  if ((!waConfigured() || alwaysEmail()) && email) {
    await sendBookingConfirmedEmail(booking, poojaName);
  }
};

/**
 * Notify user that a pandit has been assigned
 */
const notifyPanditAssigned = async (booking, pandit) => {
  const phone = booking.userDetails?.phone;
  const email = booking.userDetails?.email;

  if (waConfigured() && phone) {
    await waPanditAssigned(booking, pandit);
  }
  if ((!waConfigured() || alwaysEmail()) && email) {
    await sendPanditAssignedEmail(booking, pandit);
  }
};

module.exports = { notifyBookingConfirmed, notifyPanditAssigned };
