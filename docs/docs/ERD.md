# Entity Relationship Diagram (ERD)

# Vickers Cottage Inventory & POS System

Version: 1.0

Date: June 2026

---

# Overview

This document defines the database entities, relationships, and cardinality for the Vickers Cottage Inventory & POS System.

The ERD serves as the blueprint for database design and backend development.

---

# Core Entities

1. Users
2. Categories
3. Products
4. Suppliers
5. Purchases
6. Purchase Items
7. Sales
8. Sale Items
9. Inventory Transactions

---

# Entity Relationships

```text
USERS
  |
  | 1:N
  |
SALES
  |
  | 1:N
  |
SALE_ITEMS
  |
  | N:1
  |
PRODUCTS
  |
  | N:1
  |
CATEGORIES

SUPPLIERS
  |
  | 1:N
  |
PURCHASES
  |
  | 1:N
  |
PURCHASE_ITEMS
  |
  | N:1
  |
PRODUCTS

PRODUCTS
  |
  | 1:N
  |
INVENTORY_TRANSACTIONS
```

---

# Entity Definitions

## USERS

Stores system user accounts.

### Attributes

| Field         | Type      |
| ------------- | --------- |
| id            | PK        |
| full_name     | VARCHAR   |
| email         | VARCHAR   |
| password_hash | TEXT      |
| role          | VARCHAR   |
| is_active     | BOOLEAN   |
| created_at    | TIMESTAMP |
| updated_at    | TIMESTAMP |

### Relationships

* One User can create many Sales.
* One User can record many Purchases.
* One User belongs to one Role.

---

## CATEGORIES

Stores product categories.

### Attributes

| Field       | Type      |
| ----------- | --------- |
| id          | PK        |
| name        | VARCHAR   |
| description | TEXT      |
| created_at  | TIMESTAMP |

### Relationships

* One Category contains many Products.

---

## PRODUCTS

Stores inventory items.

### Attributes

| Field           | Type      |
| --------------- | --------- |
| id              | PK        |
| category_id     | FK        |
| name            | VARCHAR   |
| sku             | VARCHAR   |
| barcode         | VARCHAR   |
| purchase_price  | DECIMAL   |
| selling_price   | DECIMAL   |
| stock_quantity  | INTEGER   |
| reorder_level   | INTEGER   |
| unit_of_measure | VARCHAR   |
| created_at      | TIMESTAMP |
| updated_at      | TIMESTAMP |

### Relationships

* One Product belongs to one Category.
* One Product appears in many Purchase Items.
* One Product appears in many Sale Items.
* One Product has many Inventory Transactions.

---

## SUPPLIERS

Stores supplier information.

### Attributes

| Field          | Type      |
| -------------- | --------- |
| id             | PK        |
| supplier_name  | VARCHAR   |
| phone          | VARCHAR   |
| email          | VARCHAR   |
| address        | TEXT      |
| contact_person | VARCHAR   |
| created_at     | TIMESTAMP |

### Relationships

* One Supplier can provide many Purchases.

---

## PURCHASES

Stores supplier purchase records.

### Attributes

| Field          | Type      |
| -------------- | --------- |
| id             | PK        |
| supplier_id    | FK        |
| recorded_by    | FK        |
| purchase_date  | TIMESTAMP |
| invoice_number | VARCHAR   |
| total_cost     | DECIMAL   |
| status         | VARCHAR   |
| notes          | TEXT      |

### Relationships

* One Purchase belongs to one Supplier.
* One Purchase contains many Purchase Items.
* One Purchase is recorded by one User.

---

## PURCHASE_ITEMS

Stores products included in a purchase.

### Attributes

| Field       | Type    |
| ----------- | ------- |
| id          | PK      |
| purchase_id | FK      |
| product_id  | FK      |
| quantity    | INTEGER |
| unit_cost   | DECIMAL |
| subtotal    | DECIMAL |

### Relationships

* Many Purchase Items belong to one Purchase.
* Many Purchase Items reference one Product.

---

## SALES

Stores completed customer transactions.

### Attributes

| Field          | Type      |
| -------------- | --------- |
| id             | PK        |
| cashier_id     | FK        |
| sale_date      | TIMESTAMP |
| payment_method | VARCHAR   |
| subtotal       | DECIMAL   |
| tax_amount     | DECIMAL   |
| total_amount   | DECIMAL   |
| receipt_number | VARCHAR   |

### Relationships

* One Sale belongs to one User.
* One Sale contains many Sale Items.

---

## SALE_ITEMS

Stores products sold in a transaction.

### Attributes

| Field         | Type    |
| ------------- | ------- |
| id            | PK      |
| sale_id       | FK      |
| product_id    | FK      |
| quantity      | INTEGER |
| selling_price | DECIMAL |
| subtotal      | DECIMAL |

### Relationships

* Many Sale Items belong to one Sale.
* Many Sale Items reference one Product.

---

## INVENTORY_TRANSACTIONS

Stores all inventory movements.

### Attributes

| Field            | Type      |
| ---------------- | --------- |
| id               | PK        |
| product_id       | FK        |
| transaction_type | VARCHAR   |
| quantity         | INTEGER   |
| reference_type   | VARCHAR   |
| reference_id     | INTEGER   |
| notes            | TEXT      |
| created_at       | TIMESTAMP |

### Transaction Types

* STOCK_IN
* STOCK_OUT
* PURCHASE
* SALE
* RETURN
* DAMAGE
* ADJUSTMENT

### Relationships

* Many Inventory Transactions belong to one Product.

---

# Cardinality Summary

| Relationship                     | Cardinality |
| -------------------------------- | ----------- |
| Category → Products              | 1 : Many    |
| Supplier → Purchases             | 1 : Many    |
| Purchase → Purchase Items        | 1 : Many    |
| Product → Purchase Items         | 1 : Many    |
| User → Purchases                 | 1 : Many    |
| User → Sales                     | 1 : Many    |
| Sale → Sale Items                | 1 : Many    |
| Product → Sale Items             | 1 : Many    |
| Product → Inventory Transactions | 1 : Many    |

---

# Inventory Flow

```text
Supplier
    │
    ▼
Purchase
    │
    ▼
Purchase Items
    │
    ▼
Inventory Increase
    │
    ▼
Products
    │
    ▼
Sale
    │
    ▼
Sale Items
    │
    ▼
Inventory Decrease
```

---

# Future Entities (Phase 2+)

## Customers

* Customer profiles
* Purchase history
* Loyalty points

## Branches

* Multi-location inventory
* Stock transfers

## Payments

* M-Pesa
* Card transactions
* Payment reconciliation

## Audit Logs

* User activity tracking
* Security monitoring

---

# Database Design Notes

1. All primary keys use UUID or SERIAL identifiers.
2. Foreign keys enforce referential integrity.
3. Inventory quantities are updated through Inventory Transactions.
4. Sales automatically reduce stock.
5. Purchases automatically increase stock.
6. Soft deletes may be implemented for historical reporting.

---

# ERD Status

Version: 1.0

Status: Approved for Database Schema Development
