const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');

const app = express();

// Security
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));

// Auth routes get a tighter limit to prevent brute-force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again after 15 minutes.' },
});

// General API limit — 500 requests per 15 minutes per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please slow down and try again shortly.' },
});

app.use('/api/auth', authLimiter);
app.use('/api/', apiLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Request monitoring — logs endpoints that are called more than 20 times/minute
const _reqCounts = {};
app.use('/api/', (req, res, next) => {
  const key = `${req.method} ${req.path.replace(/\/[a-f0-9]{24}/gi, '/:id')}`;
  const now = Date.now();
  if (!_reqCounts[key] || now - _reqCounts[key].since > 60_000) {
    _reqCounts[key] = { count: 1, since: now };
  } else {
    _reqCounts[key].count++;
    if (_reqCounts[key].count === 20) {
      console.warn(`[RATE MONITOR] High frequency: ${key} — ${_reqCounts[key].count} req/min`);
    }
  }
  next();
});

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth',             require('./routes/auth.routes'));
app.use('/api/users',            require('./routes/user.routes'));
app.use('/api/pandits',          require('./routes/pandit.routes'));
app.use('/api/pandit/my-poojas', require('./routes/panditPooja.routes'));
app.use('/api/admin',            require('./routes/admin.routes'));
app.use('/api/masters',          require('./routes/masters.routes'));
app.use('/api/bookings',         require('./routes/booking.routes'));
app.use('/api/poojas',           require('./routes/pooja.routes'));
app.use('/api/festivals',        require('./routes/festival.routes'));
app.use('/api/marketplace',      require('./routes/marketplace.routes'));
app.use('/api/temples',          require('./routes/temple.routes'));
app.use('/api/livestreams',      require('./routes/livestream.routes'));
app.use('/api/ai',               require('./routes/ai.routes'));
app.use('/api/panchang',         require('./routes/panchang.routes'));
app.use('/api/referral',         require('./routes/referral.routes'));
app.use('/api/notifications',    require('./routes/notification.routes'));
app.use('/api/comm',             require('./routes/comm.routes'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

module.exports = app;
