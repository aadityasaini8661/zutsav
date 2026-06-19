const router = require('express').Router();
const ctrl   = require('../controllers/festival.controller');
const { protect, authorize } = require('../middleware/auth');
const { uploadProfile } = require('../middleware/upload');

// Public
router.get('/', ctrl.getFestivals);

// Admin — named routes must come before /:id to avoid param collision
router.get('/sync-logs', protect, authorize('admin'), ctrl.getSyncLogs);
router.post('/sync',     protect, authorize('admin'), ctrl.syncFromGoogleSheets);

// Admin — CRUD
router.post('/',       protect, authorize('admin'), uploadProfile.single('image'), ctrl.createFestival);
router.patch('/:id',   protect, authorize('admin'), uploadProfile.single('image'), ctrl.updateFestival);
router.delete('/:id',  protect, authorize('admin'), ctrl.deleteFestival);

module.exports = router;
