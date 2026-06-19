const router = require('express').Router();
const ctrl   = require('../controllers/booking.controller');
const { protect } = require('../middleware/auth');

// Webhook does not require auth (called by PhonePe server)
router.post('/phonepe-webhook', ctrl.phonePeWebhook);

router.use(protect);

router.post('/create-order',           ctrl.createBookingOrder);
router.post('/verify-payment',         ctrl.verifyPayment);
router.post('/create-phonepe-order',   ctrl.createPhonePeBooking);
router.get('/verify-phonepe/:merchantTransactionId', ctrl.verifyPhonePePayment);
router.get('/my',                      ctrl.getMyBookings);
router.post('/:id/rate',               ctrl.rateBooking);
router.get('/:id',                     ctrl.getBookingById);

module.exports = router;
