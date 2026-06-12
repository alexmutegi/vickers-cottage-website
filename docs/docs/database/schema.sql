-- =====================================================
-- VICKERS COTTAGE INVENTORY & POS SYSTEM
-- PostgreSQL Database Schema
-- Version: 1.0
-- =====================================================

-- =====================================================
-- EXTENSIONS
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS
-- =====================================================

CREATE TABLE users (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
full_name VARCHAR(150) NOT NULL,
email VARCHAR(255) UNIQUE NOT NULL,
password_hash TEXT NOT NULL,
role VARCHAR(50) NOT NULL DEFAULT 'cashier',
is_active BOOLEAN DEFAULT TRUE,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- CATEGORIES
-- =====================================================

CREATE TABLE categories (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
name VARCHAR(100) UNIQUE NOT NULL,
description TEXT,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- PRODUCTS
-- =====================================================

CREATE TABLE products (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
category_id UUID REFERENCES categories(id),
name VARCHAR(255) NOT NULL,
sku VARCHAR(100) UNIQUE NOT NULL,
barcode VARCHAR(100),
purchase_price NUMERIC(12,2) NOT NULL,
selling_price NUMERIC(12,2) NOT NULL,
stock_quantity INTEGER NOT NULL DEFAULT 0,
reorder_level INTEGER NOT NULL DEFAULT 10,
unit_of_measure VARCHAR(50) DEFAULT 'Bottle',
is_active BOOLEAN DEFAULT TRUE,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- SUPPLIERS
-- =====================================================

CREATE TABLE suppliers (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
supplier_name VARCHAR(255) NOT NULL,
contact_person VARCHAR(255),
phone VARCHAR(50),
email VARCHAR(255),
address TEXT,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- PURCHASES
-- =====================================================

CREATE TABLE purchases (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
supplier_id UUID NOT NULL REFERENCES suppliers(id),
recorded_by UUID NOT NULL REFERENCES users(id),
invoice_number VARCHAR(100),
purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
total_cost NUMERIC(12,2) DEFAULT 0,
status VARCHAR(50) DEFAULT 'COMPLETED',
notes TEXT
);

-- =====================================================
-- PURCHASE ITEMS
-- =====================================================

CREATE TABLE purchase_items (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
product_id UUID NOT NULL REFERENCES products(id),
quantity INTEGER NOT NULL CHECK (quantity > 0),
unit_cost NUMERIC(12,2) NOT NULL,
subtotal NUMERIC(12,2) NOT NULL
);

-- =====================================================
-- SALES
-- =====================================================

CREATE TABLE sales (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
cashier_id UUID NOT NULL REFERENCES users(id),
receipt_number VARCHAR(100) UNIQUE,
sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
payment_method VARCHAR(50) NOT NULL,
subtotal NUMERIC(12,2) DEFAULT 0,
tax_amount NUMERIC(12,2) DEFAULT 0,
total_amount NUMERIC(12,2) DEFAULT 0
);

-- =====================================================
-- SALE ITEMS
-- =====================================================

CREATE TABLE sale_items (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
product_id UUID NOT NULL REFERENCES products(id),
quantity INTEGER NOT NULL CHECK (quantity > 0),
selling_price NUMERIC(12,2) NOT NULL,
subtotal NUMERIC(12,2) NOT NULL
);

-- =====================================================
-- INVENTORY TRANSACTIONS
-- =====================================================

CREATE TABLE inventory_transactions (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
product_id UUID NOT NULL REFERENCES products(id),
transaction_type VARCHAR(50) NOT NULL,
quantity INTEGER NOT NULL,
reference_type VARCHAR(50),
reference_id UUID,
notes TEXT,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_products_name
ON products(name);

CREATE INDEX idx_products_sku
ON products(sku);

CREATE INDEX idx_sales_date
ON sales(sale_date);

CREATE INDEX idx_purchase_date
ON purchases(purchase_date);

CREATE INDEX idx_inventory_product
ON inventory_transactions(product_id);

-- =====================================================
-- INVENTORY FUNCTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION increase_stock()
RETURNS TRIGGER AS $$
BEGIN
UPDATE products
SET stock_quantity = stock_quantity + NEW.quantity
WHERE id = NEW.product_id;

```
INSERT INTO inventory_transactions(
    product_id,
    transaction_type,
    quantity,
    reference_type,
    reference_id
)
VALUES(
    NEW.product_id,
    'PURCHASE',
    NEW.quantity,
    'PURCHASE',
    NEW.purchase_id
);

RETURN NEW;
```

END;
$$ LANGUAGE plpgsql;

-- =====================================================

CREATE OR REPLACE FUNCTION decrease_stock()
RETURNS TRIGGER AS $$
BEGIN
UPDATE products
SET stock_quantity = stock_quantity - NEW.quantity
WHERE id = NEW.product_id;

```
INSERT INTO inventory_transactions(
    product_id,
    transaction_type,
    quantity,
    reference_type,
    reference_id
)
VALUES(
    NEW.product_id,
    'SALE',
    NEW.quantity,
    'SALE',
    NEW.sale_id
);

RETURN NEW;
```

END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER trg_purchase_stock_update
AFTER INSERT ON purchase_items
FOR EACH ROW
EXECUTE FUNCTION increase_stock();

CREATE TRIGGER trg_sale_stock_update
AFTER INSERT ON sale_items
FOR EACH ROW
EXECUTE FUNCTION decrease_stock();

-- =====================================================
-- SEED DATA - CATEGORIES
-- =====================================================

INSERT INTO categories (name, description)
VALUES
('Beer', 'Beer products'),
('Wine', 'Wine products'),
('Whisky', 'Whisky products'),
('Vodka', 'Vodka products'),
('Gin', 'Gin products'),
('Brandy', 'Brandy products'),
('Rum', 'Rum products'),
('Soft Drinks', 'Soft beverages'),
('Water', 'Drinking water'),
('Energy Drinks', 'Energy beverages');

-- =====================================================
-- DEFAULT ADMIN USER
-- =====================================================
-- Password should be replaced immediately after deployment.
-- Example hash placeholder only.

INSERT INTO users (
full_name,
email,
password_hash,
role
)
VALUES (
'System Administrator',
'[admin@vickerscottage.com](mailto:admin@vickerscottage.com)',
'CHANGE_ME_WITH_BCRYPT_HASH',
'admin'
);

-- =====================================================
-- END OF SCHEMA
-- =====================================================
