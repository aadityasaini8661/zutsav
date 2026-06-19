const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingNumber: { type: String, unique: true },

  // Relations
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },
  poojaId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Pooja',  required: true },
  panditId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pandit', default: null },

  // User details at time of booking
  userDetails: {
    name:      { type: String, required: true },
    phone:     { type: String, required: true },
    email:     { type: String },
    address:   { type: String, required: true },
    pincode:   { type: String, required: true },
    state:     { type: String },
    city:      { type: String },
    district:  { type: String },
  },

  // Schedule
  scheduledDate: { type: Date, required: true },
  scheduledTime: { type: String, required: true },
  language:      { type: String, default: 'Hindi' },
  specialNote:   { type: String },

  // Payment
  amount:              { type: Number, required: true },
  paymentProvider:     { type: String, enum: ['razorpay', 'phonepe'], default: 'phonepe' },
  // Razorpay (legacy)
  razorpayOrderId:     { type: String },
  razorpayPaymentId:   { type: String },
  razorpaySignature:   { type: String },
  // PhonePe
  phonePeMerchantTransactionId: { type: String },
  phonePeTransactionId:         { type: String },

  // Status flow: pending_payment → paid → pandit_assigned → pandit_accepted → completion_requested → completed / cancelled
  //              pandit_assigned → pandit_rejected → pending_reassignment → pandit_assigned (reassigned)
  status: {
    type: String,
    enum: [
      'pending_payment', 'paid',
      'pandit_assigned', 'pandit_accepted',
      'pending_reassignment',
      'completion_requested', 'completed', 'cancelled',
    ],
    default: 'pending_payment',
  },

  // Pandits who rejected this booking (excluded from reassignment list)
  panditRejections: [{
    panditId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Pandit' },
    panditName: { type: String },
    reason:     { type: String },
    rejectedAt: { type: Date, default: Date.now },
  }],

  // Admin-negotiated fare (stored before assignment; never shown to user or pandit)
  panditFareAmount: { type: Number, default: null },

  // Completion timestamps
  completedAt:    { type: Date },
  verifiedAt:     { type: Date },
  verifiedByName: { type: String },

  // User rating after completion
  rating:     { type: Number, min: 1, max: 5, default: null },
  review:     { type: String, default: '' },
  ratingDate: { type: Date },

  // WhatsApp notification sent flag
  whatsappNotified: { type: Boolean, default: false },
  panditAssignedAt: { type: Date },
  cancelReason:     { type: String },

  // Audit trail for all status transitions and admin actions
  auditLog: [{
    action:          { type: String },
    performedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    performedByName: { type: String },
    note:            { type: String },
    at:              { type: Date, default: Date.now },
  }],

  // Pandit payout (filled only after booking is completed)
  payout: {
    amount:         { type: Number, default: 0 },
    status:         { type: String, enum: ['none', 'pending', 'completed'], default: 'none' },
    paidAt:         { type: Date },
    transactionRef: { type: String },
    assignedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedByName: { type: String },
  },
}, { timestamps: true });

// Auto-generate booking number
bookingSchema.pre('save', async function (next) {
  if (!this.bookingNumber) {
    const count = await this.constructor.countDocuments();
    this.bookingNumber = `ZUT${Date.now().toString().slice(-6)}${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
