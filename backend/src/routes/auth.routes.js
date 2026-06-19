const router = require('express').Router();
const {
  register, login, getMe, registerPandit, sendOTP, verifyOTP, completeRegistration,
  checkDeletionPassword, sendDeletionOTP, confirmAccountDeletion, cancelAccountDeletion,
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');
const { uploadGovtId } = require('../middleware/upload');

router.post('/send-otp',              sendOTP);
router.post('/verify-otp',            verifyOTP);
router.post('/complete-registration', completeRegistration);
router.post('/register',              register);
router.post('/register-pandit',       uploadGovtId.single('govtIdImage'), registerPandit);
router.post('/login',                 login);
router.get('/me',                     protect, getMe);

// Account deletion flow (all require authentication)
router.post('/delete-account/check-password', protect, checkDeletionPassword);
router.post('/delete-account/send-otp',       protect, sendDeletionOTP);
router.post('/delete-account/confirm',        protect, confirmAccountDeletion);
router.post('/delete-account/cancel',         protect, cancelAccountDeletion);

module.exports = router;
