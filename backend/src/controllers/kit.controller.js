const Kit     = require('../models/Kit');
const Product = require('../models/Product');

const makeSlug = (name) => name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

/**
 * Calculate the total cost of kit items from product prices.
 * Returns { totalCost, computedSellingPrice } based on discountType + discountValue.
 */
const computeKitPricing = async (items, discountType, discountValue) => {
  let totalCost = 0;
  for (const item of items) {
    const product = await Product.findById(item.productId).select('price salePrice');
    if (product) {
      const unitPrice = product.salePrice || product.price;
      totalCost += unitPrice * item.quantity;
    }
  }

  let computedSellingPrice = totalCost;
  if (discountType === 'percentage' && discountValue > 0) {
    computedSellingPrice = totalCost - (totalCost * discountValue) / 100;
  } else if (discountType === 'fixed' && discountValue > 0) {
    computedSellingPrice = totalCost - discountValue;
  }
  computedSellingPrice = Math.max(0, Math.round(computedSellingPrice));

  return { totalCost: Math.round(totalCost), computedSellingPrice };
};

// GET /api/marketplace/kits
exports.getKits = async (req, res, next) => {
  try {
    const { featured, page = 1, limit = 12 } = req.query;
    const query = { isActive: true };
    if (featured === 'true') query.isFeatured = true;

    const kits = await Kit.find(query)
      .populate({ path: 'items.productId', select: 'name price salePrice images stock isActive' })
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(+limit)
      .skip((+page - 1) * +limit);

    const total = await Kit.countDocuments(query);
    res.json({ success: true, kits, total, page: +page });
  } catch (err) {
    next(err);
  }
};

// GET /api/marketplace/kits/:id
exports.getKit = async (req, res, next) => {
  try {
    const kit = await Kit.findOne({ _id: req.params.id, isActive: true })
      .populate({ path: 'items.productId', select: 'name price salePrice images stock isActive' });
    if (!kit) return res.status(404).json({ success: false, message: 'Kit not found' });
    res.json({ success: true, kit });
  } catch (err) {
    next(err);
  }
};

// POST /api/marketplace/kits  [admin]
exports.createKit = async (req, res, next) => {
  try {
    const { name, description, discountType = 'percentage', discountValue = 0, discountPrice, items: rawItems, isFeatured } = req.body;
    const items = typeof rawItems === 'string' ? JSON.parse(rawItems) : rawItems;

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product || !product.isActive)
        return res.status(400).json({ success: false, message: `Product ${item.productId} not found or inactive` });
      if (product.stock < 1)
        return res.status(400).json({ success: false, message: `Product "${product.name}" is out of stock` });
    }

    const { totalCost, computedSellingPrice } = await computeKitPricing(items, discountType, +discountValue);

    // Admin may manually override selling price
    const sellingPrice = discountPrice !== undefined && discountPrice !== '' ? +discountPrice : computedSellingPrice;

    const baseSlug = makeSlug(name);
    let slug = baseSlug;
    let suffix = 1;
    while (await Kit.findOne({ slug })) { slug = `${baseSlug}-${suffix++}`; }

    const image = req.file ? `uploads/products/${req.file.filename}` : null;

    const kit = await Kit.create({
      name, slug, description,
      items,
      totalCost,
      discountType,
      discountValue: +discountValue,
      discountPrice: sellingPrice,
      image,
      isFeatured: isFeatured === 'true' || isFeatured === true,
    });
    res.status(201).json({ success: true, kit });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/marketplace/kits/:id  [admin]
exports.updateKit = async (req, res, next) => {
  try {
    const updates = { ...req.body };
    if (req.file) updates.image = `uploads/products/${req.file.filename}`;
    if (typeof updates.items === 'string') updates.items = JSON.parse(updates.items);

    if (updates.items) {
      for (const item of updates.items) {
        const product = await Product.findById(item.productId);
        if (!product || !product.isActive)
          return res.status(400).json({ success: false, message: `Product ${item.productId} not found or inactive` });
      }
      const { totalCost, computedSellingPrice } = await computeKitPricing(
        updates.items,
        updates.discountType || 'percentage',
        +(updates.discountValue || 0)
      );
      updates.totalCost = totalCost;
      if (updates.discountPrice === undefined || updates.discountPrice === '') {
        updates.discountPrice = computedSellingPrice;
      }
    }

    if (updates.discountValue !== undefined) updates.discountValue = +updates.discountValue;
    if (updates.discountPrice !== undefined) updates.discountPrice = +updates.discountPrice;

    const kit = await Kit.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!kit) return res.status(404).json({ success: false, message: 'Kit not found' });
    res.json({ success: true, kit });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/marketplace/kits/:id  [admin]
exports.deleteKit = async (req, res, next) => {
  try {
    await Kit.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Kit removed' });
  } catch (err) {
    next(err);
  }
};

// GET /api/marketplace/kits/compute-price  [admin helper]
exports.computePrice = async (req, res, next) => {
  try {
    const { items: rawItems, discountType = 'percentage', discountValue = 0 } = req.body;
    const items = typeof rawItems === 'string' ? JSON.parse(rawItems) : rawItems;
    if (!items?.length) return res.json({ success: true, totalCost: 0, computedSellingPrice: 0 });

    const result = await computeKitPricing(items, discountType, +discountValue);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};
