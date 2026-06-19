const NotificationLog = require('../models/NotificationLog');
const { sendEmail }      = require('./email');
const { sendWhatsApp, sendWhatsAppText } = require('./whatsapp');

/**
 * Send an email and record the result in NotificationLog.
 */
const loggedSendEmail = async ({ to, subject, html, event = 'manual', templateName = '', recipientId = null, recipientName = '' }) => {
  const log = await NotificationLog.create({
    type: 'email',
    event,
    templateName,
    recipientEmail: to,
    recipientId,
    recipientName,
    subject,
    status: 'processing',
  });

  try {
    await sendEmail(to, subject, html);
    log.status   = 'delivered';
    log.response = { message: 'Sent via nodemailer' };
  } catch (err) {
    log.status = 'failed';
    log.error  = err.message;
  }

  await log.save();
  return log;
};

/**
 * Send a WhatsApp template message and record the result.
 */
const loggedSendWhatsApp = async ({ to, templateName, components = [], event = 'manual', recipientId = null, recipientName = '' }) => {
  const log = await NotificationLog.create({
    type: 'whatsapp',
    event,
    templateName,
    recipientPhone: to,
    recipientId,
    recipientName,
    status: 'processing',
  });

  try {
    const res  = await sendWhatsApp(to, templateName, components);
    log.status   = 'delivered';
    log.response = res || {};
  } catch (err) {
    log.status = 'failed';
    log.error  = err.message;
  }

  await log.save();
  return log;
};

/**
 * Send a WhatsApp text (freeform) and record the result.
 */
const loggedSendWhatsAppText = async ({ to, text, event = 'manual', recipientId = null, recipientName = '' }) => {
  const log = await NotificationLog.create({
    type: 'whatsapp',
    event,
    templateName: 'freeform',
    recipientPhone: to,
    recipientId,
    recipientName,
    status: 'processing',
  });

  try {
    const res  = await sendWhatsAppText(to, text);
    log.status   = 'delivered';
    log.response = res || {};
  } catch (err) {
    log.status = 'failed';
    log.error  = err.message;
  }

  await log.save();
  return log;
};

module.exports = { loggedSendEmail, loggedSendWhatsApp, loggedSendWhatsAppText };
