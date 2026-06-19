const router = require('express').Router();
const ctrl   = require('../controllers/temple.controller');
const { protect, authorize } = require('../middleware/auth');
const { uploadProducts } = require('../middleware/upload');

// Public
router.get('/',    ctrl.getTemples);
router.get('/:id', ctrl.getTemple);

// Admin only
router.post('/',      protect, authorize('admin'), uploadProducts.array('images', 5), ctrl.createTemple);
router.patch('/:id',  protect, authorize('admin'), uploadProducts.array('images', 5), ctrl.updateTemple);
router.delete('/:id', protect, authorize('admin'), ctrl.deleteTemple);

module.exports = router;
