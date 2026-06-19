const mongoose = require('mongoose');

const educationMasterSchema = new mongoose.Schema({
  name:        { type: String, required: true, unique: true, trim: true },
  isActive:    { type: Boolean, default: true },
  allowCustom: { type: Boolean, default: false }, // if true, show custom text entry for "Others"
  sortOrder:   { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('EducationMaster', educationMasterSchema);
