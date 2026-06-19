const PoojaCategory = require('../models/PoojaCategory');
const Pooja         = require('../models/Pooja');

// ─── Categories ──────────────────────────────────────────────

// GET /api/poojas/categories
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await PoojaCategory.find({ isActive: true }).sort({ sortOrder: 1 });
    res.json({ success: true, categories });
  } catch (err) {
    next(err);
  }
};

// POST /api/poojas/categories  [admin]
exports.createCategory = async (req, res, next) => {
  try {
    const { name, description, sortOrder } = req.body;
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const image = req.file ? `uploads/profiles/${req.file.filename}` : null;
    const cat = await PoojaCategory.create({ name, slug, description, image, sortOrder });
    res.status(201).json({ success: true, category: cat });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/poojas/categories/:id  [admin]
exports.updateCategory = async (req, res, next) => {
  try {
    const updates = req.body;
    if (req.file) updates.image = `uploads/profiles/${req.file.filename}`;
    const cat = await PoojaCategory.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json({ success: true, category: cat });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/poojas/categories/:id  [admin]
exports.deleteCategory = async (req, res, next) => {
  try {
    await PoojaCategory.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Category deactivated' });
  } catch (err) {
    next(err);
  }
};

// ─── Poojas ──────────────────────────────────────────────────

// GET /api/poojas  — public; only approved poojas
exports.getPoojas = async (req, res, next) => {
  try {
    const { categoryId, featured, page = 1, limit = 12, search } = req.query;
    const query = { isActive: true, approvalStatus: 'approved' };
    if (categoryId) query.categoryId = categoryId;
    if (featured === 'true') query.isFeatured = true;
    if (search) query.name = new RegExp(search, 'i');

    const poojas = await Pooja.find(query)
      .populate('categoryId', 'name slug')
      .sort({ isFeatured: -1, totalBookings: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Pooja.countDocuments(query);
    res.json({ success: true, poojas, total, page: +page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

// GET /api/poojas/:slug  — public; only approved poojas
exports.getPoojaBySlug = async (req, res, next) => {
  try {
    const pooja = await Pooja.findOne({ slug: req.params.slug, isActive: true, approvalStatus: 'approved' })
      .populate('categoryId', 'name slug');
    if (!pooja) return res.status(404).json({ success: false, message: 'Pooja not found' });
    res.json({ success: true, pooja });
  } catch (err) {
    next(err);
  }
};

// POST /api/poojas  [admin]
exports.createPooja = async (req, res, next) => {
  try {
    const { name, categoryId, description, shortDesc, price, duration, requirements, benefits, languages } = req.body;
    const slug  = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const image = req.file ? `uploads/profiles/${req.file.filename}` : null;

    const pooja = await Pooja.create({
      name, categoryId, slug, description, shortDesc,
      price: +price, duration, image,
      requirements: requirements ? JSON.parse(requirements) : [],
      benefits:     benefits     ? JSON.parse(benefits)     : [],
      languages:    languages    ? JSON.parse(languages)    : [],
    });

    res.status(201).json({ success: true, pooja });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/poojas/:id  [admin]
exports.updatePooja = async (req, res, next) => {
  try {
    const updates = req.body;
    if (req.file) updates.image = `uploads/profiles/${req.file.filename}`;
    ['requirements', 'benefits', 'languages'].forEach((k) => {
      if (typeof updates[k] === 'string') updates[k] = JSON.parse(updates[k]);
    });
    const pooja = await Pooja.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json({ success: true, pooja });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/poojas/:id  [admin]
exports.deletePooja = async (req, res, next) => {
  try {
    await Pooja.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Pooja deactivated' });
  } catch (err) {
    next(err);
  }
};
