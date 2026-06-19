const Pooja  = require('../models/Pooja');
const Pandit = require('../models/Pandit');

const makeSlug = (name) => name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

// GET /api/pandit/my-poojas
exports.getMyPoojas = async (req, res, next) => {
  try {
    const pandit = await Pandit.findOne({ userId: req.user._id });
    if (!pandit) return res.status(404).json({ success: false, message: 'Pandit profile not found' });

    const poojas = await Pooja.find({ panditId: pandit._id })
      .populate('categoryId', 'name slug')
      .sort({ createdAt: -1 });

    res.json({ success: true, poojas });
  } catch (err) {
    next(err);
  }
};

// POST /api/pandit/my-poojas
exports.createMyPooja = async (req, res, next) => {
  try {
    const pandit = await Pandit.findOne({ userId: req.user._id });
    if (!pandit) return res.status(404).json({ success: false, message: 'Pandit profile not found' });
    if (pandit.status !== 'approved') return res.status(403).json({ success: false, message: 'Only approved pandits can create poojas' });

    const { name, categoryId, description, shortDesc, price, duration, requirements, benefits, languages } = req.body;
    const baseSlug = makeSlug(name);
    let slug = baseSlug;
    let suffix = 1;
    while (await Pooja.findOne({ slug })) { slug = `${baseSlug}-${suffix++}`; }

    const image = req.file ? `uploads/profiles/${req.file.filename}` : null;

    const pooja = await Pooja.create({
      name, categoryId, slug, description, shortDesc,
      price: +price, duration, image,
      requirements: requirements ? JSON.parse(requirements) : [],
      benefits:     benefits     ? JSON.parse(benefits)     : [],
      languages:    languages    ? JSON.parse(languages)    : [],
      createdByRole:  'pandit',
      panditId:       pandit._id,
      approvalStatus: 'pending',  // must be approved by admin before visible
    });

    res.status(201).json({ success: true, pooja });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/pandit/my-poojas/:id
exports.updateMyPooja = async (req, res, next) => {
  try {
    const pandit = await Pandit.findOne({ userId: req.user._id });
    if (!pandit) return res.status(404).json({ success: false, message: 'Pandit profile not found' });

    const pooja = await Pooja.findOne({ _id: req.params.id, panditId: pandit._id });
    if (!pooja) return res.status(404).json({ success: false, message: 'Pooja not found' });

    const updates = { ...req.body };
    if (req.file) updates.image = `uploads/profiles/${req.file.filename}`;
    ['requirements', 'benefits', 'languages'].forEach((k) => {
      if (typeof updates[k] === 'string') updates[k] = JSON.parse(updates[k]);
    });

    // Any edit by pandit resets to pending so admin re-approves
    updates.approvalStatus = 'pending';
    delete updates.panditId;
    delete updates.createdByRole;

    const updated = await Pooja.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json({ success: true, pooja: updated });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/pandit/my-poojas/:id
exports.deleteMyPooja = async (req, res, next) => {
  try {
    const pandit = await Pandit.findOne({ userId: req.user._id });
    if (!pandit) return res.status(404).json({ success: false, message: 'Pandit profile not found' });

    const pooja = await Pooja.findOne({ _id: req.params.id, panditId: pandit._id });
    if (!pooja) return res.status(404).json({ success: false, message: 'Pooja not found' });

    await Pooja.findByIdAndUpdate(req.params.id, { isActive: false, approvalStatus: 'inactive' });
    res.json({ success: true, message: 'Pooja removed' });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/pandits/poojas/:id/approve  — admin approves/rejects a pandit pooja
exports.adminApprovePanditPooja = async (req, res, next) => {
  try {
    const { approvalStatus, adminNote } = req.body;
    if (!['approved', 'rejected'].includes(approvalStatus)) {
      return res.status(400).json({ success: false, message: 'approvalStatus must be approved or rejected' });
    }
    const pooja = await Pooja.findOneAndUpdate(
      { _id: req.params.id, createdByRole: 'pandit' },
      { approvalStatus, adminNote: adminNote || '' },
      { new: true }
    );
    if (!pooja) return res.status(404).json({ success: false, message: 'Pandit pooja not found' });
    res.json({ success: true, pooja });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/pandits/poojas  — admin views all pandit poojas
exports.adminGetPanditPoojas = async (req, res, next) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;
    const query = { createdByRole: 'pandit', approvalStatus: status };

    const poojas = await Pooja.find(query)
      .populate('categoryId', 'name')
      .populate('panditId', 'name phone email')
      .sort({ createdAt: -1 })
      .limit(+limit)
      .skip((+page - 1) * +limit);

    const total = await Pooja.countDocuments(query);
    res.json({ success: true, poojas, total });
  } catch (err) {
    next(err);
  }
};
