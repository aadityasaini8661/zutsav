const Notification = require('../models/Notification');

let _io = null;

const setIO = (io) => { _io = io; };

/**
 * Create a notification and emit it via Socket.IO to the target user.
 */
const createNotification = async ({ userId, type, title, message, data = {} }) => {
  try {
    const notification = await Notification.create({ userId, type, title, message, data });
    if (_io) {
      _io.to(`user_${userId.toString()}`).emit('new_notification', {
        _id:       notification._id,
        type:      notification.type,
        title:     notification.title,
        message:   notification.message,
        data:      notification.data,
        isRead:    false,
        createdAt: notification.createdAt,
      });
    }
    return notification;
  } catch (err) {
    console.error('[Notification] create error:', err.message);
  }
};

// ── Typed helpers ────────────────────────────────────────────────

const notifyUserRegistered = (userId, name) =>
  createNotification({
    userId,
    type:    'user_registered',
    title:   'Welcome to Zutsav!',
    message: `Welcome, ${name}! Your account has been created successfully.`,
  });

const notifyPanditRegistered = (adminUserIds, panditName) =>
  Promise.all(
    adminUserIds.map((uid) =>
      createNotification({
        userId:  uid,
        type:    'pandit_registered',
        title:   'New Pandit Application',
        message: `${panditName} has submitted a pandit registration application.`,
      })
    )
  );

const notifyPanditApproved = (userId) =>
  createNotification({
    userId,
    type:    'pandit_approved',
    title:   'Application Approved!',
    message: 'Congratulations! Your pandit application has been approved. You can now accept bookings.',
  });

const notifyBookingCreated = (userId, bookingNumber, poojaName) =>
  createNotification({
    userId,
    type:    'booking_created',
    title:   'Booking Confirmed',
    message: `Your booking #${bookingNumber} for ${poojaName} has been confirmed.`,
    data:    { bookingNumber },
  });

const notifyPanditAssignedToUser = (userId, panditName, bookingNumber) =>
  createNotification({
    userId,
    type:    'pandit_assigned',
    title:   'Pandit Assigned',
    message: `${panditName} has been assigned to your booking #${bookingNumber}.`,
    data:    { bookingNumber },
  });

const notifyPanditNewBooking = (panditUserId, bookingNumber, poojaName) =>
  createNotification({
    userId:  panditUserId,
    type:    'new_booking',
    title:   'New Booking Assigned',
    message: `You have been assigned booking #${bookingNumber} for ${poojaName}.`,
    data:    { bookingNumber },
  });

const notifyBookingCompleted = (userId, bookingNumber) =>
  createNotification({
    userId,
    type:    'booking_completed',
    title:   'Booking Completed',
    message: `Your booking #${bookingNumber} has been marked as completed. Thank you!`,
    data:    { bookingNumber },
  });

const notifyOrderPlaced = (userId, orderNumber) =>
  createNotification({
    userId,
    type:    'order_placed',
    title:   'Order Placed',
    message: `Your order #${orderNumber} has been placed successfully.`,
    data:    { orderNumber },
  });

const notifyOrderConfirmed = (userId, orderNumber) =>
  createNotification({
    userId,
    type:    'order_confirmed',
    title:   'Order Confirmed',
    message: `Your order #${orderNumber} has been confirmed and is being prepared.`,
    data:    { orderNumber },
  });

const notifyOrderPacked = (userId, orderNumber) =>
  createNotification({
    userId,
    type:    'order_packed',
    title:   'Order Packed',
    message: `Your order #${orderNumber} has been packed and is ready for dispatch.`,
    data:    { orderNumber },
  });

const notifyOrderShipped = (userId, orderNumber, trackingId, courier) =>
  createNotification({
    userId,
    type:    'order_shipped',
    title:   'Order Shipped',
    message: `Your order #${orderNumber} has been shipped via ${courier || 'courier'}.${trackingId ? ` Tracking: ${trackingId}.` : ''}`,
    data:    { orderNumber, trackingId, courier },
  });

const notifyOrderOutForDelivery = (userId, orderNumber) =>
  createNotification({
    userId,
    type:    'order_out_for_delivery',
    title:   'Out for Delivery',
    message: `Your order #${orderNumber} is out for delivery. Expect it today!`,
    data:    { orderNumber },
  });

const notifyOrderDelivered = (userId, orderNumber) =>
  createNotification({
    userId,
    type:    'order_delivered',
    title:   'Order Delivered',
    message: `Your order #${orderNumber} has been delivered. Thank you for shopping with Zutsav!`,
    data:    { orderNumber },
  });

const notifyOrderCancelled = (userId, orderNumber, reason) =>
  createNotification({
    userId,
    type:    'order_cancelled',
    title:   'Order Cancelled',
    message: `Your order #${orderNumber} has been cancelled.${reason ? ` Reason: ${reason}` : ''}`,
    data:    { orderNumber },
  });

const notifyOrderRefunded = (userId, orderNumber) =>
  createNotification({
    userId,
    type:    'order_refunded',
    title:   'Refund Processed',
    message: `The refund for your order #${orderNumber} has been processed and will reflect in 5–7 business days.`,
    data:    { orderNumber },
  });

const notifyOTPSent = (userId, channel) =>
  createNotification({
    userId,
    type:    'otp_sent',
    title:   'OTP Sent',
    message: `An OTP has been sent to your ${channel === 'email' ? 'email' : 'WhatsApp'}.`,
  });

// ── Pandit accept / reject workflow ─────────────────────────────

const notifyPanditAssignmentPending = (panditUserId, bookingNumber, poojaName) =>
  createNotification({
    userId:  panditUserId,
    type:    'booking_assignment_pending',
    title:   'New Booking — Action Required',
    message: `Booking #${bookingNumber} for ${poojaName} has been assigned to you. Please accept or reject this booking from your dashboard.`,
    data:    { bookingNumber },
  });

const notifyUserPanditAccepted = (userId, panditName, bookingNumber) =>
  createNotification({
    userId,
    type:    'pandit_accepted',
    title:   'Pandit Confirmed',
    message: `${panditName} has accepted your booking #${bookingNumber} and will be with you on the scheduled date.`,
    data:    { bookingNumber },
  });

const notifyAdminPanditAccepted = (adminUserId, panditName, bookingNumber) =>
  createNotification({
    userId:  adminUserId,
    type:    'pandit_accepted',
    title:   'Pandit Accepted Booking',
    message: `${panditName} has accepted booking #${bookingNumber}.`,
    data:    { bookingNumber },
  });

const notifyAdminPanditRejected = (adminUserId, panditName, bookingNumber, reason) =>
  createNotification({
    userId:  adminUserId,
    type:    'pandit_rejected',
    title:   'Pandit Rejected — Reassignment Needed',
    message: `${panditName} has rejected booking #${bookingNumber}. Reason: ${reason}. Please assign another pandit.`,
    data:    { bookingNumber, reason },
  });

// ── KYC workflow notifications ───────────────────────────────────

const notifyKYCSubmitted = (adminUserId, panditName) =>
  createNotification({
    userId:  adminUserId,
    type:    'kyc_submitted',
    title:   'KYC Documents Submitted',
    message: `${panditName} has submitted KYC documents for verification. Please review and approve.`,
  });

const notifyKYCApproved = (panditUserId) =>
  createNotification({
    userId:  panditUserId,
    type:    'kyc_approved',
    title:   'KYC Approved! Congratulations!',
    message: 'Your KYC has been verified successfully. You can now receive and accept bookings from Zutsav.',
  });

const notifyKYCRejected = (panditUserId, reason) =>
  createNotification({
    userId:  panditUserId,
    type:    'kyc_rejected',
    title:   'KYC Verification Rejected',
    message: `Your KYC verification was rejected. Reason: ${reason || 'Please contact support'}. Re-upload your documents from the dashboard.`,
    data:    { reason },
  });

const notifyKYCReuploadRequired = (panditUserId, reason) =>
  createNotification({
    userId:  panditUserId,
    type:    'kyc_reupload',
    title:   'KYC Re-upload Required',
    message: `Additional document verification is required. Reason: ${reason || 'Please re-upload your documents from the dashboard.'}`,
    data:    { reason },
  });

// ── Account deletion workflow ────────────────────────────────────

const notifyDeletionRequested = (userId, scheduledDate) =>
  createNotification({
    userId,
    type:    'deletion_requested',
    title:   'Account Deletion Requested',
    message: `Your account has been scheduled for permanent deletion on ${new Date(scheduledDate).toLocaleDateString('en-IN')}. Sign in before that date to cancel.`,
    data:    { scheduledDate },
  });

const notifyDeletionCancelled = (userId) =>
  createNotification({
    userId,
    type:    'deletion_cancelled',
    title:   'Account Deletion Cancelled',
    message: 'Your account deletion request has been cancelled. Your account is fully active again.',
  });

const notifyAccountRestored = (userId) =>
  createNotification({
    userId,
    type:    'account_restored',
    title:   'Welcome Back! Account Restored',
    message: 'Your account has been successfully restored. No data was deleted. Namaste!',
  });

module.exports = {
  setIO,
  createNotification,
  notifyUserRegistered,
  notifyPanditRegistered,
  notifyPanditApproved,
  notifyBookingCreated,
  notifyPanditAssignedToUser,
  notifyPanditNewBooking,
  notifyBookingCompleted,
  notifyOrderPlaced,
  notifyOrderConfirmed,
  notifyOrderPacked,
  notifyOrderShipped,
  notifyOrderOutForDelivery,
  notifyOrderDelivered,
  notifyOrderCancelled,
  notifyOrderRefunded,
  notifyOTPSent,
  notifyPanditAssignmentPending,
  notifyUserPanditAccepted,
  notifyAdminPanditAccepted,
  notifyAdminPanditRejected,
  notifyKYCSubmitted,
  notifyKYCApproved,
  notifyKYCRejected,
  notifyKYCReuploadRequired,
  notifyDeletionRequested,
  notifyDeletionCancelled,
  notifyAccountRestored,
};
