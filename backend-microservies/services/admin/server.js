require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const compression = require('compression');

const { connectDB } = require('../../shared/db');
const { Product, Order, User, Notification, ActivityLog, Category, Return } = require('../../shared/models');
const { authMiddleware } = require('../../shared/auth');

const app = express();
const PORT = process.env.ADMIN_PORT || 5006;

app.use(compression());
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

connectDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Admin service running on http://localhost:${PORT}`);
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', service: 'admin' });
});

// Admin Product APIs
app.post('/api/admin/products', authMiddleware, async (req, res) => {
  try {
    const { name, price, image, category, subCategory, description, rating, reviews, inStock } = req.body;

    const newProduct = new Product({
      name,
      price,
      image,
      category,
      subCategory,
      description,
      rating: rating || 4.5,
      reviews: reviews || 0,
      inStock: inStock !== undefined ? inStock : true,
    });

    await newProduct.save();
    res.status(201).json({ message: 'Product added successfully', product: newProduct });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.put('/api/admin/products/:id', authMiddleware, async (req, res) => {
  try {
    const { name, price, image, category, subCategory, description, rating, reviews, inStock } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (name) product.name = name;
    if (price) product.price = price;
    if (image) product.image = image;
    if (category) product.category = category;
    if (subCategory !== undefined) product.subCategory = subCategory;
    if (description) product.description = description;
    if (rating) product.rating = rating;
    if (reviews !== undefined) product.reviews = reviews;
    if (inStock !== undefined) product.inStock = inStock;

    await product.save();
    res.json({ message: 'Product updated successfully', product });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.delete('/api/admin/products/:id', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.patch('/api/admin/products/:id/toggle', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    product.inStock = !product.inStock;
    await product.save();

    res.json({ message: 'Product visibility toggled', product });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin Order APIs
app.get('/api/admin/orders', authMiddleware, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    let query = {};

    if (status && status !== 'All') query.status = status;
    if (search) query.trackingId = { $regex: search, $options: 'i' };

    const orders = await Order.find(query)
      .populate('user', 'name email phone')
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const normalizedOrders = orders.map(order => {
      const orderObj = order.toObject();
      if (!orderObj.user && orderObj.userId) orderObj.user = orderObj.userId;
      return orderObj;
    });

    const total = await Order.countDocuments(query);

    res.json({
      orders: normalizedOrders,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.put('/api/admin/orders/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (status === 'Shipped' && (!order.shipment || !order.shipment.trackingNumber)) {
      const carriers = ['BlueDart', 'FedEx', 'DHL Express', 'India Post', 'Delhivery'];
      const randomCarrier = carriers[Math.floor(Math.random() * carriers.length)];
      const trackingPrefix = randomCarrier === 'BlueDart' ? 'BLUE' :
        randomCarrier === 'FedEx' ? 'FDX' :
        randomCarrier === 'DHL Express' ? 'DHL' :
        randomCarrier === 'India Post' ? 'IP' : 'DLV';
      const trackingNumber = `${trackingPrefix}-${Date.now()}${Math.floor(Math.random() * 1000)}`;

      const daysToDeliver = Math.floor(Math.random() * 3) + 3;
      const estimatedDelivery = new Date();
      estimatedDelivery.setDate(estimatedDelivery.getDate() + daysToDeliver);

      order.shipment = {
        carrier: randomCarrier,
        trackingNumber,
        shippedDate: new Date(),
        estimatedDelivery,
        currentLocation: 'Warehouse - Dispatched',
        trackingHistory: [{
          status: 'Shipped',
          location: 'Warehouse',
          timestamp: new Date(),
          description: 'Package dispatched from warehouse'
        }]
      };
    }

    if (order.shipment && order.shipment.trackingHistory) {
      const locationMap = {
        Processing: 'Warehouse - Packing',
        Shipped: 'In Transit',
        Delivered: 'Customer Location',
        Cancelled: 'Warehouse - Returned'
      };

      order.shipment.trackingHistory.push({
        status,
        location: locationMap[status] || 'Unknown',
        timestamp: new Date(),
        description: `Order status updated to ${status}`
      });

      order.shipment.currentLocation = locationMap[status] || order.shipment.currentLocation;
    }

    order.status = status;
    await order.save();

    if (status) {
      const notification = new Notification({
        userId: order.userId,
        type: 'order',
        title: `Order ${status}`,
        message: `Your order #${order.trackingId} status is now ${status}.`,
        icon: 'package',
        orderId: order._id,
      });
      await notification.save();
    }

    res.json({ message: 'Order status updated', order });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/admin/stats', authMiddleware, async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();

    const totalRevenue = await Order.aggregate([
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);

    const ordersByStatus = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5);

    res.json({
      totalOrders,
      totalUsers,
      totalProducts,
      totalRevenue: totalRevenue[0]?.total || 0,
      ordersByStatus,
      recentOrders,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin User APIs
app.get('/api/admin/users', authMiddleware, async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    let query = {};

    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
        ],
      };
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      users,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/admin/users/:id', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.delete('/api/admin/users/:id', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.patch('/api/admin/users/:id/toggle-block', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isBlocked = !user.isBlocked;
    await user.save();

    res.json({ message: 'User status updated', user: { ...user.toObject(), password: undefined } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/admin/users/:id/activity', authMiddleware, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;

    const logs = await ActivityLog.find({ userId: req.params.id })
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await ActivityLog.countDocuments({ userId: req.params.id });

    res.json({
      logs,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin Category APIs
app.get('/api/admin/categories', authMiddleware, async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/admin/categories/:id', authMiddleware, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json({ category });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/admin/categories', authMiddleware, async (req, res) => {
  try {
    const { name, description, image, icon, status } = req.body;

    const newCategory = new Category({
      name,
      description,
      image,
      icon,
      status: status || 'active'
    });

    await newCategory.save();
    res.status(201).json({ message: 'Category created', category: newCategory });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.put('/api/admin/categories/:id', authMiddleware, async (req, res) => {
  try {
    const { name, description, image, icon, status } = req.body;
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    if (name) category.name = name;
    if (description) category.description = description;
    if (image) category.image = image;
    if (icon) category.icon = icon;
    if (status) category.status = status;

    category.updatedAt = new Date();
    await category.save();

    res.json({ message: 'Category updated', category });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.delete('/api/admin/categories/:id', authMiddleware, async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.patch('/api/admin/categories/:id/toggle', authMiddleware, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    category.status = category.status === 'active' ? 'inactive' : 'active';
    category.updatedAt = new Date();
    await category.save();

    res.json({ message: 'Category status updated', category });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin Subcategories
app.post('/api/admin/categories/:categoryId/subcategories', authMiddleware, async (req, res) => {
  try {
    const { name, description, image, status } = req.body;
    const category = await Category.findById(req.params.categoryId);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    category.subcategories.push({
      _id: new (require('mongoose').Types.ObjectId)(),
      name,
      description,
      image,
      status: status || 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    category.updatedAt = new Date();
    await category.save();

    res.status(201).json({ message: 'Subcategory created', category });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/admin/categories/:categoryId/subcategories', authMiddleware, async (req, res) => {
  try {
    const category = await Category.findById(req.params.categoryId);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    res.json({ subcategories: category.subcategories });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.put('/api/admin/categories/:categoryId/subcategories/:subcategoryId', authMiddleware, async (req, res) => {
  try {
    const { name, description, image, status } = req.body;
    const category = await Category.findById(req.params.categoryId);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    const subcategory = category.subcategories.id(req.params.subcategoryId);
    if (!subcategory) return res.status(404).json({ message: 'Subcategory not found' });

    if (name) subcategory.name = name;
    if (description) subcategory.description = description;
    if (image) subcategory.image = image;
    if (status) subcategory.status = status;
    subcategory.updatedAt = new Date();

    category.updatedAt = new Date();
    await category.save();

    res.json({ message: 'Subcategory updated', subcategory });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.delete('/api/admin/categories/:categoryId/subcategories/:subcategoryId', authMiddleware, async (req, res) => {
  try {
    const category = await Category.findById(req.params.categoryId);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    const subcategory = category.subcategories.id(req.params.subcategoryId);
    if (!subcategory) return res.status(404).json({ message: 'Subcategory not found' });

    subcategory.deleteOne();
    category.updatedAt = new Date();
    await category.save();

    res.json({ message: 'Subcategory deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin Inventory APIs
app.get('/api/admin/inventory', authMiddleware, async (req, res) => {
  try {
    const { stockStatus, sortBy, page = 1, limit = 50 } = req.query;
    let query = {};
    if (stockStatus === 'low') query.stock = { $lte: 10 };
    if (stockStatus === 'out') query.stock = { $lte: 0 };
    if (stockStatus === 'in') query.stock = { $gt: 0 };

    let sortOptions = { updatedAt: -1 };
    if (sortBy === 'stock_asc') sortOptions.stock = 1;
    else if (sortBy === 'stock_desc') sortOptions.stock = -1;
    else if (sortBy === 'name') sortOptions.name = 1;

    const products = await Product.find(query)
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Product.countDocuments(query);

    res.json({
      products,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/admin/inventory/low-stock', authMiddleware, async (req, res) => {
  try {
    const products = await Product.find({ stock: { $lte: 10 } }).sort({ stock: 1 }).limit(100);
    res.json({ products });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.patch('/api/admin/inventory/:id/stock', authMiddleware, async (req, res) => {
  try {
    const { action, value } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const amount = parseInt(value, 10) || 0;
    if (action === 'set') product.stock = amount;
    else if (action === 'add') product.stock = (product.stock || 0) + amount;
    else if (action === 'subtract') product.stock = Math.max(0, (product.stock || 0) - amount);

    await product.save();
    res.json({ message: 'Stock updated', product });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/admin/inventory/bulk-update', authMiddleware, async (req, res) => {
  try {
    const { updates } = req.body;
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ message: 'Updates array required' });
    }

    const results = [];
    for (const update of updates) {
      const product = await Product.findById(update.id);
      if (!product) continue;
      if (update.stock !== undefined) product.stock = update.stock;
      await product.save();
      results.push(product);
    }

    res.json({ message: 'Bulk update complete', updated: results.length, products: results });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/admin/inventory/history', authMiddleware, async (req, res) => {
  res.json({ history: [], message: 'Inventory history not tracked in this service' });
});

// Admin Shipment APIs
app.get('/api/admin/shipments', authMiddleware, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    let query = {};
    if (status) query.status = status;
    if (search) query.trackingId = { $regex: search, $options: 'i' };

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Order.countDocuments(query);
    res.json({ shipments: orders, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/admin/shipments/:id', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Shipment not found' });
    res.json({ shipment: order.shipment, order });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.put('/api/admin/shipments/:id/tracking', authMiddleware, async (req, res) => {
  try {
    const { carrier, trackingNumber, currentLocation } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.shipment = order.shipment || { trackingHistory: [] };
    if (carrier) order.shipment.carrier = carrier;
    if (trackingNumber) order.shipment.trackingNumber = trackingNumber;
    if (currentLocation) order.shipment.currentLocation = currentLocation;
    if (!order.shipment.shippedDate) order.shipment.shippedDate = new Date();

    await order.save();
    res.json({ message: 'Shipment tracking updated', order });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/admin/shipments/:id/tracking-event', authMiddleware, async (req, res) => {
  try {
    const { status, location, description } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.shipment = order.shipment || { trackingHistory: [] };
    order.shipment.trackingHistory = order.shipment.trackingHistory || [];
    order.shipment.trackingHistory.push({ status, location, description, timestamp: new Date() });
    order.shipment.currentLocation = location || order.shipment.currentLocation;

    await order.save();
    res.json({ message: 'Tracking event added', order });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin Returns & Refunds
app.get('/api/admin/returns', authMiddleware, async (req, res) => {
  try {
    const returns = await Return.find().sort({ createdAt: -1 });
    res.json({ returns });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/admin/returns/:id', authMiddleware, async (req, res) => {
  try {
    const returnRequest = await Return.findById(req.params.id).populate('orderId');
    if (!returnRequest) return res.status(404).json({ message: 'Return request not found' });
    res.json(returnRequest);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.put('/api/admin/returns/:id/approve', authMiddleware, async (req, res) => {
  try {
    const returnRequest = await Return.findById(req.params.id);
    if (!returnRequest) return res.status(404).json({ message: 'Return request not found' });

    returnRequest.status = 'Approved';
    returnRequest.updatedAt = new Date();
    await returnRequest.save();

    res.json({ message: 'Return approved', return: returnRequest });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.put('/api/admin/returns/:id/reject', authMiddleware, async (req, res) => {
  try {
    const returnRequest = await Return.findById(req.params.id);
    if (!returnRequest) return res.status(404).json({ message: 'Return request not found' });

    returnRequest.status = 'Rejected';
    returnRequest.updatedAt = new Date();
    await returnRequest.save();

    res.json({ message: 'Return rejected', return: returnRequest });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.put('/api/admin/returns/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const returnRequest = await Return.findById(req.params.id);
    if (!returnRequest) return res.status(404).json({ message: 'Return request not found' });

    returnRequest.status = status || returnRequest.status;
    returnRequest.updatedAt = new Date();
    await returnRequest.save();

    res.json({ message: 'Return status updated', return: returnRequest });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/admin/returns/:id/refund', authMiddleware, async (req, res) => {
  try {
    const { amount, method } = req.body;
    const returnRequest = await Return.findById(req.params.id);
    if (!returnRequest) return res.status(404).json({ message: 'Return request not found' });

    returnRequest.refund = {
      amount,
      method,
      status: 'processed',
      processedAt: new Date()
    };
    returnRequest.status = 'Refunded';
    returnRequest.updatedAt = new Date();
    await returnRequest.save();

    res.json({ message: 'Refund processed', return: returnRequest });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/admin/refunds/:orderId', authMiddleware, async (req, res) => {
  try {
    const { amount, reason, method } = req.body;

    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    res.json({ message: 'Refund processed successfully (mock)', refund: { amount, reason, method, status: 'processed' } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Seed Categories (Admin)
app.post('/api/admin/seed-categories', authMiddleware, async (req, res) => {
  try {
    const categories = req.body.categories || [];
    if (!Array.isArray(categories) || categories.length === 0) {
      return res.status(400).json({ message: 'Categories array required' });
    }

    await Category.deleteMany();
    const result = await Category.insertMany(categories);

    res.json({ message: 'Categories seeded successfully', count: result.length, categories: result });
  } catch (error) {
    res.status(500).json({ message: 'Error seeding categories', error: error.message });
  }
});
