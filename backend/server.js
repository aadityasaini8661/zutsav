require('dotenv').config();
const http      = require('http');
const { Server } = require('socket.io');
const jwt        = require('jsonwebtoken');
const app        = require('./src/app');
const connectDB  = require('./src/config/database');
const seedAdmin  = require('./src/utils/seedAdmin');
const { setIO }  = require('./src/utils/notificationService');
const { startDeletionCleanupJob } = require('./src/utils/cleanupJobs');

const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
  await seedAdmin();

  const server = http.createServer(app);

  // ── Socket.IO setup ─────────────────────────────────────────
  const allowedOrigins = [
    process.env.CLIENT_URL,
    process.env.CLIENT_URL_ALT,
    'http://localhost:3000',
  ].filter(Boolean).map(o => o.replace(/\/$/, ''));

  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`Socket.IO CORS: origin ${origin} not allowed`));
      },
      credentials: true,
    },
  });

  // Auth middleware: validate JWT on socket connection
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    socket.join(`user_${userId}`);
    console.log(`[Socket.IO] User ${userId} connected (socket: ${socket.id})`);

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] User ${userId} disconnected`);
    });
  });

  // Make io available to notification service
  setIO(io);

  // Start scheduled cleanup jobs
  startDeletionCleanupJob();

  server.listen(PORT, () => {
    console.log(`🚀 Zutsav server running on http://localhost:${PORT}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use. Change PORT in .env or stop the other process.`);
    } else {
      console.error('❌ Server error:', err.message);
    }
    process.exit(1);
  });
});
