const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  phone: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: (v) => /^[6-9]\d{9}$/.test(v),
      message: 'Enter a valid 10-digit Indian mobile number',
    },
  },
  password: { type: String, required: true, minlength: 6, select: false },
  role: { type: String, enum: ['user', 'pandit', 'admin'], default: 'user' },
  profilePhoto: { type: String, default: null },
  pincode: { type: String },
  state:   { type: String },
  city:    { type: String },
  district:{ type: String },
  address: { type: String },
  isActive:      { type: Boolean, default: true },
  referralCode:  { type: String, unique: true, sparse: true },
  referredBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  referralCount: { type: Number, default: 0 },

  // 30-day safe deletion
  accountStatus:         { type: String, enum: ['active', 'deletion_pending'], default: 'active' },
  deletionRequestedAt:   { type: Date, default: null },
  scheduledDeletionDate: { type: Date, default: null },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  if (!this.referralCode) {
    const namePart = this.name.replace(/\s+/g, '').substring(0, 4).toUpperCase();
    const idPart   = this._id.toString().slice(-4).toUpperCase();
    this.referralCode = `${namePart}${idPart}`;
  }
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Never send password
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
