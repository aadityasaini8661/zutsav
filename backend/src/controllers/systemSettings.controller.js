const SystemSettings = require('../models/SystemSettings');
const settingsService = require('../utils/settingsService');

// Fields that are never returned in plain text on GET
const SENSITIVE = [
  'phonepeSaltKey',
  'whatsappAccessToken',
  'emailSmtpPassword',
  'groqApiKey',
  'cloudinaryApiSecret',
];

const MASK = '••••••••';

/** GET /api/admin/settings */
exports.getSettings = async (req, res) => {
  try {
    let doc = await SystemSettings.findOne().lean();
    if (!doc) doc = {};

    // Mask sensitive fields so they never leave the server as plaintext
    SENSITIVE.forEach((f) => {
      if (doc[f]) doc[f] = MASK;
    });

    res.json({ success: true, settings: doc });
  } catch (err) {
    console.error('getSettings error:', err);
    res.status(500).json({ success: false, message: 'Failed to load settings' });
  }
};

/** PATCH /api/admin/settings  — body can contain any subset of fields */
exports.updateSettings = async (req, res) => {
  try {
    const update = { ...req.body };

    // Ignore masked placeholder values so they don't overwrite real secrets
    SENSITIVE.forEach((f) => {
      if (update[f] === MASK || update[f] === '') delete update[f];
    });

    // Remove internal mongo fields if accidentally sent
    delete update._id;
    delete update.__v;
    delete update.createdAt;
    delete update.updatedAt;

    const doc = await SystemSettings.findOneAndUpdate(
      {},
      { $set: update },
      { new: true, upsert: true, runValidators: true }
    );

    // Invalidate cache so next service call reads fresh values
    settingsService.invalidate();

    res.json({ success: true, message: 'Settings saved successfully' });
  } catch (err) {
    console.error('updateSettings error:', err);
    res.status(500).json({ success: false, message: 'Failed to save settings' });
  }
};
