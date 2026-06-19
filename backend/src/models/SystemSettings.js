const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
  // ── General ──────────────────────────────────────────
  platformName:    { type: String, default: 'Zutsav' },
  logo:            { type: String, default: '' },
  contactEmail:    { type: String, default: '' },
  supportPhone:    { type: String, default: '' },

  // ── Payment — PhonePe ────────────────────────────────
  phonepeEnv:      { type: String, enum: ['sandbox', 'prod'], default: 'sandbox' },
  phonepeMerchantId: { type: String, default: '' },
  phonepeSaltKey:    { type: String, default: '' },
  phonepeSaltIndex:  { type: String, default: '1' },
  phonepeWebhookUrl: { type: String, default: '' },
  phonepeRedirectUrl:{ type: String, default: '' },

  // ── WhatsApp (Meta Cloud API) ────────────────────────
  whatsappAppId:        { type: String, default: '' },
  whatsappPhoneNumberId:{ type: String, default: '' },
  whatsappAccessToken:  { type: String, default: '' },
  whatsappApiVersion:   { type: String, default: 'v18.0' },

  // ── Email / SMTP ─────────────────────────────────────
  emailSmtpHost:    { type: String, default: '' },
  emailSmtpPort:    { type: Number, default: 587 },
  emailSmtpUser:    { type: String, default: '' },
  emailSmtpPassword:{ type: String, default: '' },
  emailService:     { type: String, default: 'gmail' },

  // ── AI — Groq ────────────────────────────────────────
  groqApiKey: { type: String, default: '' },
  groqModel:  { type: String, default: 'llama-3.3-70b-versatile' },

  // ── Media — Cloudinary ───────────────────────────────
  cloudinaryCloudName: { type: String, default: '' },
  cloudinaryApiKey:    { type: String, default: '' },
  cloudinaryApiSecret: { type: String, default: '' },

  // ── Security ─────────────────────────────────────────
  sessionTimeoutMinutes: { type: Number, default: 60 },
  otpExpiryMinutes:      { type: Number, default: 10 },
  passwordMinLength:     { type: Number, default: 6 },
  passwordRequireUpper:  { type: Boolean, default: false },
  passwordRequireSymbol: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
