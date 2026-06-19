const Festival = require('../models/Festival');
const SyncLog  = require('../models/SyncLog');
const axios    = require('axios');

const MONTH_NAMES = [
  'january','february','march','april','may','june',
  'july','august','september','october','november','december',
];

// GET /api/festivals  — public
exports.getFestivals = async (req, res, next) => {
  try {
    const { year, month, date, upcoming, limit } = req.query;
    const query = { isActive: true };

    if (date) {
      const d = new Date(date);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      query.date = { $gte: d, $lt: next };
    } else if (upcoming === 'true') {
      // Return festivals from today onwards, ordered by nearest first
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      query.date = { $gte: today };
    } else if (year || month) {
      const y = parseInt(year) || new Date().getFullYear();
      const m = month ? parseInt(month) - 1 : 0;
      const start = new Date(y, month ? m : 0, 1);
      const end   = new Date(y, month ? m + 1 : 12, 0);
      query.date  = { $gte: start, $lte: end };
    }

    let q = Festival.find(query).sort({ date: 1 });
    if (limit) q = q.limit(parseInt(limit));
    const festivals = await q;
    res.json({ success: true, festivals });
  } catch (err) {
    next(err);
  }
};

// POST /api/festivals  [admin] — create single festival manually
exports.createFestival = async (req, res, next) => {
  try {
    const { name, date, tithiDate, panchang, description } = req.body;
    const image = req.file ? `uploads/profiles/${req.file.filename}` : null;
    const festival = await Festival.create({ name, date, tithiDate, panchang, description, image, source: 'manual' });
    res.status(201).json({ success: true, festival });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/festivals/:id  [admin]
exports.updateFestival = async (req, res, next) => {
  try {
    const updates = req.body;
    if (req.file) updates.image = `uploads/profiles/${req.file.filename}`;
    const festival = await Festival.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json({ success: true, festival });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/festivals/:id  [admin]
exports.deleteFestival = async (req, res, next) => {
  try {
    await Festival.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /api/festivals/sync  [admin]
// Body: { month: 1–12, year: 2026, force: false }
//
// Calls the Google Apps Script web app, validates the JSON response,
// then upserts records into MongoDB (unique key: date + name).
// ---------------------------------------------------------------------------
exports.syncFromGoogleSheets = async (req, res, next) => {
  const startTime = new Date();
  try {
    const { month, year, force } = req.body;
    const monthNum = parseInt(month);
    const yearNum  = parseInt(year);

    if (!monthNum || monthNum < 1 || monthNum > 12)
      return res.status(400).json({ success: false, message: 'Valid month (1–12) is required' });
    if (!yearNum || yearNum < 2000 || yearNum > 2100)
      return res.status(400).json({ success: false, message: 'Valid year (2000–2100) is required' });

    // Cache check — skip if already synced successfully within the last hour, unless forced
    const lastSync = await SyncLog.findOne({
      month: monthNum, year: yearNum, status: 'success',
    }).sort({ createdAt: -1 });

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (lastSync && new Date(lastSync.createdAt) > oneHourAgo && !force) {
      const minutesAgo = Math.round((Date.now() - new Date(lastSync.createdAt).getTime()) / 60000);
      return res.json({
        success: false,
        alreadyCached: true,
        minutesAgo,
        message: `Data for ${MONTH_NAMES[monthNum - 1]} ${yearNum} was synced ${minutesAgo} minute(s) ago. Send force=true to re-sync.`,
        lastSync,
      });
    }

    const appsScriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
    if (!appsScriptUrl) {
      return res.status(503).json({
        success: false,
        message: 'GOOGLE_APPS_SCRIPT_URL is not configured. Add it to your .env file.',
      });
    }

    // ── Fetch from Google Apps Script ──────────────────────────────────────
    let festivals;
    try {
      const monthName = MONTH_NAMES[monthNum - 1];
      const { data } = await axios.get(appsScriptUrl, {
        params:  { month: monthName, year: yearNum },
        timeout: 90000,
        headers: { Accept: 'application/json' },
        // Google Apps Script redirects once — follow it
        maxRedirects: 5,
      });

      if (Array.isArray(data)) {
        festivals = data;
      } else if (data && Array.isArray(data.festivals)) {
        festivals = data.festivals;
      } else if (data && Array.isArray(data.data)) {
        festivals = data.data;
      } else {
        throw new Error(
          `Unexpected response format. Expected a JSON array. Got: ${JSON.stringify(data).slice(0, 300)}`
        );
      }
    } catch (fetchErr) {
      await SyncLog.create({
        month: monthNum, year: yearNum, startTime, endTime: new Date(),
        status: 'failed', error: fetchErr.message,
      });
      return res.status(502).json({
        success: false,
        message: `Failed to fetch data from Google Apps Script: ${fetchErr.message}`,
      });
    }

    // ── Empty response ─────────────────────────────────────────────────────
    if (!festivals.length) {
      const endTime = new Date();
      await SyncLog.create({
        month: monthNum, year: yearNum, startTime, endTime,
        recordsImported: 0, recordsUpdated: 0, recordsSkipped: 0,
        status: 'success',
      });
      return res.json({
        success: true,
        message: 'Sync complete — Google Apps Script returned no festival data for this month.',
        report: { imported: 0, updated: 0, skipped: 0 },
      });
    }

    // ── Upsert each record ─────────────────────────────────────────────────
    const report = { imported: 0, updated: 0, skipped: 0 };

    for (const item of festivals) {
      try {
        // Gracefully skip records missing required fields
        if (!item.festivalName || !item.date) { report.skipped++; continue; }

        const parsedDate = new Date(item.date);
        if (isNaN(parsedDate.getTime()))       { report.skipped++; continue; }
        parsedDate.setUTCHours(0, 0, 0, 0);

        const festivalName = String(item.festivalName).trim();
        if (!festivalName)                     { report.skipped++; continue; }

        const tithi = item.tithi ? String(item.tithi).trim() : '';

        const existing = await Festival.findOne({ date: parsedDate, name: festivalName });

        if (existing) {
          await Festival.findByIdAndUpdate(existing._id, {
            tithiDate: tithi || existing.tithiDate,
            source:    'googlesheets',
            isActive:  true,
          });
          report.updated++;
        } else {
          await Festival.create({
            name:      festivalName,
            date:      parsedDate,
            tithiDate: tithi,
            source:    'googlesheets',
            isActive:  true,
            dataType:  tithi ? 'mixed' : 'festival',
          });
          report.imported++;
        }
      } catch (_) {
        report.skipped++;
      }
    }

    const endTime = new Date();
    await SyncLog.create({
      month: monthNum, year: yearNum, startTime, endTime,
      recordsImported: report.imported,
      recordsUpdated:  report.updated,
      recordsSkipped:  report.skipped,
      status: 'success',
    });

    res.json({
      success: true,
      message: `Sync complete: ${report.imported} imported, ${report.updated} updated, ${report.skipped} skipped`,
      report,
    });
  } catch (err) {
    try {
      await SyncLog.create({
        month: req.body?.month, year: req.body?.year,
        startTime, endTime: new Date(),
        status: 'failed', error: err.message,
      });
    } catch (_) {}
    next(err);
  }
};

// GET /api/festivals/sync-logs  [admin]
exports.getSyncLogs = async (req, res, next) => {
  try {
    const logs = await SyncLog.find().sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, logs });
  } catch (err) {
    next(err);
  }
};
