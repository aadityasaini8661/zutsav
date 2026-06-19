const mongoose = require('mongoose');

const syncLogSchema = new mongoose.Schema({
  month:           { type: Number, required: true },  // 1-12
  year:            { type: Number, required: true },
  startTime:       { type: Date },
  endTime:         { type: Date },
  recordsImported: { type: Number, default: 0 },
  recordsUpdated:  { type: Number, default: 0 },
  recordsSkipped:  { type: Number, default: 0 },
  status:          { type: String, enum: ['success', 'failed', 'partial'], default: 'success' },
  error:           { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('SyncLog', syncLogSchema);
