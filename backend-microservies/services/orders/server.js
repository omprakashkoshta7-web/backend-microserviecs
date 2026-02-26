require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const compression = require('compression');

const { connectDB } = require('../../shared/db');
const { Order, Notification, User, Wishlist, Cart, Address, Return } = require('../../shared/models');
const { authMiddleware } = require('../../shared/auth');
const { sendOrderConfirmation } = require('../../shared/email');

const app = express();
const PORT = process.env.PORT || process.env.ORDERS_PORT || 5003;

app.use(compression());
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

connectDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Orders service running on http://localhost:${PORT}`);
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', service: 'orders' });
});

// Place Order
app.post('/api/orders', authMiddleware, async (req, res) => {
  try {
    const { items, total, address, paymentMethod } = req.body;

    const newOrder = new Order({
      userId: req.userId,
      user: req.userId,
      items,
      total,
      address,
      paymentMethod,
      status: 'Pending',
      trackingId: `TRK${Date.now()}${Math.floor(Math.random() * 1000)}`,
    });

    await newOrder.save();

    res.status(201).json({ message: 'Order placed successfully', order: newOrder });

    setImmediate(async () => {
      try {
        const notification = new Notification({
          userId: req.userId,
          type: 'order',
          title: 'Order Placed Successfully',
          message: `Your order #${newOrder.trackingId} has been placed successfully. Total: ${total}`,
          icon: 'package',
          orderId: newOrder._id,
        });
        await notification.save();
      } catch (notificationError) {
        console.error('Order notification failed:', notificationError.message);
      }

      try {
        const orderUser = await User.findById(req.userId).select('name email');
        if (orderUser?.email) {
          await sendOrderConfirmation(newOrder, orderUser);
        }
      } catch (emailError) {
        console.error('Order email error:', emailError.message);
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get User Orders
app.get('/api/orders', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.userId })
      .populate('items.product')
      .sort({ createdAt: -1 });
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get Single Order
app.get('/api/orders/:id', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Wishlist APIs
app.get('/api/wishlist', authMiddleware, async (req, res) => {
  try {
    const wishlist = await Wishlist.find({ userId: req.userId }).populate('productId');
    res.json({ wishlist });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/wishlist', authMiddleware, async (req, res) => {
  try {
    const { productId } = req.body;

    const existingItem = await Wishlist.findOne({ userId: req.userId, productId });
    if (existingItem) {
      return res.status(200).json({ message: 'Product already in wishlist', wishlistItem: existingItem });
    }

    const wishlistItem = new Wishlist({ userId: req.userId, productId });
    await wishlistItem.save();

    res.status(201).json({ message: 'Added to wishlist', wishlistItem });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.delete('/api/wishlist/:productId', authMiddleware, async (req, res) => {
  try {
    const { productId } = req.params;
    const userWishlist = await Wishlist.find({ userId: req.userId }).select('_id productId');

    // Legacy-safe matching: allow delete by wishlist row _id OR productId string.
    const matchedIds = userWishlist
      .filter((item) => String(item._id) === productId || String(item.productId) === productId)
      .map((item) => item._id);

    if (matchedIds.length === 0) {
      return res.status(404).json({ message: 'Product not in wishlist' });
    }

    await Wishlist.deleteMany({ userId: req.userId, _id: { $in: matchedIds } });
    res.json({ message: 'Removed from wishlist', deletedCount: matchedIds.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/wishlist/check/:productId', authMiddleware, async (req, res) => {
  try {
    const exists = await Wishlist.findOne({ userId: req.userId, productId: req.params.productId });
    res.json({ exists: !!exists });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Cart APIs
app.get('/api/cart', authMiddleware, async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.userId }).populate('items.productId');
    if (!cart) cart = new Cart({ userId: req.userId, items: [] });

    res.json({ cart });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/cart', authMiddleware, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    let cart = await Cart.findOne({ userId: req.userId });
    if (!cart) cart = new Cart({ userId: req.userId, items: [] });

    const existingItem = cart.items.find(item => item.productId.toString() === productId);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ productId, quantity });
    }

    cart.updatedAt = new Date();
    await cart.save();

    res.json({ message: 'Added to cart', cart });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.put('/api/cart/:productId', authMiddleware, async (req, res) => {
  try {
    const { quantity } = req.body;
    const cart = await Cart.findOne({ userId: req.userId });

    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const item = cart.items.find(item => item.productId.toString() === req.params.productId);
    if (!item) return res.status(404).json({ message: 'Item not found in cart' });

    item.quantity = quantity;
    cart.updatedAt = new Date();
    await cart.save();

    res.json({ message: 'Cart updated', cart });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.delete('/api/cart/:productId', authMiddleware, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.userId });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    cart.items = cart.items.filter(item => item.productId.toString() !== req.params.productId);
    cart.updatedAt = new Date();
    await cart.save();

    res.json({ message: 'Item removed', cart });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.delete('/api/cart', authMiddleware, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.userId });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    cart.items = [];
    cart.updatedAt = new Date();
    await cart.save();

    res.json({ message: 'Cart cleared', cart });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Address APIs
app.get('/api/addresses', authMiddleware, async (req, res) => {
  try {
    const addresses = await Address.find({ userId: req.userId });
    res.json({ addresses });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/addresses', authMiddleware, async (req, res) => {
  try {
    const { label, address, selected } = req.body;

    if (selected) {
      await Address.updateMany({ userId: req.userId }, { selected: false });
    }

    const newAddress = new Address({ userId: req.userId, label, address, selected: !!selected });
    await newAddress.save();

    res.status(201).json({ message: 'Address added', address: newAddress });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Return APIs
app.post('/api/returns', authMiddleware, async (req, res) => {
  try {
    const { orderId, items, reason, description, images } = req.body;

    if (!orderId || !items || items.length === 0 || !reason) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    const returnId = `RET${Date.now()}${Math.floor(Math.random() * 1000)}`;

    const returnRequest = new Return({
      returnId,
      orderId,
      userId: req.userId,
      items,
      reason,
      description,
      images,
      status: 'Pending',
    });

    await returnRequest.save();
    res.status(201).json({ message: 'Return request created', return: returnRequest });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/returns/my-returns', authMiddleware, async (req, res) => {
  try {
    const returns = await Return.find({ userId: req.userId })
      .populate('orderId')
      .sort({ createdAt: -1 });

    res.json({ returns });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/returns/:id', authMiddleware, async (req, res) => {
  try {
    const returnRequest = await Return.findById(req.params.id).populate('orderId');
    if (!returnRequest) return res.status(404).json({ message: 'Return request not found' });

    res.json(returnRequest);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.delete('/api/returns/:id', authMiddleware, async (req, res) => {
  try {
    const returnRequest = await Return.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!returnRequest) return res.status(404).json({ message: 'Return request not found' });

    res.json({ message: 'Return request deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/returns', authMiddleware, async (req, res) => {
  try {
    const returns = await Return.find({ userId: req.userId })
      .populate('orderId')
      .sort({ createdAt: -1 });

    res.json({ returns });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
