const mongoose = require('mongoose');

const kitItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity:  { type: Number, required: true, min: 1 },
}, { _id: false });

const kitSchema = new mongoose.Schema({
  name:          { type: String, required: true, trim: true },
  slug:          { type: String, required: true, unique: true, lowercase: true },
  description:   { type: String },
  image:         { type: String },
  items:         { type: [kitItemSchema], validate: [(v) => v.length > 0, 'Kit must have at least one item'] },
  totalCost:     { type: Number, default: 0 },         // auto-calculated sum of product prices × qty
  discountType:  { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
  discountValue: { type: Number, default: 0, min: 0 },
  discountPrice: { type: Number, required: true, min: 0 }, // final selling price
  isActive:      { type: Boolean, default: true },
  isFeatured:    { type: Boolean, default: false },
}, { timestamps: true, toJSON: { virtuals: true } });

module.exports = mongoose.model('Kit', kitSchema);
