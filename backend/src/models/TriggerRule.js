const mongoose = require('mongoose');

const EVENTS = [
  // Auth
  { value: 'user_registered',    label: 'User Registered',      category: 'Auth'        },
  { value: 'otp_verification',   label: 'OTP Verification',     category: 'Auth'        },
  { value: 'login_alert',        label: 'Login Alert',          category: 'Auth'        },
  { value: 'password_reset',     label: 'Password Reset',       category: 'Auth'        },
  // Booking
  { value: 'booking_created',    label: 'Booking Created',      category: 'Booking'     },
  { value: 'booking_confirmed',  label: 'Booking Confirmed',    category: 'Booking'     },
  { value: 'pandit_assigned',    label: 'Pandit Assigned',      category: 'Booking'     },
  { value: 'pandit_changed',     label: 'Pandit Changed',       category: 'Booking'     },
  { value: 'booking_started',    label: 'Booking Started',      category: 'Booking'     },
  { value: 'booking_completed',  label: 'Booking Completed',    category: 'Booking'     },
  { value: 'booking_cancelled',  label: 'Booking Cancelled',    category: 'Booking'     },
  { value: 'booking_refunded',   label: 'Booking Refunded',     category: 'Booking'     },
  // Marketplace
  { value: 'order_placed',       label: 'Order Placed',         category: 'Marketplace' },
  { value: 'order_confirmed',    label: 'Order Confirmed',      category: 'Marketplace' },
  { value: 'order_packed',       label: 'Order Packed',         category: 'Marketplace' },
  { value: 'order_shipped',      label: 'Order Shipped',        category: 'Marketplace' },
  { value: 'order_delivered',    label: 'Order Delivered',      category: 'Marketplace' },
  { value: 'order_cancelled',    label: 'Order Cancelled',      category: 'Marketplace' },
  { value: 'return_requested',   label: 'Return Requested',     category: 'Marketplace' },
  { value: 'refund_completed',   label: 'Refund Completed',     category: 'Marketplace' },
  // Pandit
  { value: 'pandit_registered',  label: 'Pandit Registered',    category: 'Pandit'      },
  { value: 'kyc_approved',       label: 'KYC Approved',         category: 'Pandit'      },
  { value: 'kyc_rejected',       label: 'KYC Rejected',         category: 'Pandit'      },
  { value: 'profile_approved',   label: 'Profile Approved',     category: 'Pandit'      },
  { value: 'pooja_approved',     label: 'Pooja Approved',       category: 'Pandit'      },
  { value: 'pooja_rejected',     label: 'Pooja Rejected',       category: 'Pandit'      },
];

const EVENT_VALUES = EVENTS.map((e) => e.value);

const channelSchema = new mongoose.Schema({
  type:               { type: String, enum: ['email', 'whatsapp', 'in-app'], required: true },
  recipient:          { type: String, enum: ['user', 'pandit', 'admin', 'both'], default: 'user' },
  emailTemplateId:    { type: mongoose.Schema.Types.ObjectId, ref: 'EmailTemplate', default: null },
  whatsAppTemplateName: { type: String, default: '' },
  isActive:           { type: Boolean, default: true },
}, { _id: false });

const triggerRuleSchema = new mongoose.Schema(
  {
    event:       { type: String, enum: EVENT_VALUES, required: true, unique: true },
    label:       { type: String, required: true },
    channels:    { type: [channelSchema], default: [] },
    isActive:    { type: Boolean, default: true },
    description: { type: String, default: '' },
  },
  { timestamps: true }
);

const TriggerRule = mongoose.model('TriggerRule', triggerRuleSchema);

module.exports = TriggerRule;
module.exports.EVENTS = EVENTS;
module.exports.EVENT_VALUES = EVENT_VALUES;
