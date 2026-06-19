const { computePanchang } = require('../utils/panchang');

// GET /api/panchang?date=YYYY-MM-DD&lat=28.6&lon=77.2
exports.getPanchang = async (req, res, next) => {
  try {
    const { date, lat, lon } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid date format. Use YYYY-MM-DD.' });
    }
    targetDate.setHours(6, 0, 0, 0); // mid-morning for calculations

    const latDeg = lat ? parseFloat(lat) : 28.6139;
    const lonDeg = lon ? parseFloat(lon) : 77.2090;

    const panchang = computePanchang(targetDate, latDeg, lonDeg);
    res.json({ success: true, panchang });
  } catch (err) {
    next(err);
  }
};

// GET /api/panchang/week?date=YYYY-MM-DD
exports.getWeekPanchang = async (req, res, next) => {
  try {
    const { date, lat, lon } = req.query;
    const start = date ? new Date(date) : new Date();
    const latDeg = lat ? parseFloat(lat) : 28.6139;
    const lonDeg = lon ? parseFloat(lon) : 77.2090;

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      d.setHours(6, 0, 0, 0);
      days.push(computePanchang(d, latDeg, lonDeg));
    }
    res.json({ success: true, panchang: days });
  } catch (err) {
    next(err);
  }
};
