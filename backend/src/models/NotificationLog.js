const mongoose = require('mongoose');

const notificationLogSchema = new mongoose.Schema(
  {
    type:           { type: String, enum: ['email', 'whatsapp', 'in-app', 'sms'], required: true },
    event:          { type: String, default: 'manual' },
    templateName:   { type: String, default: '' },
    recipientEmail: { type: String, default: '' },
    recipientPhone: { type: String, default: '' },
    recipientId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    recipientName:  { type: String, default: '' },
    subject:        { type: String, default: '' },
    status:         {
      type:    String,
      enum:    ['queued', 'processing', 'delivered', 'failed', 'retrying'],
      default: 'queued',
    },
    response:    { type: mongoose.Schema.Types.Mixed, default: null },
    error:       { type: String, default: '' },
    retryCount:  { type: Number, default: 0 },
    metadata:    { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

// Index for fast dashboard queries
notificationLogSchema.index({ status: 1, createdAt: -1 });
notificationLogSchema.index({ type: 1, createdAt: -1 });
notificationLogSchema.index({ event: 1 });
notificationLogSchema.index({ recipientId: 1 });

module.exports = mongoose.model('NotificationLog', notificationLogSchema);
