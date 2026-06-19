const Razorpay = require('razorpay');
const crypto = require('crypto');

// Lazy-initialise so missing keys don't crash the server on startup
let _razorpay = null;
const getRazorpay = () => {
  if (!_razorpay) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay keys are not configured (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET)');
    }
    _razorpay = new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return _razorpay;
};

const createOrder = async (amount, currency = 'INR', receipt = '') => {
  return getRazorpay().orders.create({
    amount:   Math.round(amount * 100), // paise
    currency,
    receipt,
    payment_capture: 1,
  });
};

const verifySignature = (orderId, paymentId, signature) => {
  const body = `${orderId}|${paymentId}`;
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');
  return expected === signature;
};

module.exports = { createOrder, verifySignature };
