const mongoose = require('mongoose');

const poojaCategorySchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true, unique: true },
  slug:        { type: String, required: true, unique: true, lowercase: true },
  description: { type: String },
  image:       { type: String },
  isActive:    { type: Boolean, default: true },
  sortOrder:   { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('PoojaCategory', poojaCategorySchema);
