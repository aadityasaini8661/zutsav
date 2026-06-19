const axios           = require('axios');
const EmailTemplate   = require('../models/EmailTemplate');
const WhatsAppTemplate= require('../models/WhatsAppTemplate');
const TriggerRule     = require('../models/TriggerRule');
const NotificationLog = require('../models/NotificationLog');
const { loggedSendEmail, loggedSendWhatsApp, loggedSendWhatsAppText } = require('../utils/commLogger');

// ─── Helpers ────────────────────────────────────────────────────────────────

const ok  = (res, data, status = 200) => res.status(status).json({ success: true,  ...data });
const err = (res, msg,  status = 400) => res.status(status).json({ success: false, message: msg });

// Replace {{variable}} placeholders in template with provided values map
const interpolate = (text, vars = {}) =>
  text.replace(/\{\{(\w[\w.]*)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);


// ═══════════════════════════════════════════════════════════════════════════
// EMAIL TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════

exports.listEmailTemplates = async (req, res) => {
  try {
    const templates = await EmailTemplate.find().sort({ createdAt: -1 }).lean();
    ok(res, { templates });
  } catch (e) { err(res, e.message, 500); }
};

exports.getEmailTemplate = async (req, res) => {
  try {
    const t = await EmailTemplate.findById(req.params.id).lean();
    if (!t) return err(res, 'Template not found', 404);
    ok(res, { template: t });
  } catch (e) { err(res, e.message, 500); }
};

exports.createEmailTemplate = async (req, res) => {
  try {
    const { name, slug, subject, htmlContent, variables, description } = req.body;
    if (!name || !slug || !subject || !htmlContent) return err(res, 'name, slug, subject, htmlContent are required');

    const exists = await EmailTemplate.findOne({ slug });
    if (exists) return err(res, 'A template with this slug already exists');

    const template = await EmailTemplate.create({ name, slug, subject, htmlContent, variables, description });
    ok(res, { template }, 201);
  } catch (e) { err(res, e.message, 500); }
};

exports.updateEmailTemplate = async (req, res) => {
  try {
    const { name, slug, subject, htmlContent, variables, description, isActive } = req.body;
    const template = await EmailTemplate.findByIdAndUpdate(
      req.params.id,
      { name, slug, subject, htmlContent, variables, description, isActive },
      { new: true, runValidators: true }
    );
    if (!template) return err(res, 'Template not found', 404);
    ok(res, { template });
  } catch (e) { err(res, e.message, 500); }
};

exports.deleteEmailTemplate = async (req, res) => {
  try {
    const template = await EmailTemplate.findByIdAndDelete(req.params.id);
    if (!template) return err(res, 'Template not found', 404);
    ok(res, { message: 'Template deleted' });
  } catch (e) { err(res, e.message, 500); }
};


// ═══════════════════════════════════════════════════════════════════════════
// WHATSAPP TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════

exports.listWhatsAppTemplates = async (req, res) => {
  try {
    const templates = await WhatsAppTemplate.find().sort({ createdAt: -1 }).lean();
    ok(res, { templates });
  } catch (e) { err(res, e.message, 500); }
};

exports.syncWhatsAppTemplates = async (req, res) => {
  try {
    const { WHATSAPP_ACCESS_TOKEN, WHATSAPP_BUSINESS_ACCOUNT_ID, WHATSAPP_API_VERSION = 'v18.0' } = process.env;
    if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_BUSINESS_ACCOUNT_ID)
      return err(res, 'WHATSAPP_ACCESS_TOKEN and WHATSAPP_BUSINESS_ACCOUNT_ID are required in env', 500);

    const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates`;
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}` },
      params: { limit: 200 },
    });

    const fetched = response.data?.data || [];
    let synced = 0;

    for (const t of fetched) {
      await WhatsAppTemplate.findOneAndUpdate(
        { name: t.name },
        {
          metaId:     t.id,
          language:   t.language,
          category:   t.category,
          status:     t.status,
          components: t.components || [],
          syncedAt:   new Date(),
        },
        { upsert: true, new: true }
      );
      synced++;
    }

    ok(res, { message: `Synced ${synced} templates from Meta` });
  } catch (e) {
    const detail = e.response?.data?.error?.message || e.message;
    err(res, `Meta sync failed: ${detail}`, 500);
  }
};

exports.updateWhatsAppTemplate = async (req, res) => {
  try {
    const { assignedTrigger, isActive } = req.body;
    const template = await WhatsAppTemplate.findByIdAndUpdate(
      req.params.id,
      { assignedTrigger, isActive },
      { new: true }
    );
    if (!template) return err(res, 'Template not found', 404);
    ok(res, { template });
  } catch (e) { err(res, e.message, 500); }
};


// ═══════════════════════════════════════════════════════════════════════════
// TRIGGER RULES
// ═══════════════════════════════════════════════════════════════════════════

exports.listTriggerRules = async (req, res) => {
  try {
    // Seed rules from EVENTS list for any missing events on first call
    const { EVENTS } = require('../models/TriggerRule');
    const existing = await TriggerRule.find().lean();
    const existingEvents = new Set(existing.map((r) => r.event));

    const toInsert = EVENTS.filter((e) => !existingEvents.has(e.value)).map((e) => ({
      event:    e.value,
      label:    e.label,
      channels: [],
      isActive: false,
    }));
    if (toInsert.length) await TriggerRule.insertMany(toInsert);

    const rules = await TriggerRule.find()
      .populate('channels.emailTemplateId', 'name slug')
      .sort({ event: 1 })
      .lean();
    ok(res, { rules });
  } catch (e) { err(res, e.message, 500); }
};

exports.updateTriggerRule = async (req, res) => {
  try {
    const { channels, isActive, description } = req.body;
    const rule = await TriggerRule.findByIdAndUpdate(
      req.params.id,
      { channels, isActive, description },
      { new: true, runValidators: true }
    ).populate('channels.emailTemplateId', 'name slug');
    if (!rule) return err(res, 'Trigger rule not found', 404);
    ok(res, { rule });
  } catch (e) { err(res, e.message, 500); }
};


// ═══════════════════════════════════════════════════════════════════════════
// NOTIFICATION LOGS
// ═══════════════════════════════════════════════════════════════════════════

exports.getLogs = async (req, res) => {
  try {
    const { status, type, event, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type)   filter.type   = type;
    if (event)  filter.event  = event;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [logs, total] = await Promise.all([
      NotificationLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      NotificationLog.countDocuments(filter),
    ]);
    ok(res, { logs, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (e) { err(res, e.message, 500); }
};

exports.getLogStats = async (req, res) => {
  try {
    const [byStatus, byType, failedToday] = await Promise.all([
      NotificationLog.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      NotificationLog.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }]),
      NotificationLog.countDocuments({
        status: 'failed',
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      }),
    ]);
    ok(res, { byStatus, byType, failedToday });
  } catch (e) { err(res, e.message, 500); }
};

exports.retryLog = async (req, res) => {
  try {
    const log = await NotificationLog.findById(req.params.id);
    if (!log)                       return err(res, 'Log entry not found', 404);
    if (log.status !== 'failed')    return err(res, 'Only failed notifications can be retried');
    if (log.retryCount >= 5)        return err(res, 'Max retry attempts (5) reached');

    log.status = 'processing';
    log.retryCount += 1;
    await log.save();

    if (log.type === 'email') {
      // Reconstruct email from EmailTemplate if templateName present
      let html = log.metadata?.html || '<p>Retry</p>';
      let subject = log.subject;
      if (log.templateName) {
        const tmpl = await EmailTemplate.findOne({ slug: log.templateName });
        if (tmpl) { html = tmpl.htmlContent; subject = tmpl.subject; }
      }
      try {
        const { sendEmail } = require('../utils/email');
        await sendEmail(log.recipientEmail, subject, html);
        log.status   = 'delivered';
        log.response = { message: 'Retry successful' };
      } catch (e2) {
        log.status = 'failed';
        log.error  = e2.message;
      }
    } else if (log.type === 'whatsapp') {
      try {
        const { sendWhatsAppText } = require('../utils/whatsapp');
        await sendWhatsAppText(log.recipientPhone, `[Retry] ${log.templateName || 'Notification'}`);
        log.status   = 'delivered';
        log.response = { message: 'Retry successful' };
      } catch (e2) {
        log.status = 'failed';
        log.error  = e2.message;
      }
    }

    await log.save();
    ok(res, { log });
  } catch (e) { err(res, e.message, 500); }
};

exports.deleteLog = async (req, res) => {
  try {
    await NotificationLog.findByIdAndDelete(req.params.id);
    ok(res, { message: 'Log deleted' });
  } catch (e) { err(res, e.message, 500); }
};

exports.clearFailedLogs = async (req, res) => {
  try {
    const result = await NotificationLog.deleteMany({ status: 'failed' });
    ok(res, { message: `Deleted ${result.deletedCount} failed logs` });
  } catch (e) { err(res, e.message, 500); }
};


// ═══════════════════════════════════════════════════════════════════════════
// TEST NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════

exports.testNotification = async (req, res) => {
  try {
    const { type, to, templateSlug, templateName, variables = {}, message } = req.body;
    if (!type || !to) return err(res, 'type and to are required');

    if (type === 'email') {
      if (!templateSlug) return err(res, 'templateSlug is required for email test');
      const tmpl = await EmailTemplate.findOne({ slug: templateSlug });
      if (!tmpl) return err(res, 'Email template not found');

      const html    = interpolate(tmpl.htmlContent, variables);
      const subject = interpolate(tmpl.subject, variables);

      const log = await loggedSendEmail({
        to,
        subject,
        html,
        event:         'test',
        templateName:  tmpl.slug,
        recipientName: 'Test User',
      });
      return ok(res, { message: 'Test email dispatched', logId: log._id, status: log.status });
    }

    if (type === 'whatsapp') {
      if (message) {
        const log = await loggedSendWhatsAppText({
          to,
          text:          message,
          event:         'test',
          recipientName: 'Test User',
        });
        return ok(res, { message: 'Test WhatsApp text dispatched', logId: log._id, status: log.status });
      }
      if (!templateName) return err(res, 'templateName or message required for whatsapp test');
      const log = await loggedSendWhatsApp({
        to,
        templateName,
        components:    [],
        event:         'test',
        recipientName: 'Test User',
      });
      return ok(res, { message: 'Test WhatsApp template dispatched', logId: log._id, status: log.status });
    }

    return err(res, 'type must be "email" or "whatsapp"');
  } catch (e) { err(res, e.message, 500); }
};


// ═══════════════════════════════════════════════════════════════════════════
// OVERVIEW STATS (for dashboard tab)
// ═══════════════════════════════════════════════════════════════════════════

exports.getOverview = async (req, res) => {
  try {
    const now  = new Date();
    const day  = new Date(now - 24 * 60 * 60 * 1000);
    const week = new Date(now - 7  * 24 * 60 * 60 * 1000);

    const [total, last24h, lastWeek, byStatus, byType, recentFailed] = await Promise.all([
      NotificationLog.countDocuments({}),
      NotificationLog.countDocuments({ createdAt: { $gte: day } }),
      NotificationLog.countDocuments({ createdAt: { $gte: week } }),
      NotificationLog.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      NotificationLog.aggregate([{ $group: { _id: '$type',   count: { $sum: 1 } } }]),
      NotificationLog.find({ status: 'failed' }).sort({ createdAt: -1 }).limit(5).lean(),
    ]);

    ok(res, { stats: { total, last24h, lastWeek }, byStatus, byType, recentFailed });
  } catch (e) { err(res, e.message, 500); }
};
