require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const compression = require('compression');

const { connectDB } = require('../../shared/db');
const { Wallet, Coupon, PaymentMethod } = require('../../shared/models');
const { authMiddleware } = require('../../shared/auth');

const app = express();
const PORT = process.env.PAYMENTS_PORT || 5004;

app.use(compression());
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

connectDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Payments service running on http://localhost:${PORT}`);
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', service: 'payments' });
});

// Wallet APIs
app.get('/api/wallet', authMiddleware, async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ userId: req.userId });
    if (!wallet) {
      wallet = new Wallet({ userId: req.userId, balance: 0, transactions: [] });
      await wallet.save();
    }

    res.json({
      balance: wallet.balance,
      transactions: wallet.transactions.sort((a, b) => b.createdAt - a.createdAt)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/wallet/add', authMiddleware, async (req, res) => {
  try {
    const { amount, paymentMethod } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    let wallet = await Wallet.findOne({ userId: req.userId });
    if (!wallet) wallet = new Wallet({ userId: req.userId, balance: 0, transactions: [] });

    wallet.balance += amount;
    wallet.transactions.push({
      type: 'credit',
      amount: amount,
      description: `Money Added via ${paymentMethod || 'Card'}`,
      balanceAfter: wallet.balance,
      createdAt: new Date()
    });
    wallet.updatedAt = new Date();

    await wallet.save();

    res.json({
      message: 'Money added successfully',
      balance: wallet.balance,
      transaction: wallet.transactions[wallet.transactions.length - 1]
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/wallet/deduct', authMiddleware, async (req, res) => {
  try {
    const { amount, orderId, description } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    let wallet = await Wallet.findOne({ userId: req.userId });

    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    wallet.balance -= amount;
    wallet.transactions.push({
      type: 'debit',
      amount: amount,
      description: description || 'Payment for Order',
      orderId: orderId,
      balanceAfter: wallet.balance,
      createdAt: new Date()
    });
    wallet.updatedAt = new Date();

    await wallet.save();

    res.json({
      message: 'Payment successful',
      balance: wallet.balance,
      transaction: wallet.transactions[wallet.transactions.length - 1]
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin Coupon APIs
app.get('/api/admin/coupons', authMiddleware, async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ coupons });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/admin/coupons/:id', authMiddleware, async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
    res.json({ coupon });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/admin/coupons', authMiddleware, async (req, res) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscount,
      validFrom,
      validUntil,
      usageLimit,
      isActive
    } = req.body;

    if (!code || !description || !discountType || !discountValue || !validUntil) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res.status(400).json({ message: 'Coupon code already exists' });
    }

    const newCoupon = new Coupon({
      code: code.toUpperCase(),
      description,
      discountType,
      discountValue,
      minOrderAmount: minOrderAmount || 0,
      maxDiscount,
      validFrom: validFrom || Date.now(),
      validUntil,
      usageLimit,
      isActive: isActive !== undefined ? isActive : true,
    });

    await newCoupon.save();
    res.status(201).json({ message: 'Coupon created successfully', coupon: newCoupon });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.put('/api/admin/coupons/:id', authMiddleware, async (req, res) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscount,
      validFrom,
      validUntil,
      usageLimit,
      isActive
    } = req.body;

    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ message: 'Coupon not found' });

    if (code && code.toUpperCase() !== coupon.code) {
      const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
      if (existingCoupon) return res.status(400).json({ message: 'Coupon code already exists' });
    }

    if (code) coupon.code = code.toUpperCase();
    if (description) coupon.description = description;
    if (discountType) coupon.discountType = discountType;
    if (discountValue !== undefined) coupon.discountValue = discountValue;
    if (minOrderAmount !== undefined) coupon.minOrderAmount = minOrderAmount;
    if (maxDiscount !== undefined) coupon.maxDiscount = maxDiscount;
    if (validFrom) coupon.validFrom = validFrom;
    if (validUntil) coupon.validUntil = validUntil;
    if (usageLimit !== undefined) coupon.usageLimit = usageLimit;
    if (isActive !== undefined) coupon.isActive = isActive;

    await coupon.save();
    res.json({ message: 'Coupon updated successfully', coupon });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.delete('/api/admin/coupons/:id', authMiddleware, async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
    res.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.patch('/api/admin/coupons/:id/toggle', authMiddleware, async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ message: 'Coupon not found' });

    coupon.isActive = !coupon.isActive;
    await coupon.save();

    res.json({ message: 'Coupon status updated', coupon });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// User Coupon APIs
app.get('/api/coupons', authMiddleware, async (req, res) => {
  try {
    const now = new Date();
    const coupons = await Coupon.find({
      isActive: true,
      validFrom: { $lte: now },
      validUntil: { $gte: now },
      $or: [
        { usageLimit: null },
        { $expr: { $lt: ['$usedCount', '$usageLimit'] } }
      ]
    }).sort({ createdAt: -1 });

    res.json({ coupons });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/coupons/validate', authMiddleware, async (req, res) => {
  try {
    const { code, orderAmount } = req.body;

    if (!code || !orderAmount) {
      return res.status(400).json({ message: 'Code and order amount required' });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon) return res.status(404).json({ message: 'Invalid coupon code' });

    const now = new Date();

    if (!coupon.isActive) return res.status(400).json({ message: 'Coupon is not active' });
    if (coupon.validFrom > now) return res.status(400).json({ message: 'Coupon is not yet valid' });
    if (coupon.validUntil < now) return res.status(400).json({ message: 'Coupon has expired' });
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ message: 'Coupon usage limit reached' });
    }
    if (orderAmount < coupon.minOrderAmount) {
      return res.status(400).json({ message: `Minimum order amount of ${coupon.minOrderAmount} required` });
    }

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (orderAmount * coupon.discountValue) / 100;
      if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
    } else {
      discount = coupon.discountValue;
    }

    res.json({
      valid: true,
      discount: discount,
      finalAmount: orderAmount - discount,
      coupon: {
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/coupons/apply', authMiddleware, async (req, res) => {
  try {
    const { code } = req.body;

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon) return res.status(404).json({ message: 'Invalid coupon code' });

    coupon.usedCount += 1;
    await coupon.save();

    res.json({ message: 'Coupon applied successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Payment Method APIs
app.get('/api/payment-methods', authMiddleware, async (req, res) => {
  try {
    const paymentMethods = await PaymentMethod.find({ userId: req.userId }).sort({ isDefault: -1, createdAt: -1 });
    res.json({ paymentMethods });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/payment-methods', authMiddleware, async (req, res) => {
  try {
    const { type, cardNumber, cardHolderName, expiryDate, cardType, upiId, bankName, isDefault } = req.body;

    if (isDefault) {
      await PaymentMethod.updateMany({ userId: req.userId }, { isDefault: false });
    }

    const paymentMethod = new PaymentMethod({
      userId: req.userId,
      type,
      cardNumber: cardNumber ? `****${cardNumber.slice(-4)}` : undefined,
      cardHolderName,
      expiryDate,
      cardType,
      upiId,
      bankName,
      isDefault: isDefault || false
    });

    await paymentMethod.save();

    res.status(201).json({ message: 'Payment method added', paymentMethod });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.delete('/api/payment-methods/:id', authMiddleware, async (req, res) => {
  try {
    const paymentMethod = await PaymentMethod.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!paymentMethod) return res.status(404).json({ message: 'Payment method not found' });

    res.json({ message: 'Payment method deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.put('/api/payment-methods/:id/default', authMiddleware, async (req, res) => {
  try {
    await PaymentMethod.updateMany({ userId: req.userId }, { isDefault: false });

    const paymentMethod = await PaymentMethod.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { isDefault: true },
      { new: true }
    );

    if (!paymentMethod) return res.status(404).json({ message: 'Payment method not found' });

    res.json({ message: 'Default payment method updated', paymentMethod });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
