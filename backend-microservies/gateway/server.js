require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || process.env.GATEWAY_PORT || 5000;

app.use(cors());

const services = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:5001',
  catalog: process.env.CATALOG_SERVICE_URL || 'http://localhost:5002',
  orders: process.env.ORDERS_SERVICE_URL || 'http://localhost:5003',
  payments: process.env.PAYMENTS_SERVICE_URL || 'http://localhost:5004',
  notifications: process.env.NOTIFICATIONS_SERVICE_URL || 'http://localhost:5005',
  admin: process.env.ADMIN_SERVICE_URL || 'http://localhost:5006',
};

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', gateway: true, services });
});

app.use('/api/auth', createProxyMiddleware({ target: services.auth, changeOrigin: true }));
app.use('/api/profile', createProxyMiddleware({ target: services.auth, changeOrigin: true }));
app.use('/api/users', createProxyMiddleware({ target: services.auth, changeOrigin: true }));

app.use('/api/products', createProxyMiddleware({ target: services.catalog, changeOrigin: true }));
app.use('/api/categories', createProxyMiddleware({ target: services.catalog, changeOrigin: true }));
app.use('/api/reviews', createProxyMiddleware({ target: services.catalog, changeOrigin: true }));

app.use('/api/orders', createProxyMiddleware({ target: services.orders, changeOrigin: true }));
app.use('/api/returns', createProxyMiddleware({ target: services.orders, changeOrigin: true }));
app.use('/api/wishlist', createProxyMiddleware({ target: services.orders, changeOrigin: true }));
app.use('/api/cart', createProxyMiddleware({ target: services.orders, changeOrigin: true }));
app.use('/api/addresses', createProxyMiddleware({ target: services.orders, changeOrigin: true }));

app.use('/api/wallet', createProxyMiddleware({ target: services.payments, changeOrigin: true }));
app.use('/api/coupons', createProxyMiddleware({ target: services.payments, changeOrigin: true }));
app.use('/api/payment-methods', createProxyMiddleware({ target: services.payments, changeOrigin: true }));

app.use('/api/notifications', createProxyMiddleware({ target: services.notifications, changeOrigin: true }));
app.use('/api/admin/email-templates', createProxyMiddleware({ target: services.notifications, changeOrigin: true }));

app.use('/api/admin/coupons', createProxyMiddleware({ target: services.payments, changeOrigin: true }));
app.use('/api/admin', createProxyMiddleware({ target: services.admin, changeOrigin: true }));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Gateway running on http://localhost:${PORT}`);
});
