const router = require('express').Router();
const ctrl   = require('../controllers/referral.controller');
const { protect, authorize } = require('../middleware/auth');

router.get('/my',           protect,                    ctrl.getMyReferral);
router.get('/admin/stats',  protect, authorize('admin'), ctrl.getAdminReferralStats);

module.exports = router;
