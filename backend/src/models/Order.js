const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name:      { type: String, required: true },
  price:     { type: Number, required: true },
  quantity:  { type: Number, required: true, min: 1 },
  total:     { type: Number, required: true },
}, { _id: false });

const timelineEntrySchema = new mongoose.Schema({
  status:    { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  note:      { type: String, default: '' },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items:       [orderItemSchema],
  totalAmount: { type: Number, required: true },

  shippingAddress: {
    name:     { type: String, required: true },
    phone:    { type: String, required: true },
    address:  { type: String, required: true },
    pincode:  { type: String, required: true },
    state:    { type: String },
    city:     { type: String },
    district: { type: String },
  },

  status: {
    type: String,
    enum: [
      'pending_payment',
      'paid',          // payment received — order placed
      'confirmed',     // admin confirmed
      'packed',        // packed & ready to ship
      'shipped',       // handed to courier
      'out_for_delivery',
      'delivered',
      'cancelled',
      'refunded',
      'payment_failed',
      'processing',    // legacy alias for confirmed
    ],
    default: 'pending_payment',
  },

  statusTimeline: [timelineEntrySchema],

  cancelReason:  { type: String },
  refundStatus:  { type: String, enum: ['none', 'requested', 'processed'], default: 'none' },

  paymentProvider:              { type: String, enum: ['phonepe', 'razorpay'], default: 'phonepe' },
  phonePeMerchantTransactionId: { type: String },
  phonePeTransactionId:         { type: String },
  // Legacy Razorpay fields — kept for old records
  razorpayOrderId:              { type: String },
  razorpayPaymentId:            { type: String },
  razorpaySignature:            { type: String },

  trackingId: { type: String },
  courier:    { type: String },
}, { timestamps: true });

orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const count = await this.constructor.countDocuments();
    this.orderNumber = `ZOM${Date.now().toString().slice(-6)}${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
