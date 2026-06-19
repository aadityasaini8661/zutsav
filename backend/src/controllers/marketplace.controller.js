const Product = require('../models/Product');
const Order   = require('../models/Order');
const { createPhonePeOrder, checkPhonePeStatus, verifyWebhookChecksum } = require('../utils/phonepe');
const { notifyOrderPlaced } = require('../utils/notificationService');

// GET /api/marketplace/products
exports.getProducts = async (req, res, next) => {
  try {
    const { category, featured, page = 1, limit = 12, search } = req.query;
    const query = { isActive: true };
    if (category) query.category = category;
    if (featured === 'true') query.isFeatured = true;
    if (search) query.name = new RegExp(search, 'i');

    console.log('[marketplace] getProducts query:', JSON.stringify(query));

    const products = await Product.find(query)
      .sort({ isFeatured: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments(query);
    console.log(`[marketplace] getProducts result: ${products.length} products (total=${total})`);
    res.json({ success: true, products, total });
  } catch (err) {
    console.error('[marketplace] getProducts error:', err.message);
    next(err);
  }
};

// GET /api/marketplace/products/:slug
exports.getProductBySlug = async (req, res, next) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, isActive: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (err) {
    next(err);
  }
};

// POST /api/marketplace/products  [admin]
exports.createProduct = async (req, res, next) => {
  try {
    const { name, category, description, price, salePrice, stock, tags } = req.body;
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const images = req.files ? req.files.map((f) => `uploads/products/${f.filename}`) : [];

    const product = await Product.create({
      name, slug, category, description,
      price: +price,
      salePrice: salePrice ? +salePrice : null,
      stock: +stock || 0,
      images,
      tags: tags ? JSON.parse(tags) : [],
    });
    res.status(201).json({ success: true, product });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/marketplace/products/:id  [admin]
exports.updateProduct = async (req, res, next) => {
  try {
    const updates = req.body;
    if (req.files?.length) updates.images = req.files.map((f) => `uploads/products/${f.filename}`);
    if (typeof updates.tags === 'string') updates.tags = JSON.parse(updates.tags);
    const product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json({ success: true, product });
  } catch (err) {
    next(err);
  }
};

// POST /api/marketplace/orders/create  [user] — creates order and initiates PhonePe payment
exports.createOrder = async (req, res, next) => {
  try {
    const { items, shippingAddress } = req.body;

    // Validate stock and compute total
    let totalAmount = 0;
    const orderItems = [];
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product || !product.isActive) return res.status(400).json({ success: false, message: `Product not found: ${item.productId}` });
      if (product.stock < item.quantity) return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}` });
      const price = product.salePrice || product.price;
      totalAmount += price * item.quantity;
      orderItems.push({ productId: product._id, name: product.name, price, quantity: item.quantity, total: price * item.quantity });
    }

    const merchantTransactionId = `ZOM_${Date.now()}_${req.user._id.toString().slice(-6)}`;
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const order = await Order.create({
      userId: req.user._id,
      items: orderItems,
      totalAmount,
      shippingAddress,
      phonePeMerchantTransactionId: merchantTransactionId,
      paymentProvider: 'phonepe',
      status: 'pending_payment',
      statusTimeline: [{ status: 'pending_payment', timestamp: new Date() }],
    });

    const { redirectUrl } = await createPhonePeOrder({
      merchantTransactionId,
      amount: totalAmount,
      userId: req.user._id.toString(),
      callbackUrl: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/marketplace/orders/phonepe-webhook`,
      redirectUrl: `${baseUrl}/payment-callback/${merchantTransactionId}`,
    });

    notifyOrderPlaced(req.user._id, order.orderNumber || order._id).catch(() => {});

    res.status(201).json({ success: true, order, redirectUrl });
  } catch (err) {
    next(err);
  }
};

// GET /api/marketplace/orders/verify-phonepe/:merchantTransactionId  [user]
exports.verifyPhonePeOrder = async (req, res, next) => {
  try {
    const { merchantTransactionId } = req.params;
    const result = await checkPhonePeStatus(merchantTransactionId);

    const order = await Order.findOne({ phonePeMerchantTransactionId: merchantTransactionId });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (result.success && order.status === 'pending_payment') {
      order.status = 'paid';
      order.phonePeTransactionId = result.transactionId;
      order.statusTimeline = order.statusTimeline || [];
      order.statusTimeline.push({ status: 'paid', timestamp: new Date(), note: 'Payment confirmed via PhonePe' });
      await order.save();

      // Reduce stock (idempotent — only happens when status was pending_payment)
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } });
      }
    }

    res.json({
      success: result.success,
      state:   result.state,
      order:   result.success ? order : undefined,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/marketplace/orders/phonepe-webhook  [public webhook]
exports.phonePeWebhook = async (req, res, next) => {
  try {
    const { response } = req.body;
    const xVerify = req.headers['x-verify'];
    if (!await verifyWebhookChecksum(response, xVerify)) {
      return res.status(400).json({ success: false, message: 'Invalid checksum' });
    }

    const decoded = JSON.parse(Buffer.from(response, 'base64').toString());
    const txId    = decoded?.data?.merchantTransactionId;
    if (!txId) return res.status(400).json({ success: false });

    const isSuccess = decoded?.code === 'PAYMENT_SUCCESS';
    if (isSuccess) {
      const order = await Order.findOne({ phonePeMerchantTransactionId: txId, status: 'pending_payment' });
      if (order) {
        order.status = 'paid';
        order.phonePeTransactionId = decoded?.data?.transactionId;
        order.statusTimeline = order.statusTimeline || [];
        order.statusTimeline.push({ status: 'paid', timestamp: new Date(), note: 'Payment confirmed via PhonePe webhook' });
        await order.save();
        for (const item of order.items) {
          await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } });
        }
      }
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// POST /api/marketplace/orders/verify  [legacy — kept for backward compat]
exports.verifyOrder = async (req, res, next) => {
  res.status(410).json({ success: false, message: 'Razorpay payments are no longer supported. Use PhonePe.' });
};

// GET /api/marketplace/orders/my  [user]
exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    next(err);
  }
};
