const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const User   = require('../models/User');
const Pandit = require('../models/Pandit');
const OTP    = require('../models/OTP');
const Booking       = require('../models/Booking');
const Order         = require('../models/Order');
const Notification  = require('../models/Notification');
const AdminAuditLog = require('../models/AdminAuditLog');
const { sendEmail }        = require('../utils/email');
const { sendWhatsAppText }  = require('../utils/whatsapp');
const {
  notifyUserRegistered,
  notifyDeletionRequested,
  notifyDeletionCancelled,
  notifyAccountRestored,
} = require('../utils/notificationService');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const sendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  res.status(statusCode).json({ success: true, token, user });
};

const generateOTP = () => String(Math.floor(100000 + Math.random() * 900000));

// ── POST /api/auth/send-otp ──────────────────────────────────────────────────
exports.sendOTP = async (req, res, next) => {
  try {
    const { name, email, phone, channel } = req.body;

    if (!phone || !email || !name) {
      return res.status(400).json({ success: false, message: 'Name, email, and phone are required' });
    }
    if (!['email', 'whatsapp'].includes(channel)) {
      return res.status(400).json({ success: false, message: 'Channel must be email or whatsapp' });
    }

    // Check uniqueness
    if (await User.findOne({ phone })) {
      return res.status(400).json({ success: false, message: 'Phone number already registered' });
    }
    if (await User.findOne({ email: email.toLowerCase() })) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const identifier = channel === 'email' ? email.toLowerCase() : phone;
    const otp        = generateOTP();

    // Remove any existing OTP for this identifier/purpose
    await OTP.deleteMany({ identifier, purpose: 'registration' });

    await OTP.create({ identifier, channel, otp, purpose: 'registration' });

    // Send OTP
    if (channel === 'email') {
      await sendEmail(
        email,
        'Your Zutsav OTP Code',
        `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#b91c1c">🪔 Zutsav — Verify Your Account</h2>
          <p>Namaste <strong>${name}</strong>,</p>
          <p>Your OTP code for account verification is:</p>
          <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#d97706;text-align:center;padding:20px;background:#fef3c7;border-radius:12px;margin:20px 0">${otp}</div>
          <p style="color:#6b7280;font-size:14px">This code is valid for <strong>10 minutes</strong>. Do not share it with anyone.</p>
          <p style="color:#b91c1c">🙏 Team Zutsav</p>
        </div>`
      );
    } else {
      await sendWhatsAppText(
        phone,
        `🙏 *Zutsav — OTP Verification*\n\nNamaste ${name}!\n\nYour OTP code is: *${otp}*\n\nValid for 10 minutes. Do not share this code.\n\n🙏 Team Zutsav`
      );
    }

    res.json({ success: true, message: `OTP sent to your ${channel === 'email' ? 'email' : 'WhatsApp'}` });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/verify-otp ────────────────────────────────────────────────
exports.verifyOTP = async (req, res, next) => {
  try {
    const { identifier, otp, purpose = 'registration' } = req.body;

    if (!identifier || !otp) {
      return res.status(400).json({ success: false, message: 'Identifier and OTP are required' });
    }

    const record = await OTP.findOne({ identifier, purpose });
    if (!record) {
      return res.status(400).json({ success: false, message: 'OTP expired or not found. Request a new OTP.' });
    }

    // Limit brute-force
    if (record.attempts >= 5) {
      await OTP.deleteOne({ _id: record._id });
      return res.status(400).json({ success: false, message: 'Too many attempts. Please request a new OTP.' });
    }

    if (record.otp !== otp.trim()) {
      await OTP.findByIdAndUpdate(record._id, { $inc: { attempts: 1 } });
      return res.status(400).json({ success: false, message: 'Invalid OTP. Please try again.' });
    }

    // Mark as verified
    await OTP.findByIdAndUpdate(record._id, { verified: true });

    res.json({ success: true, message: 'OTP verified successfully' });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/complete-registration ─────────────────────────────────────
// OTP-verified registration: name, email, phone, password, channel, referralCode, role
exports.completeRegistration = async (req, res, next) => {
  try {
    const { name, email, phone, password, channel, referralCode, role } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Verify the OTP was completed
    const identifier = channel === 'email' ? email.toLowerCase() : phone;
    const otpRecord  = await OTP.findOne({ identifier, purpose: 'registration', verified: true });
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'OTP verification required. Please verify your OTP first.' });
    }

    // Uniqueness guards
    if (await User.findOne({ phone })) {
      return res.status(400).json({ success: false, message: 'Phone number already registered' });
    }
    if (await User.findOne({ email: email.toLowerCase() })) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const isPandit = role === 'pandit';

    let referredBy = null;
    if (referralCode && !isPandit) {
      const referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
      if (referrer) referredBy = referrer._id;
    }

    const user = await User.create({
      name, email: email.toLowerCase(), phone, password,
      role: isPandit ? 'pandit' : 'user',
      referredBy,
    });

    if (referredBy) {
      await User.findByIdAndUpdate(referredBy, { $inc: { referralCount: 1 } });
    }

    // For pandits: create minimal Pandit profile for dashboard access
    if (isPandit) {
      // Check pandit-level uniqueness (separate collection)
      const panditEmailExists = await Pandit.findOne({ email: email.toLowerCase() });
      if (panditEmailExists) {
        await User.findByIdAndDelete(user._id);
        return res.status(400).json({ success: false, message: 'Email already registered as pandit' });
      }
      const panditPhoneExists = await Pandit.findOne({ phone });
      if (panditPhoneExists) {
        await User.findByIdAndDelete(user._id);
        return res.status(400).json({ success: false, message: 'Phone already registered as pandit' });
      }

      await Pandit.create({
        userId:             user._id,
        name,
        phone,
        email:              email.toLowerCase(),
        status:             'approved',   // immediate dashboard access
        kycStatus:          'not_submitted',
        canReceiveBookings: false,
      });
    }

    // Clean up OTP record
    await OTP.deleteOne({ _id: otpRecord._id });

    // Welcome notification
    notifyUserRegistered(user._id, user.name).catch(() => {});

    sendToken(user, 201, res);
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/register (legacy — kept for backward compat / seeding) ────
exports.register = async (req, res, next) => {
  try {
    const { name, email, phone, password, role, referralCode } = req.body;

    if (email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) return res.status(400).json({ success: false, message: 'Email already in use' });
    }

    const phoneExists = await User.findOne({ phone });
    if (phoneExists) return res.status(400).json({ success: false, message: 'Phone number already registered' });

    let referredBy = null;
    if (referralCode) {
      const referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
      if (referrer) referredBy = referrer._id;
    }

    const user = await User.create({
      name, email, phone, password,
      role:      role === 'admin' ? 'user' : (role || 'user'),
      referredBy,
    });

    if (referredBy) {
      await User.findByIdAndUpdate(referredBy, { $inc: { referralCount: 1 } });
    }

    sendToken(user, 201, res);
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/login ──────────────────────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const { emailOrPhone, password } = req.body;
    if (!emailOrPhone || !password)
      return res.status(400).json({ success: false, message: 'Please provide email/phone and password' });

    const isPhone = /^[6-9]\d{9}$/.test(emailOrPhone);
    const query   = isPhone ? { phone: emailOrPhone } : { email: emailOrPhone.toLowerCase() };

    const user = await User.findOne(query).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive)
      return res.status(403).json({ success: false, message: 'Account suspended. Contact support.' });

    // Account in deletion grace period — allow login but signal frontend to show restore prompt
    if (user.accountStatus === 'deletion_pending') {
      user.password = undefined;
      const token = signToken(user._id);
      return res.json({
        success:              true,
        token,
        user,
        deletionPending:      true,
        deletionRequestedAt:  user.deletionRequestedAt,
        scheduledDeletionDate: user.scheduledDeletionDate,
      });
    }

    user.password = undefined;
    sendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// ── POST /api/auth/delete-account/check-password ─────────────────────────────
// Step 2 of deletion flow: verify current password before sending OTP
exports.checkDeletionPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ success: false, message: 'Password is required' });

    const user = await User.findById(req.user._id).select('+password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ success: false, message: 'Incorrect password. Please try again.' });

    res.json({ success: true, message: 'Password verified' });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/delete-account/send-otp ───────────────────────────────────
// Step 3 of deletion flow: send OTP to email or WhatsApp
exports.sendDeletionOTP = async (req, res, next) => {
  try {
    const { channel } = req.body;
    const user = req.user;

    if (!['email', 'whatsapp'].includes(channel)) {
      return res.status(400).json({ success: false, message: 'Channel must be email or whatsapp' });
    }
    if (channel === 'email' && !user.email) {
      return res.status(400).json({ success: false, message: 'No email address associated with this account' });
    }

    const identifier = channel === 'email' ? user.email.toLowerCase() : user.phone;
    const otp        = generateOTP();

    await OTP.deleteMany({ identifier, purpose: 'account_deletion' });
    await OTP.create({ identifier, channel, otp, purpose: 'account_deletion' });

    if (channel === 'email') {
      await sendEmail(
        user.email,
        'Zutsav — Account Deletion Verification',
        `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#b91c1c">🪔 Zutsav — Account Deletion Request</h2>
          <p>Namaste <strong>${user.name}</strong>,</p>
          <p>We received a request to delete your Zutsav account. Enter this code to proceed:</p>
          <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#d97706;text-align:center;padding:20px;background:#fef3c7;border-radius:12px;margin:20px 0">${otp}</div>
          <p style="color:#6b7280;font-size:14px">This code expires in <strong>10 minutes</strong>. If you did not request this, please ignore this email — your account is safe.</p>
          <p style="color:#b91c1c">🙏 Team Zutsav</p>
        </div>`
      );
    } else {
      await sendWhatsAppText(
        user.phone,
        `🪔 *Zutsav — Account Deletion Verification*\n\nNamaste ${user.name},\n\nYour OTP for account deletion: *${otp}*\n\nValid for 10 minutes. If you did not request deletion, ignore this message.\n\n🙏 Team Zutsav`
      );
    }

    res.json({ success: true, message: `Verification code sent to your ${channel === 'email' ? 'email' : 'WhatsApp'}` });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/delete-account/confirm ────────────────────────────────────
// Step 4 of deletion flow: final confirmation — runs business rules, sets deletion_pending
exports.confirmAccountDeletion = async (req, res, next) => {
  try {
    const { channel } = req.body; // channel tells us which identifier to look up the verified OTP
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Verify OTP was completed for this session
    const identifier = channel === 'email' ? user.email?.toLowerCase() : user.phone;
    const otpRecord  = await OTP.findOne({ identifier, purpose: 'account_deletion', verified: true });
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'OTP verification required. Please complete OTP verification first.' });
    }

    // Business rules: block if active bookings exist
    const activeBooking = await Booking.findOne({
      userId: user._id,
      status: { $in: ['paid', 'pandit_assigned', 'pandit_accepted', 'pending_reassignment', 'completion_requested'] },
    });
    if (activeBooking) {
      return res.status(400).json({
        success: false,
        message: 'Account cannot be deleted because you have active bookings. Please complete or cancel them first.',
        blockedBy: 'bookings',
      });
    }

    // Business rules: block if pending orders exist
    const activeOrder = await Order.findOne({
      userId: user._id,
      status: { $in: ['paid', 'confirmed', 'packed', 'shipped', 'out_for_delivery'] },
    });
    if (activeOrder) {
      return res.status(400).json({
        success: false,
        message: 'Account cannot be deleted because you have pending orders. Please wait for delivery first.',
        blockedBy: 'orders',
      });
    }

    const now = new Date();
    const scheduledDeletionDate = new Date(now);
    scheduledDeletionDate.setDate(scheduledDeletionDate.getDate() + 30);

    await User.findByIdAndUpdate(user._id, {
      accountStatus:         'deletion_pending',
      deletionRequestedAt:   now,
      scheduledDeletionDate,
    });

    // Notifications
    notifyDeletionRequested(user._id, scheduledDeletionDate).catch(() => {});
    if (user.email) {
      sendEmail(
        user.email,
        'Zutsav — Account Deletion Confirmed',
        `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#b91c1c">🪔 Zutsav — Deletion Request Confirmed</h2>
          <p>Namaste <strong>${user.name}</strong>,</p>
          <p>Your account deletion request has been received.</p>
          <p><strong>Scheduled for permanent deletion:</strong> ${scheduledDeletionDate.toLocaleDateString('en-IN')}</p>
          <p>To cancel this request, simply log in to Zutsav before <strong>${scheduledDeletionDate.toLocaleDateString('en-IN')}</strong>.</p>
          <p style="color:#6b7280;font-size:14px">If you did not make this request, please contact support immediately.</p>
          <p style="color:#b91c1c">🙏 Team Zutsav</p>
        </div>`
      ).catch(() => {});
    }

    await OTP.deleteOne({ _id: otpRecord._id });

    await AdminAuditLog.create({
      action:          'user_deletion_requested',
      performedBy:     user._id,
      performedByName: user.name,
      targetId:        user._id,
      targetType:      'user',
      targetName:      user.name,
      targetEmail:     user.email || '',
      targetPhone:     user.phone || '',
      note:            'Self-requested via account settings',
    });

    res.json({
      success:              true,
      message:              'Your account has been scheduled for deletion.',
      deletionRequestedAt:  now,
      scheduledDeletionDate,
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/delete-account/cancel ─────────────────────────────────────
// Cancels a pending deletion — called after user logs in during grace period
exports.cancelAccountDeletion = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.accountStatus !== 'deletion_pending') {
      return res.status(400).json({ success: false, message: 'No pending deletion request found on this account' });
    }

    await User.findByIdAndUpdate(user._id, {
      accountStatus:         'active',
      deletionRequestedAt:   null,
      scheduledDeletionDate: null,
    });

    notifyAccountRestored(user._id).catch(() => {});
    if (user.email) {
      sendEmail(
        user.email,
        'Zutsav — Account Successfully Restored',
        `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#b91c1c">🪔 Zutsav — Welcome Back!</h2>
          <p>Namaste <strong>${user.name}</strong>,</p>
          <p>Your account has been <strong>successfully restored</strong>. The deletion request has been cancelled.</p>
          <p>No data was deleted. Your bookings, orders, and profile are intact.</p>
          <p style="color:#b91c1c">🙏 Team Zutsav</p>
        </div>`
      ).catch(() => {});
    }

    res.json({ success: true, message: 'Your account has been successfully restored.' });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/register-pandit ───────────────────────────────────────────
exports.registerPandit = async (req, res, next) => {
  try {
    const {
      name, email, phone, password,
      govtIdType, govtIdNumber,
      pincode, state, city, district, address,
      bio, experience, specializations, languages,
    } = req.body;

    if (!req.file)
      return res.status(400).json({ success: false, message: 'Government ID image is required' });

    if (await User.findOne({ phone }))
      return res.status(400).json({ success: false, message: 'Phone number already registered' });

    if (email && await User.findOne({ email: email.toLowerCase() }))
      return res.status(400).json({ success: false, message: 'Email already in use' });

    if (await Pandit.findOne({ email: email.toLowerCase() }))
      return res.status(400).json({ success: false, message: 'Email already registered as pandit' });

    if (await Pandit.findOne({ phone }))
      return res.status(400).json({ success: false, message: 'Phone already registered as pandit' });

    const user = await User.create({
      name, email, phone, password,
      role: 'pandit',
      pincode, state, city, district,
    });

    await Pandit.create({
      userId:       user._id,
      name,
      phone,
      email:        email.toLowerCase(),
      govtIdType,
      govtIdNumber: govtIdNumber || '',
      govtIdImage:  `uploads/govtids/${req.file.filename}`,
      pincode, state, city, district, address,
      bio:             bio || '',
      experience:      experience ? +experience : 0,
      specializations: specializations ? JSON.parse(specializations) : [],
      languages:       languages        ? JSON.parse(languages)        : [],
      status: 'pending',
    });

    const token = signToken(user._id);
    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      token,
      user,
    });
  } catch (err) {
    next(err);
  }
};
