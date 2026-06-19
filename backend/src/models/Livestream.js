const mongoose = require('mongoose');

const livestreamSchema = new mongoose.Schema({
  templeId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Temple', required: true },
  title:       { type: String, required: true, trim: true },
  description: { type: String },
  youtubeUrl:  { type: String, required: true },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Livestream', livestreamSchema);
