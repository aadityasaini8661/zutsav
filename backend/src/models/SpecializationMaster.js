const mongoose = require('mongoose');

const specializationMasterSchema = new mongoose.Schema({
  name:      { type: String, required: true, unique: true, trim: true },
  isActive:  { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('SpecializationMaster', specializationMasterSchema);
