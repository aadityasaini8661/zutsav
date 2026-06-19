const User                 = require('../models/User');
const Pandit               = require('../models/Pandit');
const Booking              = require('../models/Booking');
const Order                = require('../models/Order');
const Product              = require('../models/Product');
const Notification         = require('../models/Notification');
const AdminAuditLog        = require('../models/AdminAuditLog');
const EducationMaster      = require('../models/EducationMaster');
const SpecializationMaster = require('../models/SpecializationMaster');
const { notifyPanditAssigned } = require('../utils/whatsapp');
const {
  notifyPanditApproved,
  notifyPanditAssignedToUser,
  notifyPanditAssignmentPending,
  createNotification,
  notifyOrderConfirmed,
  notifyOrderPacked,
  notifyOrderShipped,
  notifyOrderOutForDelivery,
  notifyOrderDelivered,
  notifyOrderCancelled,
  notifyOrderRefunded,
  notifyKYCApproved,
  notifyKYCRejected,
  notifyKYCReuploadRequired,
} = require('../utils/notificationService');

// GET /api/admin/dashboard
exports.getDashboard = async (req, res, next) => {
  try {
    const [
      totalUsers, totalPandits, pendingPandits, totalBookings, paidBookings,
      totalOrders, pendingOrders, deliveredOrders, cancelledOrders,
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Pandit.countDocuments({ status: 'approved' }),
      Pandit.countDocuments({ status: 'pending' }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: { $in: ['paid', 'pandit_assigned', 'pandit_accepted', 'pending_reassignment', 'completion_requested', 'completed'] } }),
      Order.countDocuments({ status: { $ne: 'pending_payment' } }),
      Order.countDocuments({ status: { $in: ['paid', 'confirmed', 'packed', 'shipped', 'out_for_delivery'] } }),
      Order.countDocuments({ status: 'delivered' }),
      Order.countDocuments({ status: 'cancelled' }),
    ]);

    const recentBookings = await Booking.find({ status: 'paid' })
      .populate('userId', 'name phone')
      .populate('poojaId', 'name price')
      .sort({ createdAt: -1 })
      .limit(5);

    const [bookingRevenue, orderRevenue, lowStockProducts] = await Promise.all([
      Booking.aggregate([
        { $match: { status: { $in: ['paid', 'pandit_assigned', 'pandit_accepted', 'pending_reassignment', 'completion_requested', 'completed'] } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Order.aggregate([
        { $match: { status: { $in: ['paid', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered'] } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Product.countDocuments({ isActive: true, stock: { $lte: 5 } }),
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalPandits,
        pendingPandits,
        totalBookings,
        paidBookings,
        totalRevenue: (bookingRevenue[0]?.total || 0) + (orderRevenue[0]?.total || 0),
        bookingRevenue: bookingRevenue[0]?.total || 0,
        orderRevenue:   orderRevenue[0]?.total || 0,
        totalOrders,
        pendingOrders,
        deliveredOrders,
        cancelledOrders,
        lowStockProducts,
      },
      recentBookings,
    });
  } catch (err) {
    next(err);
  }
};

// ─── Pandit Management ───────────────────────────────────────

// GET /api/admin/pandits?status=pending&kycStatus=submitted
exports.getPandits = async (req, res, next) => {
  try {
    const { status, kycStatus, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status)    query.status    = status;
    if (kycStatus) query.kycStatus = kycStatus;

    // Only return pandits whose User document still exists — prevents orphan records
    // from deleted accounts appearing in the admin UI.
    const existingUserIds = await User.distinct('_id');
    query.userId = { $in: existingUserIds };

    const [pandits, total] = await Promise.all([
      Pandit.find(query)
        .populate('userId', 'name email phone createdAt')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit),
      Pandit.countDocuments(query),
    ]);

    res.json({ success: true, pandits, total });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/pandits/:id/approve
exports.approvePandit = async (req, res, next) => {
  try {
    const { status, adminNote } = req.body; // status: approved / rejected / under_review / suspended / reupload_required
    const updates = { status, adminNote };

    // When legacy-approving, also grant booking eligibility (backward compat)
    if (status === 'approved') updates.canReceiveBookings = true;
    if (status === 'rejected' || status === 'suspended') updates.canReceiveBookings = false;

    const pandit = await Pandit.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('userId', 'name email phone');

    if (!pandit) return res.status(404).json({ success: false, message: 'Pandit not found' });

    if (status === 'approved' && pandit.userId) {
      notifyPanditApproved(pandit.userId._id || pandit.userId).catch(() => {});
    }

    res.json({ success: true, pandit });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/pandits/:id/kyc — approve / reject / request reupload
exports.updateKYCStatus = async (req, res, next) => {
  try {
    const { kycAction, reason } = req.body; // kycAction: 'approve' | 'reject' | 'reupload'

    const pandit = await Pandit.findById(req.params.id).populate('userId', 'name email phone');
    if (!pandit) return res.status(404).json({ success: false, message: 'Pandit not found' });

    const updates = { kycReviewedAt: new Date() };

    if (kycAction === 'approve') {
      updates.kycStatus          = 'approved';
      updates.canReceiveBookings = true;
      updates.kycRejectionReason = '';
      notifyKYCApproved(pandit.userId._id || pandit.userId).catch(() => {});
    } else if (kycAction === 'reject') {
      if (!reason || reason.trim().length < 5) {
        return res.status(400).json({ success: false, message: 'Rejection reason is required (min 5 characters)' });
      }
      updates.kycStatus          = 'rejected';
      updates.canReceiveBookings = false;
      updates.kycRejectionReason = reason.trim();
      notifyKYCRejected(pandit.userId._id || pandit.userId, reason.trim()).catch(() => {});
    } else if (kycAction === 'reupload') {
      if (!reason || reason.trim().length < 5) {
        return res.status(400).json({ success: false, message: 'Re-upload reason is required (min 5 characters)' });
      }
      updates.kycStatus          = 'reupload_required';
      updates.canReceiveBookings = false;
      updates.kycRejectionReason = reason.trim();
      notifyKYCReuploadRequired(pandit.userId._id || pandit.userId, reason.trim()).catch(() => {});
    } else {
      return res.status(400).json({ success: false, message: 'kycAction must be approve, reject, or reupload' });
    }

    const updated = await Pandit.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('userId', 'name email phone');
    res.json({ success: true, pandit: updated });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/admin/pandits/:id — cascade delete pandit + user + related records
exports.deletePandit = async (req, res, next) => {
  try {
    const pandit = await Pandit.findById(req.params.id);
    if (!pandit) return res.status(404).json({ success: false, message: 'Pandit not found' });

    const { _id: panditId, userId, name, email, phone } = pandit;

    // 1. Release any pending/active booking assignments — reset to 'paid' so admin can reassign
    await Booking.updateMany(
      { panditId, status: { $in: ['pandit_assigned', 'pandit_accepted', 'pending_reassignment'] } },
      { $set: { panditId: null, status: 'paid' } }
    );

    // 2. Delete in-app notifications belonging to the pandit's user account
    if (userId) {
      await Notification.deleteMany({ userId });
    }

    // 3. Delete the Pandit document (embeds KYC, availability, coverage, all profile data)
    await Pandit.deleteOne({ _id: panditId });

    // 4. Delete the User document
    if (userId) {
      await User.deleteOne({ _id: userId });
    }

    // 5. Write audit log
    await AdminAuditLog.create({
      action:          'delete_pandit',
      performedBy:     req.user._id,
      performedByName: req.user.name || 'Admin',
      targetId:        panditId,
      targetType:      'pandit',
      targetName:      name,
      targetEmail:     email || '',
      targetPhone:     phone || '',
      note:            req.body.reason || '',
    });

    res.json({ success: true, message: `Pandit "${name}" has been permanently deleted` });
  } catch (err) {
    next(err);
  }
};

// ─── User Management ─────────────────────────────────────────

// GET /api/admin/users?search=&role=&accountStatus=deletion_pending
exports.getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, search, accountStatus } = req.query;
    const query = {};
    if (role)          query.role          = role;
    if (accountStatus) query.accountStatus = accountStatus;
    if (search) query.$or = [
      { name:  new RegExp(search, 'i') },
      { phone: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') },
    ];

    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit),
      User.countDocuments(query),
    ]);

    res.json({ success: true, users, total });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/users/:id/status
exports.updateUserStatus = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: req.body.isActive }, { new: true });
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/users/:id/cancel-deletion — admin cancels a pending deletion request
exports.adminCancelDeletion = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.accountStatus !== 'deletion_pending') {
      return res.status(400).json({ success: false, message: 'User does not have a pending deletion request' });
    }

    const updated = await User.findByIdAndUpdate(req.params.id, {
      accountStatus:         'active',
      deletionRequestedAt:   null,
      scheduledDeletionDate: null,
    }, { new: true });

    await AdminAuditLog.create({
      action:          'admin_cancel_deletion',
      performedBy:     req.user._id,
      performedByName: req.user.name || 'Admin',
      targetId:        user._id,
      targetType:      'user',
      targetName:      user.name,
      targetEmail:     user.email || '',
      targetPhone:     user.phone || '',
    });

    const { notifyDeletionCancelled } = require('../utils/notificationService');
    notifyDeletionCancelled(user._id).catch(() => {});

    res.json({ success: true, user: updated, message: 'Deletion request cancelled' });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/admin/users/:id — admin immediately and permanently deletes a user account
exports.adminDeleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Clean up notifications
    await Notification.deleteMany({ userId: user._id });

    // If pandit — cascade to Pandit document
    if (user.role === 'pandit') {
      const pandit = await Pandit.findOne({ userId: user._id });
      if (pandit) {
        // Release any active booking assignments
        await Booking.updateMany(
          { panditId: pandit._id, status: { $in: ['pandit_assigned', 'pandit_accepted', 'pending_reassignment'] } },
          { $set: { panditId: null, status: 'paid' } }
        );
        await Pandit.deleteOne({ _id: pandit._id });
      }
    }

    await AdminAuditLog.create({
      action:          'admin_delete_user',
      performedBy:     req.user._id,
      performedByName: req.user.name || 'Admin',
      targetId:        user._id,
      targetType:      'user',
      targetName:      user.name,
      targetEmail:     user.email || '',
      targetPhone:     user.phone || '',
      note:            req.body.reason || 'Admin-initiated immediate deletion',
    });

    await User.deleteOne({ _id: user._id });

    res.json({ success: true, message: `User "${user.name}" permanently deleted` });
  } catch (err) {
    next(err);
  }
};

// ─── Booking / Pandit Assignment ─────────────────────────────

// GET /api/admin/bookings
exports.getBookings = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = {};
    if (status) query.status = status;

    const bookings = await Booking.find(query)
      .populate('userId',   'name phone email')
      .populate('poojaId',  'name price image')
      .populate('panditId', 'name phone profilePhoto bankDetails upiDetails')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Booking.countDocuments(query);
    res.json({ success: true, bookings, total });
  } catch (err) {
    next(err);
  }
};

// Haversine distance formula — returns km between two lat/lng points
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// GET /api/admin/pandits/available  — for assignment dropdown
exports.getAvailablePandits = async (req, res, next) => {
  try {
    const { date, userLat, userLng, userCity, userState, poojaId, bookingId } = req.query;
    const checkDate = date ? new Date(date) : new Date();
    checkDate.setHours(12, 0, 0, 0); // noon to avoid timezone edge cases
    const dayOfWeek = checkDate.getDay();

    const hasUserCoords = userLat && userLng &&
      !isNaN(parseFloat(userLat)) && !isNaN(parseFloat(userLng));
    const uLat = hasUserCoords ? parseFloat(userLat) : null;
    const uLng = hasUserCoords ? parseFloat(userLng) : null;

    // Collect pandits who already rejected this booking — exclude them from results
    let excludedPanditIds = new Set();
    if (bookingId) {
      const booking = await Booking.findById(bookingId).select('panditRejections');
      if (booking?.panditRejections?.length > 0) {
        booking.panditRejections.forEach((r) => excludedPanditIds.add(r.panditId.toString()));
      }
    }

    // Eligible: explicitly approved via KYC flow OR legacy-approved pandits (govtIdImage set)
    const pandits = await Pandit.find({
      status: 'approved',
      $or: [
        { canReceiveBookings: true },
        { kycStatus: 'not_submitted', govtIdImage: { $exists: true, $ne: null } },
      ],
    }).populate('userId', 'name profilePhoto');

    const available = pandits.filter((p) => {
      // 0. Exclude orphan pandits (User was deleted)
      if (!p.userId) return false;

      // 0a. Exclude pandits who previously rejected this booking
      if (excludedPanditIds.has(p._id.toString())) return false;

      // 0b. Pooja specialization filter — only show pandits who selected this pooja
      if (poojaId && p.selectedPoojas?.length > 0) {
        const hasPoojaId = p.selectedPoojas.some((id) => id.toString() === poojaId);
        if (!hasPoojaId) return false;
      } else if (poojaId && (!p.selectedPoojas || p.selectedPoojas.length === 0)) {
        return false;
      }

      // 1. Global availability toggle
      if (p.isAvailableForBookings === false) return false;

      // 2. Check leaves / blocked periods
      const isOnLeave = p.blockedPeriods.some(
        (b) => checkDate >= new Date(b.startDate) && checkDate <= new Date(b.endDate)
      );
      if (isOnLeave) return false;

      // 3. Check special dates (takes priority over weekly schedule)
      const dayStart = new Date(checkDate); dayStart.setHours(0, 0, 0, 0);
      const dayEnd   = new Date(checkDate); dayEnd.setHours(23, 59, 59, 999);
      const specialDate = p.specialDates?.find(
        (s) => new Date(s.date) >= dayStart && new Date(s.date) <= dayEnd
      );
      if (specialDate) {
        return specialDate.type === 'custom';
      }

      // 4. Check weekly schedule
      if (p.weeklySchedule?.length > 0) {
        const daySched = p.weeklySchedule.find((d) => d.dayOfWeek === dayOfWeek);
        return daySched ? daySched.enabled : false;
      }

      // 5. Fall back to legacy availabilitySlots
      return p.availabilitySlots.some((slot) => {
        if (!slot.isActive) return false;
        const inRange = checkDate >= new Date(slot.startDate) && checkDate <= new Date(slot.endDate);
        if (!inRange) return false;
        return slot.daysOfWeek.length === 0 || slot.daysOfWeek.includes(dayOfWeek);
      });
    });

    // Annotate each pandit with distance and coverage eligibility
    const annotated = available.map((p) => {
      const obj = p.toObject();
      const coverage = p.serviceCoverage || { type: 'city', radiusKm: 25 };

      let distanceKm = null;
      let withinCoverage = false; // default: out of coverage unless proven otherwise

      if (coverage.type === 'pan_india') {
        withinCoverage = true;
      } else if (coverage.type === 'state') {
        if (!p.state || !userState) {
          withinCoverage = false;
        } else {
          withinCoverage = p.state.trim().toLowerCase() === userState.trim().toLowerCase();
        }
      } else if (coverage.type === 'district') {
        const pDistrict = (p.district || p.city || '').trim().toLowerCase();
        const uDistrict = userCity.trim().toLowerCase();
        withinCoverage = !!(pDistrict && uDistrict && pDistrict === uDistrict);
      } else if (coverage.type === 'city') {
        if (!p.city || !userCity) {
          withinCoverage = false;
        } else {
          withinCoverage = p.city.trim().toLowerCase() === userCity.trim().toLowerCase();
        }
      } else if (coverage.type === 'radius') {
        if (hasUserCoords && p.latitude && p.longitude) {
          distanceKm = haversineKm(uLat, uLng, p.latitude, p.longitude);
          withinCoverage = distanceKm <= coverage.radiusKm;
        } else if (userCity && p.city) {
          // No coordinates — same city is a reasonable proxy; different city is definitely out
          withinCoverage = p.city.trim().toLowerCase() === userCity.trim().toLowerCase();
        } else {
          withinCoverage = false;
        }
      }

      // Also compute distance for display even for non-radius coverage
      if (hasUserCoords && p.latitude && p.longitude && distanceKm === null) {
        distanceKm = haversineKm(uLat, uLng, p.latitude, p.longitude);
      }

      obj.distanceKm = distanceKm !== null ? Math.round(distanceKm * 10) / 10 : null;
      obj.withinCoverage = withinCoverage;
      obj.coverageType = coverage.type;
      obj.coverageRadiusKm = coverage.radiusKm;

      // Expected charges for the requested pooja
      const chargeEntry = poojaId
        ? p.poojaCharges?.find((c) => c.poojaId?.toString() === poojaId)
        : null;
      obj.expectedChargesForPooja = chargeEntry ? chargeEntry.expectedCharges : null;

      return obj;
    });

    // Sort: within-coverage first, then by distance (nearest first)
    annotated.sort((a, b) => {
      if (a.withinCoverage !== b.withinCoverage) return a.withinCoverage ? -1 : 1;
      if (a.distanceKm !== null && b.distanceKm !== null) return a.distanceKm - b.distanceKm;
      if (a.distanceKm !== null) return -1;
      if (b.distanceKm !== null) return 1;
      return 0;
    });

    res.json({ success: true, pandits: annotated });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/bookings/:id/assign
exports.assignPandit = async (req, res, next) => {
  try {
    const { panditId } = req.body;

    const pandit = await Pandit.findById(panditId);
    if (!pandit || pandit.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Pandit not found or not approved' });
    }

    const booking = await Booking.findById(req.params.id).populate('poojaId', 'name');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    // Only allow assignment from valid pre-assignment states
    const assignableStatuses = ['paid', 'pending_reassignment', 'pandit_assigned'];
    if (!assignableStatuses.includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot assign a pandit to a booking with status "${booking.status}"`,
      });
    }

    // Prevent assigning a pandit who already rejected this booking
    const alreadyRejected = booking.panditRejections?.some(
      (r) => r.panditId.toString() === panditId
    );
    if (alreadyRejected) {
      return res.status(400).json({ success: false, message: 'This pandit has already rejected this booking. Please choose a different pandit.' });
    }

    booking.panditId = panditId;
    booking.status = 'pandit_assigned';
    booking.panditAssignedAt = new Date();
    if (req.body.panditFareAmount && !isNaN(+req.body.panditFareAmount) && +req.body.panditFareAmount > 0) {
      booking.panditFareAmount = +req.body.panditFareAmount;
    }
    booking.auditLog.push({
      action:          'pandit_assigned',
      performedBy:     req.user._id,
      performedByName: req.user.name || 'Admin',
      note:            `Assigned pandit: ${pandit.name}`,
      at:              new Date(),
    });
    await booking.save();

    // Update pandit total bookings
    await Pandit.findByIdAndUpdate(panditId, { $inc: { totalBookings: 1 } });

    // Send WhatsApp notification to user
    await notifyPanditAssigned(booking, pandit);
    await Booking.findByIdAndUpdate(req.params.id, { whatsappNotified: true });

    // In-app: tell user their pandit was assigned
    notifyPanditAssignedToUser(booking.userId, pandit.name, booking.bookingNumber).catch(() => {});

    // In-app: ask pandit to accept or reject
    if (pandit.userId) {
      notifyPanditAssignmentPending(pandit.userId, booking.bookingNumber, booking.poojaId?.name || 'Pooja').catch(() => {});
    }

    res.json({ success: true, booking });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/bookings/:id/status
exports.updateBookingStatus = async (req, res, next) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status, cancelReason: req.body.cancelReason },
      { new: true }
    );
    res.json({ success: true, booking });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/bookings/:id/approve-completion
exports.approveCompletion = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.status !== 'completion_requested') {
      return res.status(400).json({ success: false, message: 'Booking is not awaiting completion approval' });
    }

    const now = new Date();
    booking.status        = 'completed';
    booking.completedAt   = now;
    booking.verifiedAt    = now;
    booking.verifiedByName = req.user.name || 'Admin';
    booking.auditLog.push({
      action:          'completion_approved',
      performedBy:     req.user._id,
      performedByName: req.user.name || 'Admin',
      at:              now,
    });
    await booking.save();

    // Prompt the user to rate their experience
    createNotification({
      userId:  booking.userId,
      type:    'rate_experience',
      title:   'How was your experience?',
      message: `Your pooja (booking #${booking.bookingNumber}) is complete. Please take a moment to rate your experience.`,
      data:    { bookingId: booking._id, bookingNumber: booking.bookingNumber },
    }).catch(() => {});

    res.json({ success: true, booking });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/bookings/:id/assign-payout
exports.assignPayout = async (req, res, next) => {
  try {
    const { amount, note } = req.body;
    if (!amount || isNaN(+amount) || +amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid payout amount is required' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Payout can only be assigned for completed bookings' });
    }
    if (booking.payout?.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Payout already completed' });
    }

    booking.payout = {
      amount:         +amount,
      status:         'pending',
      assignedBy:     req.user._id,
      assignedByName: req.user.name || 'Admin',
    };
    booking.auditLog.push({
      action:          'payout_assigned',
      performedBy:     req.user._id,
      performedByName: req.user.name || 'Admin',
      note:            `Payout ₹${amount}${note ? ` — ${note}` : ''}`,
      at:              new Date(),
    });
    await booking.save();

    res.json({ success: true, booking });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/bookings/:id/mark-payout-paid
exports.markPayoutPaid = async (req, res, next) => {
  try {
    const { transactionRef } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.payout?.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'No pending payout to mark as paid' });
    }

    booking.payout.status = 'completed';
    booking.payout.paidAt = new Date();
    if (transactionRef) booking.payout.transactionRef = transactionRef;

    booking.auditLog.push({
      action:          'payout_completed',
      performedBy:     req.user._id,
      performedByName: req.user.name || 'Admin',
      note:            transactionRef ? `Ref: ${transactionRef}` : undefined,
      at:              new Date(),
    });
    await booking.save();

    res.json({ success: true, booking });
  } catch (err) {
    next(err);
  }
};

// ─── Marketplace Order Management ────────────────────────────

// GET /api/admin/orders
exports.getOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;

    const query = { status: { $ne: 'pending_payment' } };
    if (status) query.status = status;
    if (search) query.$or = [{ orderNumber: new RegExp(search, 'i') }];

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('userId', 'name email phone')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit),
      Order.countDocuments(query),
    ]);

    const [totalOrders, pendingOrders, deliveredOrders, cancelledOrders, revenueAgg] = await Promise.all([
      Order.countDocuments({ status: { $ne: 'pending_payment' } }),
      Order.countDocuments({ status: { $in: ['paid', 'confirmed', 'packed', 'shipped', 'out_for_delivery'] } }),
      Order.countDocuments({ status: 'delivered' }),
      Order.countDocuments({ status: 'cancelled' }),
      Order.aggregate([
        { $match: { status: { $in: ['paid', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered'] } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
    ]);

    res.json({
      success: true, orders, total,
      stats: { totalOrders, pendingOrders, deliveredOrders, cancelledOrders, totalRevenue: revenueAgg[0]?.total || 0 },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/orders/:id
exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('userId', 'name email phone');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/orders/:id/status
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status, note, cancelReason } = req.body;
    const order = await Order.findById(req.params.id).populate('userId', '_id name');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const prevStatus = order.status;
    order.status = status;
    order.statusTimeline = order.statusTimeline || [];
    order.statusTimeline.push({ status, timestamp: new Date(), note: note || '' });
    if (status === 'cancelled' && cancelReason) order.cancelReason = cancelReason;
    if (status === 'refunded') order.refundStatus = 'processed';
    await order.save();

    const uid = order.userId?._id || order.userId;
    const orderNum = order.orderNumber;

    // Restore stock when cancelling a paid/in-progress order
    if (status === 'cancelled' && ['paid', 'confirmed', 'packed', 'processing'].includes(prevStatus)) {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } });
      }
    }

    const notifyMap = {
      confirmed:        () => notifyOrderConfirmed(uid, orderNum),
      packed:           () => notifyOrderPacked(uid, orderNum),
      shipped:          () => notifyOrderShipped(uid, orderNum, order.trackingId, order.courier),
      out_for_delivery: () => notifyOrderOutForDelivery(uid, orderNum),
      delivered:        () => notifyOrderDelivered(uid, orderNum),
      cancelled:        () => notifyOrderCancelled(uid, orderNum, cancelReason),
      refunded:         () => notifyOrderRefunded(uid, orderNum),
    };
    if (notifyMap[status]) notifyMap[status]().catch(() => {});

    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/orders/:id/shipment
exports.updateOrderShipment = async (req, res, next) => {
  try {
    const { trackingId, courier } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id, { $set: { trackingId, courier } }, { new: true }
    );
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

// ─── Education Masters ────────────────────────────────────────

// GET /api/admin/education-masters
exports.getEducationMasters = async (req, res, next) => {
  try {
    const { includeInactive } = req.query;
    const query = includeInactive === 'true' ? {} : { isActive: true };
    const masters = await EducationMaster.find(query).sort({ sortOrder: 1, name: 1 });
    res.json({ success: true, masters });
  } catch (err) { next(err); }
};

// POST /api/admin/education-masters
exports.createEducationMaster = async (req, res, next) => {
  try {
    const { name, allowCustom, sortOrder } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ success: false, message: 'Name is required' });
    const master = await EducationMaster.create({ name: name.trim(), allowCustom: !!allowCustom, sortOrder: sortOrder || 0 });
    res.status(201).json({ success: true, master });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: 'This education category already exists' });
    next(err);
  }
};

// PATCH /api/admin/education-masters/:id
exports.updateEducationMaster = async (req, res, next) => {
  try {
    const { name, isActive, allowCustom, sortOrder } = req.body;
    const updates = {};
    if (name !== undefined)        updates.name        = name.trim();
    if (isActive !== undefined)    updates.isActive    = isActive;
    if (allowCustom !== undefined) updates.allowCustom = allowCustom;
    if (sortOrder !== undefined)   updates.sortOrder   = sortOrder;
    const master = await EducationMaster.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!master) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, master });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: 'This education category already exists' });
    next(err);
  }
};

// DELETE /api/admin/education-masters/:id
exports.deleteEducationMaster = async (req, res, next) => {
  try {
    await EducationMaster.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true });
  } catch (err) { next(err); }
};

// ─── Specialization Masters ───────────────────────────────────

// GET /api/admin/specialization-masters
exports.getSpecializationMasters = async (req, res, next) => {
  try {
    const { includeInactive } = req.query;
    const query = includeInactive === 'true' ? {} : { isActive: true };
    const masters = await SpecializationMaster.find(query).sort({ sortOrder: 1, name: 1 });
    res.json({ success: true, masters });
  } catch (err) { next(err); }
};

// POST /api/admin/specialization-masters
exports.createSpecializationMaster = async (req, res, next) => {
  try {
    const { name, sortOrder } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ success: false, message: 'Name is required' });
    const master = await SpecializationMaster.create({ name: name.trim(), sortOrder: sortOrder || 0 });
    res.status(201).json({ success: true, master });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: 'This specialization already exists' });
    next(err);
  }
};

// PATCH /api/admin/specialization-masters/:id
exports.updateSpecializationMaster = async (req, res, next) => {
  try {
    const { name, isActive, sortOrder } = req.body;
    const updates = {};
    if (name !== undefined)      updates.name      = name.trim();
    if (isActive !== undefined)  updates.isActive  = isActive;
    if (sortOrder !== undefined) updates.sortOrder = sortOrder;
    const master = await SpecializationMaster.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!master) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, master });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: 'This specialization already exists' });
    next(err);
  }
};

// DELETE /api/admin/specialization-masters/:id
exports.deleteSpecializationMaster = async (req, res, next) => {
  try {
    await SpecializationMaster.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true });
  } catch (err) { next(err); }
};
