const router = require('express').Router();
const ctrl   = require('../controllers/admin.controller');
const { protect } = require('../middleware/auth');

// Read-only master data accessible to any authenticated user (pandits, users, admins).
// Write operations remain in admin.routes.js (admin-only).
router.use(protect);

router.get('/education-masters',       ctrl.getEducationMasters);
router.get('/specialization-masters',  ctrl.getSpecializationMasters);

module.exports = router;
