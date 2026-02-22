# E-Commerce Microservices

This folder contains a microservices scaffold for the existing backend. The original monolith `server.js` remains unchanged.

Services and default ports:
- Gateway: `5000`
- Auth: `5001`
- Catalog: `5002`
- Orders: `5003`
- Payments: `5004`
- Notifications: `5005`
- Admin: `5006`

All services use the same MongoDB database. Configure `MONGODB_URI` or `MONGO_URI` and `JWT_SECRET`.

## Run locally (without Docker)
From `d:\simple\backend\microservices`:

```
npm install
npm run start:auth
npm run start:catalog
npm run start:orders
npm run start:payments
npm run start:notifications
npm run start:admin
npm run start:gateway
```

## Run with Docker
From `d:\simple\backend\microservices`:

```
docker compose up --build
```

## Gateway routing
The gateway proxies:
- `/api/auth`, `/api/profile`, `/api/users` -> auth service
- `/api/products`, `/api/categories`, `/api/reviews` -> catalog service
- `/api/orders`, `/api/returns`, `/api/wishlist`, `/api/cart`, `/api/addresses` -> orders service
- `/api/wallet`, `/api/coupons`, `/api/payment-methods`, `/api/admin/coupons` -> payments service
- `/api/notifications`, `/api/admin/email-templates` -> notifications service
- `/api/admin/*` -> admin service

## Notes
- Shared models and DB utilities live in `microservices/shared`.
- Inventory history is not tracked in this service scaffold (endpoint returns empty list).
- Validate admin endpoints against your UI to ensure parity with the monolith behavior.
