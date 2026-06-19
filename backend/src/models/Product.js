const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  slug:        { type: String, required: true, unique: true, lowercase: true },
  category:    { type: String, required: true, enum: ['samagri', 'rudraksha', 'yantra', 'incense', 'idol', 'other'] },
  description: { type: String },
  price:       { type: Number, required: true, min: 0 },
  salePrice:   { type: Number, default: null },
  stock:       { type: Number, default: 0 },
  images:      [{ type: String }],
  isActive:    { type: Boolean, default: true },
  isFeatured:  { type: Boolean, default: false },
  tags:        [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
