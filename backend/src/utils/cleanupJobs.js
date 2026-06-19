const User         = require('../models/User');
const Pandit       = require('../models/Pandit');
const Notification = require('../models/Notification');
const AdminAuditLog = require('../models/AdminAuditLog');
const { sendEmail } = require('./email');

/**
 * Permanently deletes user accounts that have passed their 30-day deletion grace period.
 * Called on server start and then every 24 hours.
 */
const performDeletionCleanup = async () => {
  try {
    const now = new Date();
    const usersToDelete = await User.find({
      accountStatus:         'deletion_pending',
      scheduledDeletionDate: { $lte: now },
    });

    if (usersToDelete.length === 0) return;

    for (const user of usersToDelete) {
      try {
        // 1. Clean up notifications
        await Notification.deleteMany({ userId: user._id });

        // 2. If pandit — delete Pandit document too
        if (user.role === 'pandit') {
          await Pandit.deleteOne({ userId: user._id });
        }

        // 3. Write audit log before deleting the user
        await AdminAuditLog.create({
          action:          'user_auto_deleted',
          targetId:        user._id,
          targetType:      'user',
          targetName:      user.name,
          targetEmail:     user.email || '',
          targetPhone:     user.phone || '',
          note:            'Automatic permanent deletion after 30-day grace period',
        });

        // 4. Delete the User document
        await User.deleteOne({ _id: user._id });

        // 5. Send final deletion email
        if (user.email) {
          sendEmail(
            user.email,
            'Zutsav — Account Permanently Deleted',
            `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
              <h2 style="color:#b91c1c">🪔 Zutsav — Account Deleted</h2>
              <p>Namaste <strong>${user.name}</strong>,</p>
              <p>Your Zutsav account has been permanently deleted as requested on ${new Date(user.deletionRequestedAt).toLocaleDateString('en-IN')}.</p>
              <p>All associated data has been removed from our systems.</p>
              <p>We are sorry to see you go. You are always welcome back.</p>
              <p style="color:#b91c1c">🙏 Team Zutsav</p>
            </div>`
          ).catch(() => {});
        }

        console.log(`[Cleanup] Permanently deleted account: ${user.name} (${user.email || user.phone})`);
      } catch (err) {
        console.error(`[Cleanup] Failed to delete user ${user._id}:`, err.message);
      }
    }

    console.log(`[Cleanup] Processed ${usersToDelete.length} scheduled deletion(s)`);
  } catch (err) {
    console.error('[Cleanup] Deletion cleanup error:', err.message);
  }
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const startDeletionCleanupJob = () => {
  // Run once immediately (catches any deletions that occurred while server was down)
  performDeletionCleanup();
  // Then repeat every 24 hours
  setInterval(performDeletionCleanup, MS_PER_DAY);
  console.log('[Cleanup] Account deletion cleanup job started (runs daily)');
};

module.exports = { startDeletionCleanupJob, performDeletionCleanup };
