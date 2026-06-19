const mongoose = require('mongoose');

const waTemplateSchema = new mongoose.Schema(
  {
    name:            { type: String, required: true, trim: true },
    metaId:          { type: String, default: '' },
    language:        { type: String, default: 'en' },
    category:        {
      type: String,
      enum: ['MARKETING', 'UTILITY', 'AUTHENTICATION'],
      default: 'UTILITY',
    },
    status: {
      type: String,
      enum: ['APPROVED', 'PENDING', 'REJECTED', 'PAUSED', 'DISABLED'],
      default: 'PENDING',
    },
    components:       { type: mongoose.Schema.Types.Mixed, default: [] },
    assignedTrigger:  { type: String, default: '' },
    isActive:         { type: Boolean, default: true },
    syncedAt:         { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WhatsAppTemplate', waTemplateSchema);
