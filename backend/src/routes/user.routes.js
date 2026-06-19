const router = require('express').Router();
const { getProfile, updateProfile, uploadPhoto, removePhoto, changePassword } = require('../controllers/user.controller');
const { protect } = require('../middleware/auth');
const { uploadProfile } = require('../middleware/upload');

router.use(protect);

router.get('/profile',             getProfile);
router.patch('/profile',           updateProfile);
router.post('/profile/photo',      uploadProfile.single('photo'), uploadPhoto);
router.delete('/profile/photo',    removePhoto);
router.patch('/change-password',   changePassword);

module.exports = router;
