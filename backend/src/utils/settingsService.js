/**
 * Settings Service — reads from DB with 5-minute in-memory cache.
 * Falls back to process.env if the DB value is blank.
 *
 * Usage:
 *   const settings = require('./settingsService');
 *   const key = await settings.get('groqApiKey', process.env.GROQ_API_KEY);
 */

let _cache = null;
let _cacheAt = 0;
const TTL = 5 * 60 * 1000; // 5 minutes

async function _load() {
  // Lazy-require to avoid circular-dep issues at module load time
  const SystemSettings = require('../models/SystemSettings');
  const doc = await SystemSettings.findOne().lean();
  _cache = doc || {};
  _cacheAt = Date.now();
}

/** Force-reload cache (call after admin saves settings). */
function invalidate() {
  _cache = null;
  _cacheAt = 0;
}

/** Return entire settings object (cached). */
async function all() {
  if (!_cache || Date.now() - _cacheAt > TTL) await _load();
  return _cache;
}

/**
 * Read a single field, with an optional env/default fallback.
 * Returns the DB value if non-empty, otherwise the fallback.
 */
async function get(field, fallback = null) {
  const s = await all();
  const v = s[field];
  if (v !== undefined && v !== null && v !== '') return v;
  return fallback;
}

module.exports = { all, get, invalidate };
