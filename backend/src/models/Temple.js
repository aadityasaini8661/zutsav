const mongoose = require('mongoose');

const templeSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  address:     { type: String, required: true },
  city:        { type: String, required: true },
  state:       { type: String, required: true },
  pincode:     { type: String },
  description: { type: String },
  images:      [{ type: String }],
  latitude:    { type: Number },
  longitude:   { type: Number },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Temple', templeSchema);
