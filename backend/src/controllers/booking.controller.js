const Booking = require('../models/Booking');
const Pooja   = require('../models/Pooja');
const Pandit  = require('../models/Pandit');
const { createOrder, verifySignature }   = require('../utils/razorpay');
const { createPhonePeOrder, checkPhonePeStatus, verifyWebhookChecksum } = require('../utils/phonepe');
const { notifyBookingConfirmed }         = require('../utils/notification');
const { notifyBookingCreated }           = require('../utils/notificationService');

// POST /api/bookings/create-order
exports.createBookingOrder = async (req, res, next) => {
  try {
    const { poojaId, scheduledDate, scheduledTime, language, specialNote, userDetails } = req.body;

    const pooja = await Pooja.findById(poojaId);
    if (!pooja || !pooja.isActive) return res.status(404).json({ success: false, message: 'Pooja not found' });

    // Create Razorpay order
    const rpOrder = await createOrder(pooja.price, 'INR', `booking_${Date.now()}`);

    // Create booking with pending status
    const booking = await Booking.create({
      userId: req.user._id,
      poojaId,
      scheduledDate: new Date(scheduledDate),
      scheduledTime,
      language: language || 'Hindi',
      specialNote,
      userDetails,
      amount: pooja.price,
      razorpayOrderId: rpOrder.id,
      status: 'pending_payment',
    });

    res.status(201).json({
      success: true,
      booking,
      razorpayOrder: {
        id:       rpOrder.id,
        amount:   rpOrder.amount,
        currency: rpOrder.currency,
        keyId:    process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/bookings/verify-payment  (Razorpay — legacy)
exports.verifyPayment = async (req, res, next) => {
  try {
    const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    const isValid = verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!isValid) return res.status(400).json({ success: false, message: 'Payment verification failed' });

    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { status: 'paid', razorpayPaymentId, razorpaySignature },
      { new: true }
    ).populate('poojaId', 'name');

    await Pooja.findByIdAndUpdate(booking.poojaId, { $inc: { totalBookings: 1 } });
    await notifyBookingConfirmed(booking, booking.poojaId?.name || '');
    notifyBookingCreated(booking.userId, booking.bookingNumber, booking.poojaId?.name || '').catch(() => {});

    res.json({ success: true, booking });
  } catch (err) {
    next(err);
  }
};

// POST /api/bookings/create-phonepe-order
exports.createPhonePeBooking = async (req, res, next) => {
  try {
    const { poojaId, scheduledDate, scheduledTime, language, specialNote, userDetails } = req.body;

    const pooja = await Pooja.findById(poojaId);
    if (!pooja || !pooja.isActive) return res.status(404).json({ success: false, message: 'Pooja not found' });

    const merchantTransactionId = `ZUT_${Date.now()}_${req.user._id.toString().slice(-6)}`;
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

    // Create booking with pending status first
    const booking = await Booking.create({
      userId:               req.user._id,
      poojaId,
      scheduledDate:        new Date(scheduledDate),
      scheduledTime,
      language:             language || 'Hindi',
      specialNote,
      userDetails,
      amount:               pooja.price,
      paymentProvider:      'phonepe',
      phonePeMerchantTransactionId: merchantTransactionId,
      status:               'pending_payment',
    });

    const { redirectUrl } = await createPhonePeOrder({
      merchantTransactionId,
      amount:      pooja.price,
      userId:      req.user._id,
      redirectUrl: `${clientUrl}/payment-callback/${merchantTransactionId}`,
      callbackUrl: `${process.env.SERVER_URL || 'http://localhost:5000'}/api/bookings/phonepe-webhook`,
    });

    res.status(201).json({ success: true, booking, redirectUrl, merchantTransactionId });
  } catch (err) {
    next(err);
  }
};

// GET /api/bookings/verify-phonepe/:merchantTransactionId
exports.verifyPhonePePayment = async (req, res, next) => {
  try {
    const { merchantTransactionId } = req.params;
    const booking = await Booking.findOne({ phonePeMerchantTransactionId: merchantTransactionId })
      .populate('poojaId', 'name');

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    // If already paid, just return
    if (booking.status === 'paid') {
      return res.json({ success: true, booking, alreadyVerified: true });
    }

    const result = await checkPhonePeStatus(merchantTransactionId);

    if (result.success) {
      booking.status             = 'paid';
      booking.phonePeTransactionId = result.transactionId;
      await booking.save();

      await Pooja.findByIdAndUpdate(booking.poojaId, { $inc: { totalBookings: 1 } });
      await notifyBookingConfirmed(booking, booking.poojaId?.name || '');
      notifyBookingCreated(booking.userId, booking.bookingNumber, booking.poojaId?.name || '').catch(() => {});

      return res.json({ success: true, booking });
    }

    res.json({ success: false, code: result.code, state: result.state, booking });
  } catch (err) {
    next(err);
  }
};

// POST /api/bookings/phonepe-webhook  — PhonePe server-to-server callback
exports.phonePeWebhook = async (req, res) => {
  try {
    const { response } = req.body;
    const xVerify = req.headers['x-verify'];

    if (!await verifyWebhookChecksum(response, xVerify)) {
      return res.status(400).json({ success: false });
    }

    const decoded = JSON.parse(Buffer.from(response, 'base64').toString());
    const merchantTransactionId = decoded?.data?.merchantTransactionId;

    if (decoded?.code === 'PAYMENT_SUCCESS' && merchantTransactionId) {
      const booking = await Booking.findOne({ phonePeMerchantTransactionId: merchantTransactionId })
        .populate('poojaId', 'name');

      if (booking && booking.status !== 'paid') {
        booking.status               = 'paid';
        booking.phonePeTransactionId = decoded?.data?.transactionId;
        await booking.save();
        await Pooja.findByIdAndUpdate(booking.poojaId, { $inc: { totalBookings: 1 } });
        await notifyBookingConfirmed(booking, booking.poojaId?.name || '');
        notifyBookingCreated(booking.userId, booking.bookingNumber, booking.poojaId?.name || '').catch(() => {});
      }
    }

    res.json({ success: true });
  } catch {
    res.json({ success: true }); // always ack to PhonePe
  }
};

// GET /api/bookings/my
exports.getMyBookings = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { userId: req.user._id };
    if (status) query.status = status;

    const bookings = await Booking.find(query)
      .populate('poojaId', 'name image price')
      .populate('panditId', 'name phone profilePhoto')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Booking.countDocuments(query);
    res.json({ success: true, bookings, total, page: +page });
  } catch (err) {
    next(err);
  }
};

// POST /api/bookings/:id/rate  — user submits star rating after completion
exports.rateBooking = async (req, res, next) => {
  try {
    const { rating, review } = req.body;
    const ratingNum = parseInt(rating, 10);
    if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    if (booking.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Only completed bookings can be rated' });
    }
    if (booking.rating !== null && booking.rating !== undefined) {
      return res.status(400).json({ success: false, message: 'You have already rated this booking' });
    }

    booking.rating     = ratingNum;
    booking.review     = (review || '').trim();
    booking.ratingDate = new Date();
    await booking.save();

    // Recalculate pandit's aggregate rating
    if (booking.panditId) {
      const ratedBookings = await Booking.find({
        panditId: booking.panditId,
        rating:   { $ne: null },
        status:   'completed',
      }).select('rating');

      const totalReviews = ratedBookings.length;
      const avgRating = totalReviews > 0
        ? Math.round((ratedBookings.reduce((s, b) => s + b.rating, 0) / totalReviews) * 10) / 10
        : 0;

      await Pandit.findByIdAndUpdate(booking.panditId, { rating: avgRating, totalReviews });
    }

    res.json({ success: true, booking });
  } catch (err) {
    next(err);
  }
};

// GET /api/bookings/:id
exports.getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('poojaId', 'name image price duration description')
      .populate('panditId', 'name phone profilePhoto specializations');

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    res.json({ success: true, booking });
  } catch (err) {
    next(err);
  }
};
