const mongoose = require('mongoose');

const festivalSchema = new mongoose.Schema({
  // name is optional — rows with only tithi/panchang data have no festival name
  name:        { type: String, trim: true, default: '' },
  date:        { type: Date,   required: true },
  tithiDate:   { type: String, default: '' },  // e.g. "Shukla Paksha Panchami"
  panchang:    { type: String, default: '' },  // Additional panchang info
  description: { type: String, default: '' },
  hinduMonth:  { type: String, default: '' },  // e.g. "Shravan"
  paksha:      { type: String, default: '' },  // e.g. "Shukla" / "Krishna"
  nakshatra:   { type: String, default: '' },  // from CSV if present
  image:       { type: String },
  vrat:        { type: String, default: '' },   // e.g. "Ekadashi Vrat", "Pradosh Vrat"
  isActive:    { type: Boolean, default: true },
  source:      { type: String, enum: ['manual', 'csv', 'drikpanchang', 'googlesheets'], default: 'manual' },
  // what data this entry actually contains (auto-set on import)
  dataType:    { type: String, enum: ['festival', 'tithi', 'panchang', 'vrat', 'mixed'], default: 'festival' },
  relatedPoojas: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Pooja' }],
}, { timestamps: true });

module.exports = mongoose.model('Festival', festivalSchema);
