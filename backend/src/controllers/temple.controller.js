const axios  = require('axios');
const Temple = require('../models/Temple');

const geocode = async (address, city, state) => {
  try {
    const q = encodeURIComponent(`${address}, ${city}, ${state}, India`);
    const { data } = await axios.get(
      `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`,
      { headers: { 'User-Agent': 'Zutsav/1.0 (zutsav@example.com)' }, timeout: 5000 }
    );
    if (data.length > 0) return { latitude: +data[0].lat, longitude: +data[0].lon };
  } catch (_) { /* geocoding is best-effort */ }
  return {};
};

// GET /api/temples  — public
exports.getTemples = async (req, res, next) => {
  try {
    const { search, state, page = 1, limit = 20 } = req.query;
    const query = { isActive: true };
    if (state)  query.state  = new RegExp(state, 'i');
    if (search) query.name   = new RegExp(search, 'i');

    const temples = await Temple.find(query)
      .sort({ name: 1 })
      .limit(+limit)
      .skip((+page - 1) * +limit);

    const total = await Temple.countDocuments(query);
    res.json({ success: true, temples, total, page: +page });
  } catch (err) {
    next(err);
  }
};

// GET /api/temples/:id  — public
exports.getTemple = async (req, res, next) => {
  try {
    const temple = await Temple.findOne({ _id: req.params.id, isActive: true });
    if (!temple) return res.status(404).json({ success: false, message: 'Temple not found' });
    res.json({ success: true, temple });
  } catch (err) {
    next(err);
  }
};

// POST /api/temples  [admin]
exports.createTemple = async (req, res, next) => {
  try {
    const { name, address, city, state, pincode, description, latitude, longitude } = req.body;
    const images = req.files ? req.files.map((f) => `uploads/products/${f.filename}`) : [];

    // Use provided coords from map picker, fall back to geocoding from address
    let coords = {};
    if (latitude && longitude) {
      coords = { latitude: +latitude, longitude: +longitude };
    } else {
      coords = await geocode(address, city, state);
    }

    const temple = await Temple.create({
      name, address, city, state, pincode, description,
      images,
      latitude:  coords.latitude,
      longitude: coords.longitude,
    });

    res.status(201).json({ success: true, temple });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/temples/:id  [admin]
exports.updateTemple = async (req, res, next) => {
  try {
    const updates = { ...req.body };
    if (req.files?.length) updates.images = req.files.map((f) => `uploads/products/${f.filename}`);

    // Re-geocode if address fields changed
    if (updates.address || updates.city || updates.state) {
      const existing = await Temple.findById(req.params.id);
      const coords = await geocode(
        updates.address  || existing.address,
        updates.city     || existing.city,
        updates.state    || existing.state
      );
      if (coords.latitude) { updates.latitude = coords.latitude; updates.longitude = coords.longitude; }
    }

    const temple = await Temple.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!temple) return res.status(404).json({ success: false, message: 'Temple not found' });
    res.json({ success: true, temple });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/temples/:id  [admin]
exports.deleteTemple = async (req, res, next) => {
  try {
    await Temple.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Temple removed' });
  } catch (err) {
    next(err);
  }
};
