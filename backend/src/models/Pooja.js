const mongoose = require('mongoose');

const poojaSchema = new mongoose.Schema({
  categoryId:  { type: mongoose.Schema.Types.ObjectId, ref: 'PoojaCategory', required: true },
  name:        { type: String, required: true, trim: true },
  slug:        { type: String, required: true, unique: true, lowercase: true },
  description: { type: String },
  shortDesc:   { type: String },
  price:       { type: Number, required: true, min: 0 },
  duration:    { type: String },            // e.g. "2 hours"
  image:       { type: String },
  gallery:     [{ type: String }],
  requirements:[{ type: String }],          // samagri list
  benefits:    [{ type: String }],
  languages:   [{ type: String }],
  isActive:    { type: Boolean, default: true },
  isFeatured:  { type: Boolean, default: false },
  rating:      { type: Number, default: 0 },
  totalBookings:{ type: Number, default: 0 },

  // Pandit-created pooja support
  createdByRole:  { type: String, enum: ['admin', 'pandit'], default: 'admin' },
  panditId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Pandit', default: null },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'inactive'],
    default: 'approved', // existing admin poojas remain visible
  },
  adminNote: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Pooja', poojaSchema);
