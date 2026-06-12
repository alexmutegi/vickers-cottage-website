# React Frontend Scaffold

# Vickers Cottage Inventory & POS System

Frontend Framework: React + Vite + Tailwind CSS

---

# Folder Structure

```text
frontend/
│
├── public/
│   ├── logo.png
│   └── favicon.ico
│
├── src/
│   │
│   ├── assets/
│   │
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Table.jsx
│   │   │   └── Modal.jsx
│   │   │
│   │   ├── dashboard/
│   │   │   ├── SalesCard.jsx
│   │   │   ├── ProfitCard.jsx
│   │   │   ├── InventoryCard.jsx
│   │   │   └── LowStockCard.jsx
│   │   │
│   │   └── pos/
│   │       ├── ProductSearch.jsx
│   │       ├── Cart.jsx
│   │       └── Receipt.jsx
│   │
│   ├── layouts/
│   │   ├── MainLayout.jsx
│   │   ├── Sidebar.jsx
│   │   ├── Navbar.jsx
│   │   └── ProtectedRoute.jsx
│   │
│   ├── pages/
│   │   ├── auth/
│   │   │   └── Login.jsx
│   │   │
│   │   ├── dashboard/
│   │   │   └── Dashboard.jsx
│   │   │
│   │   ├── products/
│   │   │   ├── Products.jsx
│   │   │   ├── ProductForm.jsx
│   │   │   └── ProductDetails.jsx
│   │   │
│   │   ├── suppliers/
│   │   │   ├── Suppliers.jsx
│   │   │   └── SupplierForm.jsx
│   │   │
│   │   ├── purchases/
│   │   │   ├── Purchases.jsx
│   │   │   └── PurchaseForm.jsx
│   │   │
│   │   ├── sales/
│   │   │   ├── POS.jsx
│   │   │   ├── SalesHistory.jsx
│   │   │   └── ReceiptView.jsx
│   │   │
│   │   ├── reports/
│   │   │   ├── SalesReport.jsx
│   │   │   ├── InventoryReport.jsx
│   │   │   └── ProfitReport.jsx
│   │   │
│   │   └── users/
│   │       ├── Users.jsx
│   │       └── UserForm.jsx
│   │
│   ├── services/
│   │   ├── api.js
│   │   ├── authService.js
│   │   ├── productService.js
│   │   ├── supplierService.js
│   │   ├── purchaseService.js
│   │   ├── salesService.js
│   │   └── reportService.js
│   │
│   ├── context/
│   │   └── AuthContext.jsx
│   │
│   ├── hooks/
│   │   ├── useAuth.js
│   │   └── useProducts.js
│   │
│   ├── routes/
│   │   └── AppRoutes.jsx
│   │
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
│
├── .env
├── package.json
└── vite.config.js
```

---

# Main Navigation Menu

```text
Dashboard

Inventory
├── Products
├── Categories
└── Stock Movement

Purchases
├── New Purchase
└── Purchase History

Sales
├── POS
└── Sales History

Reports
├── Sales Report
├── Inventory Report
└── Profit Report

Suppliers

Users

Settings
```

---

# Application Routes

```javascript
/login

/dashboard

/products
/products/new
/products/:id

/suppliers
/suppliers/new

/purchases
/purchases/new

/sales/pos
/sales/history

/reports/sales
/reports/inventory
/reports/profit

/users
```

---

# Dashboard Widgets

Display:

* Today's Sales
* Today's Profit
* Inventory Value
* Low Stock Products
* Recent Sales
* Top Selling Products

---

# POS Screen Layout

```text
-------------------------------------------------
Search Products
-------------------------------------------------

Products List          Shopping Cart

Tusker                 Tusker x2

Guinness               Guinness x1

Heineken

-------------------------------------------------

Total: KES 750

[Cash]
[Card]
[M-Pesa]
```

---

# Authentication Flow

1. User logs in.
2. JWT token stored in localStorage.
3. AuthContext manages session.
4. Protected routes verify authentication.
5. Unauthorized users redirected to Login.

---

# API Base URL

```env
VITE_API_URL=http://localhost:5000/api
```

---

# Initial Dependencies

```bash
npm install react-router-dom
npm install axios
npm install react-icons
npm install react-hook-form
npm install react-hot-toast
npm install jwt-decode
```

---

# Tailwind Dependencies

```bash
npm install -D tailwindcss
npm install -D postcss
npm install -D autoprefixer
```

---

# MVP Pages

## Phase 1

* Login
* Dashboard
* Products

## Phase 2

* Suppliers
* Purchases

## Phase 3

* POS
* Sales History

## Phase 4

* Reports
* User Management

---

# Frontend Status

Version: 1.0

Status:
Ready for React + Vite Development
