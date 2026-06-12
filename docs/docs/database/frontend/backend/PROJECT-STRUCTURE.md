# Express Backend Scaffold

# Vickers Cottage Inventory & POS System

Backend Framework: Node.js + Express.js

Database: PostgreSQL

Authentication: JWT

Version: 1.0

---

# Backend Folder Structure

```text
backend/
│
├── src/
│   │
│   ├── config/
│   │   ├── database.js
│   │   ├── environment.js
│   │   └── logger.js
│   │
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── product.controller.js
│   │   ├── category.controller.js
│   │   ├── supplier.controller.js
│   │   ├── purchase.controller.js
│   │   ├── sales.controller.js
│   │   ├── inventory.controller.js
│   │   └── reports.controller.js
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── role.middleware.js
│   │   ├── validation.middleware.js
│   │   ├── error.middleware.js
│   │   ├── notFound.middleware.js
│   │   └── rateLimiter.middleware.js
│   │
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── users.routes.js
│   │   ├── products.routes.js
│   │   ├── categories.routes.js
│   │   ├── suppliers.routes.js
│   │   ├── purchases.routes.js
│   │   ├── sales.routes.js
│   │   ├── inventory.routes.js
│   │   ├── reports.routes.js
│   │   └── index.js
│   │
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── user.service.js
│   │   ├── product.service.js
│   │   ├── category.service.js
│   │   ├── supplier.service.js
│   │   ├── purchase.service.js
│   │   ├── sales.service.js
│   │   ├── inventory.service.js
│   │   └── reports.service.js
│   │
│   ├── repositories/
│   │   ├── user.repository.js
│   │   ├── product.repository.js
│   │   ├── supplier.repository.js
│   │   ├── purchase.repository.js
│   │   ├── sales.repository.js
│   │   └── inventory.repository.js
│   │
│   ├── validators/
│   │   ├── auth.validator.js
│   │   ├── product.validator.js
│   │   ├── supplier.validator.js
│   │   ├── purchase.validator.js
│   │   └── sales.validator.js
│   │
│   ├── utils/
│   │   ├── jwt.js
│   │   ├── bcrypt.js
│   │   ├── pagination.js
│   │   ├── response.js
│   │   └── receipt.js
│   │
│   ├── app.js
│   └── server.js
│
├── tests/
│   ├── auth.test.js
│   ├── products.test.js
│   └── sales.test.js
│
├── .env
├── .env.example
├── package.json
└── nodemon.json
```

---

# Architecture Pattern

```text
Client
   │
   ▼
Routes
   │
   ▼
Controllers
   │
   ▼
Services
   │
   ▼
Repositories
   │
   ▼
PostgreSQL Database
```

---

# Route Organization

## Authentication

```http
POST   /api/auth/login
POST   /api/auth/register
POST   /api/auth/logout
GET    /api/auth/profile
```

---

## Users

```http
GET    /api/users
GET    /api/users/:id
POST   /api/users
PUT    /api/users/:id
DELETE /api/users/:id
```

---

## Categories

```http
GET    /api/categories
POST   /api/categories
PUT    /api/categories/:id
DELETE /api/categories/:id
```

---

## Products

```http
GET    /api/products
GET    /api/products/:id
POST   /api/products
PUT    /api/products/:id
DELETE /api/products/:id
```

---

## Suppliers

```http
GET    /api/suppliers
GET    /api/suppliers/:id
POST   /api/suppliers
PUT    /api/suppliers/:id
DELETE /api/suppliers/:id
```

---

## Purchases

```http
GET    /api/purchases
GET    /api/purchases/:id
POST   /api/purchases
PUT    /api/purchases/:id
```

---

## Sales

```http
GET    /api/sales
GET    /api/sales/:id
POST   /api/sales
```

---

## Inventory

```http
GET    /api/inventory
GET    /api/inventory/low-stock
GET    /api/inventory/history
```

---

## Reports

```http
GET /api/reports/sales
GET /api/reports/inventory
GET /api/reports/profit
GET /api/reports/dashboard
```

---

# Middleware

## Authentication Middleware

Responsibilities:

* Verify JWT token
* Extract user information
* Reject unauthorized requests

Example:

```javascript
req.user = {
  id,
  email,
  role
};
```

---

## Role Middleware

Protect routes by role.

Example:

```javascript
authorize('admin');

authorize('admin', 'manager');
```

---

## Validation Middleware

Validate:

* Request body
* Params
* Query strings

Libraries:

```bash
npm install express-validator
```

---

## Error Middleware

Standard error response:

```json
{
  "success": false,
  "message": "Product not found"
}
```

---

## Rate Limiter

Protect login endpoint.

Libraries:

```bash
npm install express-rate-limit
```

---

# Controllers

Controllers handle HTTP requests.

Example:

```javascript
exports.createProduct = async (req, res) => {
   const product = await productService.create(req.body);

   res.status(201).json(product);
};
```

---

# Services

Services contain business logic.

Example:

```javascript
exports.createProduct = async (data) => {

   const existing =
      await productRepository.findBySku(data.sku);

   if (existing) {
      throw new Error('SKU already exists');
   }

   return productRepository.create(data);
};
```

---

# Repositories

Repositories interact with PostgreSQL.

Example:

```javascript
exports.findById = async (id) => {
   return db.query(
      'SELECT * FROM products WHERE id=$1',
      [id]
   );
};
```

---

# Environment Variables

## .env.example

```env
NODE_ENV=development

PORT=5000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=vickers_cottage
DB_USER=postgres
DB_PASSWORD=password

JWT_SECRET=replace_with_secure_secret

JWT_EXPIRES_IN=1d

CORS_ORIGIN=http://localhost:5173
```

---

# Database Configuration

## database.js

Responsibilities:

* PostgreSQL connection
* Pool management
* Query exports

Library:

```bash
npm install pg
```

Example:

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL
});

module.exports = pool;
```

---

# Authentication

Libraries:

```bash
npm install bcryptjs
npm install jsonwebtoken
```

Features:

* Password hashing
* Login
* JWT generation
* JWT validation

---

# Logging

Libraries:

```bash
npm install morgan
```

Responsibilities:

* Request logging
* Error logging

---

# Security

Libraries:

```bash
npm install helmet
npm install cors
```

Features:

* Secure headers
* CORS protection
* JWT security

---

# Package Dependencies

```bash
npm install express
npm install pg
npm install cors
npm install helmet
npm install dotenv
npm install bcryptjs
npm install jsonwebtoken
npm install express-validator
npm install express-rate-limit
npm install morgan
npm install uuid
```

---

# Development Dependencies

```bash
npm install -D nodemon
npm install -D jest
npm install -D supertest
```

---

# Startup Commands

Development:

```bash
npm run dev
```

Production:

```bash
npm start
```

---

# Backend Status

Version: 1.0

Status:
Ready for API Development
