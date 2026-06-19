const Livestream = require('../models/Livestream');
const Temple     = require('../models/Temple');

// GET /api/livestreams  — all authenticated users
exports.getLivestreams = async (req, res, next) => {
  try {
    const { templeId } = req.query;
    const query = { isActive: true };
    if (templeId) query.templeId = templeId;

    const streams = await Livestream.find(query)
      .populate('templeId', 'name city state')
      .sort({ createdAt: -1 });

    res.json({ success: true, livestreams: streams });
  } catch (err) {
    next(err);
  }
};

// POST /api/livestreams  [admin]
exports.createLivestream = async (req, res, next) => {
  try {
    const { templeId, title, description, youtubeUrl } = req.body;
    const temple = await Temple.findOne({ _id: templeId, isActive: true });
    if (!temple) return res.status(404).json({ success: false, message: 'Temple not found' });

    const stream = await Livestream.create({ templeId, title, description, youtubeUrl });
    res.status(201).json({ success: true, livestream: stream });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/livestreams/:id  [admin]
exports.updateLivestream = async (req, res, next) => {
  try {
    const stream = await Livestream.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!stream) return res.status(404).json({ success: false, message: 'Livestream not found' });
    res.json({ success: true, livestream: stream });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/livestreams/:id  [admin]
exports.deleteLivestream = async (req, res, next) => {
  try {
    await Livestream.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Livestream removed' });
  } catch (err) {
    next(err);
  }
};
