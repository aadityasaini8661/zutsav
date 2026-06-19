const router   = require('express').Router();
const ctrl     = require('../controllers/marketplace.controller');
const kitCtrl  = require('../controllers/kit.controller');
const { protect, authorize } = require('../middleware/auth');
const { uploadProducts, uploadProfile } = require('../middleware/upload');

// ─── Products ─────────────────────────────────────────────────
// Public
router.get('/products',         ctrl.getProducts);
router.get('/products/:slug',   ctrl.getProductBySlug);

// User
router.post('/orders/create',                                   protect, ctrl.createOrder);
router.get('/orders/verify-phonepe/:merchantTransactionId',     protect, ctrl.verifyPhonePeOrder);
router.get('/orders/my',                                        protect, ctrl.getMyOrders);
// Legacy Razorpay (returns 410 Gone)
router.post('/orders/verify',                                   protect, ctrl.verifyOrder);
// PhonePe webhook (public, no auth)
router.post('/orders/phonepe-webhook',                          ctrl.phonePeWebhook);

// Admin
router.post('/products',        protect, authorize('admin'), uploadProducts.array('images', 5), ctrl.createProduct);
router.patch('/products/:id',   protect, authorize('admin'), uploadProducts.array('images', 5), ctrl.updateProduct);

// ─── Kits (admin-only create/edit, public view) ────────────────
router.get('/kits',               kitCtrl.getKits);
router.get('/kits/:id',           kitCtrl.getKit);
router.post('/kits/compute-price',protect, authorize('admin'), kitCtrl.computePrice);
router.post('/kits',              protect, authorize('admin'), uploadProfile.single('image'), kitCtrl.createKit);
router.patch('/kits/:id',         protect, authorize('admin'), uploadProfile.single('image'), kitCtrl.updateKit);
router.delete('/kits/:id',        protect, authorize('admin'), kitCtrl.deleteKit);

module.exports = router;
