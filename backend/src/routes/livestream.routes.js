const router = require('express').Router();
const ctrl   = require('../controllers/livestream.controller');
const { protect, authorize } = require('../middleware/auth');

// Authenticated users only (all roles)
router.get('/', protect, ctrl.getLivestreams);

// Admin only
router.post('/',      protect, authorize('admin'), ctrl.createLivestream);
router.patch('/:id',  protect, authorize('admin'), ctrl.updateLivestream);
router.delete('/:id', protect, authorize('admin'), ctrl.deleteLivestream);

module.exports = router;
