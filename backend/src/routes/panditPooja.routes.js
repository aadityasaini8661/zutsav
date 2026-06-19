const router = require('express').Router();
const ctrl   = require('../controllers/panditPooja.controller');
const { protect, authorize } = require('../middleware/auth');
const { uploadProfile } = require('../middleware/upload');

// All routes require pandit login
router.use(protect, authorize('pandit'));

router.get('/',    ctrl.getMyPoojas);
router.post('/',   uploadProfile.single('image'), ctrl.createMyPooja);
router.patch('/:id', uploadProfile.single('image'), ctrl.updateMyPooja);
router.delete('/:id', ctrl.deleteMyPooja);

module.exports = router;
