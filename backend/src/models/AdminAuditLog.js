const mongoose = require('mongoose');

const adminAuditLogSchema = new mongoose.Schema({
  action:          { type: String, required: true },           // e.g. 'delete_pandit'
  performedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  performedByName: { type: String, default: '' },
  targetId:        { type: mongoose.Schema.Types.ObjectId },   // ID of deleted/modified entity
  targetType:      { type: String, default: '' },              // 'pandit', 'user', etc.
  targetName:      { type: String, default: '' },
  targetEmail:     { type: String, default: '' },
  targetPhone:     { type: String, default: '' },
  note:            { type: String, default: '' },              // optional reason
}, { timestamps: true });

module.exports = mongoose.model('AdminAuditLog', adminAuditLogSchema);
