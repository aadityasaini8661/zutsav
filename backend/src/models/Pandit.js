const mongoose = require('mongoose');

const availabilitySlotSchema = new mongoose.Schema({
  startDate:   { type: Date, required: true },
  endDate:     { type: Date, required: true },
  daysOfWeek:  [{ type: Number, min: 0, max: 6 }], // 0=Sun … 6=Sat
  timeSlots:   [{ type: String }],                  // e.g. "09:00-10:00"
  isActive:    { type: Boolean, default: true },
}, { _id: true });

const blockedPeriodSchema = new mongoose.Schema({
  startDate: { type: Date, required: true },
  endDate:   { type: Date, required: true },
  title:     { type: String, default: '' },
  reason:    { type: String },
}, { _id: true });

// ── New structured availability schemas ──────────────────────
const timeSlotSchema = new mongoose.Schema({
  start: { type: String, required: true }, // "09:00"
  end:   { type: String, required: true }, // "17:00"
}, { _id: false });

const weeklyDaySchema = new mongoose.Schema({
  dayOfWeek: { type: Number, min: 0, max: 6, required: true }, // 0=Sun … 6=Sat
  enabled:   { type: Boolean, default: true },
  slots:     { type: [timeSlotSchema], default: [] },
}, { _id: false });

const specialDateSchema = new mongoose.Schema({
  date:  { type: Date, required: true },
  type:  { type: String, enum: ['unavailable', 'custom'], default: 'unavailable' },
  slots: { type: [timeSlotSchema], default: [] },
}, { _id: true });

const panditSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

  // Registration details
  name:  { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: {
    type: String, required: true, unique: true,
    validate: { validator: (v) => /^[6-9]\d{9}$/.test(v), message: 'Invalid mobile number' },
  },

  // Location
  pincode:  { type: String },
  state:    { type: String },
  city:     { type: String },
  district: { type: String },
  address:  { type: String },

  // Govt ID (legacy — filled during old registration flow)
  govtIdType:   { type: String, enum: ['aadhaar', 'pan', 'voter', 'passport', 'driving'], default: null },
  govtIdImage:  { type: String, default: null },       // file path
  govtIdNumber: { type: String },

  // KYC Verification (new dashboard flow)
  kycStatus: {
    type: String,
    enum: ['not_submitted', 'submitted', 'approved', 'rejected', 'reupload_required'],
    default: 'not_submitted',
  },
  kycFrontImage:      { type: String, default: null },
  kycBackImage:       { type: String, default: null },
  kycSelfieImage:     { type: String, default: null },
  kycAddressProof:    { type: String, default: null },
  kycRejectionReason: { type: String, default: '' },
  kycAdminNote:       { type: String, default: '' },
  kycSubmittedAt:     { type: Date },
  kycReviewedAt:      { type: Date },
  canReceiveBookings: { type: Boolean, default: false },

  // Personal info
  gender: { type: String, enum: ['male', 'female', 'other'], default: null },
  dob:    { type: Date, default: null },

  // Bank details for payouts
  bankDetails: {
    accountHolderName: { type: String, default: '' },
    accountNumber:     { type: String, default: '' },
    ifscCode:          { type: String, default: '' },
    bankName:          { type: String, default: '' },
  },

  // Extended personal info
  fatherName: { type: String, trim: true, default: '' },
  latitude:   { type: Number, default: null },
  longitude:  { type: Number, default: null },

  // Qualifications / Education
  qualifications: [{
    category:             { type: String, default: '' },  // predefined or 'Others'
    customName:           { type: String, default: '' },
    description:          { type: String, default: '' },
    certificationDetails: { type: String, default: '' },
    institution:          { type: String, default: '' },
    passingYear:          { type: Number },
  }],

  // Family
  familyInfo: {
    maritalStatus: { type: String, enum: ['', 'single', 'married', 'widowed', 'divorced'], default: '' },
    spouseName:    { type: String, default: '' },
    children:      { type: Number, default: 0, min: 0 },
    members: [{
      name:     { type: String },
      relation: { type: String },
      age:      { type: Number, min: 0 },
    }],
  },

  // UPI
  upiDetails: {
    upiId:        { type: String, default: '' },
    verifiedName: { type: String, default: '' },
    bankName:     { type: String, default: '' },
    isVerified:   { type: Boolean, default: false },
  },

  // Poojas from admin catalog that this pandit offers
  selectedPoojas: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Pooja' }],

  // Expected charges per pooja (separate from selectedPoojas for backward compat)
  poojaCharges: [{
    poojaId:         { type: mongoose.Schema.Types.ObjectId, ref: 'Pooja' },
    expectedCharges: { type: Number, default: 0, min: 0 },
  }],

  // Profile
  profilePhoto:    { type: String, default: null },
  bio:             { type: String },
  experience:      { type: Number, default: 0 },
  specializations: [{
    name:              { type: String, default: '' },
    yearsOfExperience: { type: Number, default: 0, min: 0 },
  }],
  languages:       [{ type: String }],

  // Status set by admin
  status: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected', 'suspended', 'reupload_required'],
    default: 'pending',
  },
  adminNote: { type: String },

  // ── Legacy availability (preserved, not removed) ────────────
  availabilitySlots: [availabilitySlotSchema],
  blockedPeriods:    [blockedPeriodSchema],   // also used as leaves/vacations

  // ── Structured availability (new system) ────────────────────
  weeklySchedule:         { type: [weeklyDaySchema], default: [] },
  specialDates:           { type: [specialDateSchema], default: [] },
  isAvailableForBookings: { type: Boolean, default: true },

  // Service coverage area (for location-based assignment)
  serviceCoverage: {
    type:     { type: String, enum: ['radius', 'city', 'district', 'state', 'pan_india'], default: 'city' },
    radiusKm: { type: Number, default: 25, min: 1 },
  },

  // Online status (toggled from dashboard)
  isOnline:    { type: Boolean, default: false },

  // Stats
  rating:       { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  totalBookings:{ type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Pandit', panditSchema);
