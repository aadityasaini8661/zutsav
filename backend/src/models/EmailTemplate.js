const mongoose = require('mongoose');

const emailTemplateSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    slug:        { type: String, required: true, unique: true, lowercase: true, trim: true },
    subject:     { type: String, required: true, trim: true },
    htmlContent: { type: String, required: true },
    variables:   { type: [String], default: [] }, // e.g. ['user.name', 'booking.id']
    description: { type: String, default: '' },
    isActive:    { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('EmailTemplate', emailTemplateSchema);
