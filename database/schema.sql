-- ============================================================
-- Vickers Cottage Inventory & POS System
-- Database Schema — Phase 1: Foundation
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Users ────────────────────────────────────────────────────
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name     VARCHAR(150) NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'manager', 'cashier')),
    is_active     BOOLEAN DEFAULT TRUE,
    created_at    TIMESTAMP DEFAULT NOW(),
    updated_at    TIMESTAMP DEFAULT NOW()
);

-- ── Categories ───────────────────────────────────────────────
CREATE TABLE categories (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Seed default beverage categories
INSERT INTO categories (name) VALUES
    ('Beer'),
    ('Wine'),
    ('Whisky'),
    ('Vodka'),
    ('Gin'),
    ('Brandy'),
    ('Rum'),
    ('Soft Drinks'),
    ('Water'),
    ('Energy Drinks');

-- ── Products ─────────────────────────────────────────────────
CREATE TABLE products (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id     INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    name            VARCHAR(200) NOT NULL,
    sku             VARCHAR(100) UNIQUE NOT NULL,
    purchase_price  NUMERIC(10,2) NOT NULL DEFAULT 0,
    selling_price   NUMERIC(10,2) NOT NULL DEFAULT 0,
    stock_quantity  INTEGER NOT NULL DEFAULT 0,
    reorder_level   INTEGER NOT NULL DEFAULT 5,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- ── Suppliers ────────────────────────────────────────────────
CREATE TABLE suppliers (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_name VARCHAR(200) NOT NULL,
    phone         VARCHAR(20),
    email         VARCHAR(255),
    address       TEXT,
    is_active     BOOLEAN DEFAULT TRUE,
    created_at    TIMESTAMP DEFAULT NOW(),
    updated_at    TIMESTAMP DEFAULT NOW()
);

-- ── Purchases ────────────────────────────────────────────────
CREATE TABLE purchases (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id   UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_cost    NUMERIC(12,2) NOT NULL DEFAULT 0,
    notes         TEXT,
    created_by    UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE purchase_items (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity    INTEGER NOT NULL,
    cost        NUMERIC(10,2) NOT NULL,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- ── Sales ────────────────────────────────────────────────────
CREATE TABLE sales (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cashier_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    sale_date      TIMESTAMP DEFAULT NOW(),
    total_amount   NUMERIC(12,2) NOT NULL DEFAULT 0,
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('cash', 'card', 'mobile_money')),
    created_at     TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sale_items (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id       UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity      INTEGER NOT NULL,
    selling_price NUMERIC(10,2) NOT NULL,
    created_at    TIMESTAMP DEFAULT NOW()
);

-- ── Inventory Transactions ───────────────────────────────────
CREATE TABLE inventory_transactions (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id       UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('stock_in','stock_out','damaged','returned')),
    quantity         INTEGER NOT NULL,
    reference_id     UUID,  -- links to purchase_id or sale_id
    notes            TEXT,
    created_by       UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at       TIMESTAMP DEFAULT NOW()
);

-- ── Refresh Tokens ───────────────────────────────────────────
CREATE TABLE refresh_tokens (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token      TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX idx_products_category    ON products(category_id);
CREATE INDEX idx_products_sku         ON products(sku);
CREATE INDEX idx_purchases_supplier   ON purchases(supplier_id);
CREATE INDEX idx_purchase_items_purchase ON purchase_items(purchase_id);
CREATE INDEX idx_sales_cashier        ON sales(cashier_id);
CREATE INDEX idx_sales_date           ON sales(sale_date);
CREATE INDEX idx_sale_items_sale      ON sale_items(sale_id);
CREATE INDEX idx_inventory_product    ON inventory_transactions(product_id);
CREATE INDEX idx_refresh_tokens_user  ON refresh_tokens(user_id);

-- ── Updated_at trigger ───────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at    BEFORE UPDATE ON users    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Phase 6: M-Pesa transactions ──────────────────────────────
CREATE TABLE IF NOT EXISTS mpesa_transactions (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checkout_request_id  VARCHAR(100) UNIQUE NOT NULL,
    merchant_request_id  VARCHAR(100),
    phone_number         VARCHAR(20) NOT NULL,
    amount               DECIMAL(12,2) NOT NULL,
    status               VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','success','failed','cancelled')),
    mpesa_receipt        VARCHAR(50),
    failure_reason       TEXT,
    sale_id              UUID REFERENCES sales(id) ON DELETE SET NULL,
    created_at           TIMESTAMP DEFAULT NOW(),
    updated_at           TIMESTAMP DEFAULT NOW()
);

CREATE TRIGGER trg_mpesa_updated_at BEFORE UPDATE ON mpesa_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX IF NOT EXISTS idx_mpesa_checkout ON mpesa_transactions(checkout_request_id);
CREATE INDEX IF NOT EXISTS idx_mpesa_sale ON mpesa_transactions(sale_id);

-- ── Default admin user (password: Admin@1234) ────────────────
-- Replace password_hash with your own bcrypt hash before going live in production
INSERT INTO users (full_name, email, password_hash, role) VALUES
    ('System Admin', 'admin@vickerscottage.com',
     '$2b$10$fd6eTNha5jx8NEpErjBkr.kvxALlgopanjAUPxL9gIATVrZ5vhgNm', -- bcrypt hash of "Admin@1234"
     'admin');
