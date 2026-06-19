const router = require('express').Router();
const ctrl   = require('../controllers/comm.controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

// Overview
router.get('/overview', ctrl.getOverview);

// Email Templates
router.get   ('/email-templates',      ctrl.listEmailTemplates);
router.post  ('/email-templates',      ctrl.createEmailTemplate);
router.get   ('/email-templates/:id',  ctrl.getEmailTemplate);
router.put   ('/email-templates/:id',  ctrl.updateEmailTemplate);
router.delete('/email-templates/:id',  ctrl.deleteEmailTemplate);

// WhatsApp Templates
router.get  ('/wa-templates',         ctrl.listWhatsAppTemplates);
router.post ('/wa-templates/sync',    ctrl.syncWhatsAppTemplates);
router.patch('/wa-templates/:id',     ctrl.updateWhatsAppTemplate);

// Trigger Rules
router.get  ('/trigger-rules',        ctrl.listTriggerRules);
router.put  ('/trigger-rules/:id',    ctrl.updateTriggerRule);

// Notification Logs
router.get   ('/logs',                ctrl.getLogs);
router.get   ('/logs/stats',          ctrl.getLogStats);
router.post  ('/logs/:id/retry',      ctrl.retryLog);
router.delete('/logs/failed/clear',   ctrl.clearFailedLogs);
router.delete('/logs/:id',            ctrl.deleteLog);

// Test Notifications
router.post('/test', ctrl.testNotification);

module.exports = router;
