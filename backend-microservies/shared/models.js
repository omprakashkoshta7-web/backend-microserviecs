const { mongoose } = require('./db');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: String,
  isBlocked: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  lastLogin: Date,
  lastActivity: Date,
});

const ActivityLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  description: String,
  ipAddress: String,
  device: String,
  userAgent: String,
  timestamp: { type: Date, default: Date.now },
});

const ProductSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  originalPrice: Number,
  discount: Number,
  image: String,
  images: [String],
  category: String,
  subCategory: String,
  subcategory: String,
  brand: String,
  rating: Number,
  reviews: Number,
  stock: Number,
  sold: Number,
  tags: [String],
  colors: [String],
  sizes: [String],
  material: String,
  care: String,
  isPopular: Boolean,
  isTrending: Boolean,
  isFeatured: Boolean,
  inStock: Boolean,
  createdAt: { type: Date, default: Date.now }
}, { collection: 'products' });

const OrderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: Array,
  total: Number,
  address: Object,
  paymentMethod: String,
  status: { type: String, default: 'Pending' },
  trackingId: String,
  shipment: {
    carrier: String,
    trackingNumber: String,
    shippedDate: Date,
    estimatedDelivery: Date,
    currentLocation: String,
    trackingHistory: [{
      status: String,
      location: String,
      timestamp: Date,
      description: String,
    }],
  },
  createdAt: { type: Date, default: Date.now },
});

const AddressSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  label: String,
  address: String,
  selected: Boolean,
});

const ReviewSchema = new mongoose.Schema({
  productId: mongoose.Schema.Types.ObjectId,
  userId: mongoose.Schema.Types.ObjectId,
  rating: Number,
  comment: String,
  userName: String,
  createdAt: { type: Date, default: Date.now },
});

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: String,
  image: String,
  icon: String,
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  productCount: { type: Number, default: 0 },
  subcategories: [{
    _id: mongoose.Schema.Types.ObjectId,
    name: { type: String, required: true },
    description: String,
    image: String,
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    productCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const NotificationSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  type: { type: String, enum: ['order', 'sale', 'review', 'payment', 'general'], default: 'general' },
  title: { type: String, required: true },
  message: { type: String, required: true },
  icon: String,
  read: { type: Boolean, default: false },
  orderId: mongoose.Schema.Types.ObjectId,
  productId: mongoose.Schema.Types.ObjectId,
  createdAt: { type: Date, default: Date.now },
});

const WishlistSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  productId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Product' },
  createdAt: { type: Date, default: Date.now },
});

const CartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, default: 1 },
    addedAt: { type: Date, default: Date.now }
  }],
  updatedAt: { type: Date, default: Date.now }
});

const ReturnSchema = new mongoose.Schema({
  returnId: { type: String, unique: true, required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, required: false },
    name: String,
    quantity: Number,
    price: Number,
    reason: String
  }],
  reason: { type: String, required: true },
  description: String,
  images: [String],
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Picked Up', 'Received', 'Refunded'],
    default: 'Pending'
  },
  refund: {
    amount: Number,
    method: String,
    status: String,
    processedAt: Date,
    transactionId: String
  },
  pickup: {
    scheduled: Boolean,
    date: Date,
    timeSlot: String,
    address: String,
    trackingNumber: String
  },
  adminNotes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const WalletSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  balance: { type: Number, default: 0 },
  transactions: [{
    type: { type: String, enum: ['credit', 'debit'], required: true },
    amount: { type: Number, required: true },
    description: { type: String, required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    balanceAfter: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const CouponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  description: { type: String, required: true },
  discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
  discountValue: { type: Number, required: true },
  minOrderAmount: { type: Number, default: 0 },
  maxDiscount: { type: Number },
  validFrom: { type: Date, default: Date.now },
  validUntil: { type: Date, required: true },
  usageLimit: { type: Number, default: null },
  usedCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const PaymentMethodSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['card', 'upi', 'netbanking'], required: true },
  cardNumber: { type: String },
  cardHolderName: { type: String },
  expiryDate: { type: String },
  cardType: { type: String, enum: ['visa', 'mastercard', 'amex', 'rupay'] },
  upiId: { type: String },
  bankName: { type: String },
  isDefault: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const getModel = (name, schema, collection) => {
  if (mongoose.models[name]) return mongoose.models[name];
  if (collection) return mongoose.model(name, schema, collection);
  return mongoose.model(name, schema);
};

const User = getModel('User', UserSchema);
const ActivityLog = getModel('ActivityLog', ActivityLogSchema);
const Product = getModel('Product', ProductSchema, 'products');
const Order = getModel('Order', OrderSchema);
const Address = getModel('Address', AddressSchema);
const Review = getModel('Review', ReviewSchema);
const Category = getModel('Category', CategorySchema);
const Notification = getModel('Notification', NotificationSchema);
const Wishlist = getModel('Wishlist', WishlistSchema);
const Cart = getModel('Cart', CartSchema);
const Return = getModel('Return', ReturnSchema);
const Wallet = getModel('Wallet', WalletSchema);
const Coupon = getModel('Coupon', CouponSchema);
const PaymentMethod = getModel('PaymentMethod', PaymentMethodSchema);

module.exports = {
  User,
  ActivityLog,
  Product,
  Order,
  Address,
  Review,
  Category,
  Notification,
  Wishlist,
  Cart,
  Return,
  Wallet,
  Coupon,
  PaymentMethod,
};
