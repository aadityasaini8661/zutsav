const User = require('../models/User');

// GET /api/referral/my  — current user's referral stats
exports.getMyReferral = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('name referralCode referralCount');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Ensure code exists (generates on first access for older accounts)
    if (!user.referralCode) {
      user.referralCode = undefined; // triggers pre-save
      await user.save();
      await user.reload?.();
    }

    const referrals = await User.find({ referredBy: req.user._id })
      .select('name createdAt')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      referralCode:  user.referralCode,
      referralCount: user.referralCount || referrals.length,
      referrals,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/referral/admin/stats  — admin only
exports.getAdminReferralStats = async (req, res, next) => {
  try {
    const topReferrers = await User.aggregate([
      { $match: { referralCount: { $gt: 0 } } },
      { $sort:  { referralCount: -1 } },
      { $limit: 20 },
      { $project: { name: 1, phone: 1, email: 1, referralCode: 1, referralCount: 1, createdAt: 1 } },
    ]);

    const totalReferred = await User.countDocuments({ referredBy: { $ne: null } });
    const usersWithCode = await User.countDocuments({ referralCode: { $ne: null } });

    res.json({
      success: true,
      stats: {
        totalReferred,
        usersWithCode,
        topReferrers,
      },
    });
  } catch (err) {
    next(err);
  }
};
