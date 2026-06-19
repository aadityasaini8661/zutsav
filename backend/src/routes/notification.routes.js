const router = require('express').Router();
const ctrl   = require('../controllers/notification.controller');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/',                  ctrl.getNotifications);
router.get('/unread-count',      ctrl.getUnreadCount);
router.patch('/read-all',        ctrl.markAllRead);
router.delete('/clear-all',      ctrl.clearAll);
router.patch('/:id/read',        ctrl.markRead);
router.delete('/:id',            ctrl.deleteNotification);

module.exports = router;
