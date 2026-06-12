# Software Requirements Specification (SRS)

# Vickers Cottage Inventory & Point of Sale System

Version: 1.0

Date: June 2026

---

# 1. Introduction

## 1.1 Purpose

This Software Requirements Specification (SRS) defines the requirements for the Vickers Cottage Inventory & Point of Sale (POS) System.

The system will enable Vickers Cottage to manage inventory, suppliers, purchases, sales transactions, stock movement, reporting, and staff access through a centralized web application.

The primary goal is to improve inventory accuracy, automate stock management, increase operational efficiency, and provide real-time business insights.

---

## 1.2 Scope

The Vickers Cottage Inventory & POS System is a web-based application designed for a beverage retail business that purchases and sells alcoholic and non-alcoholic drinks.

The system will support:

* Inventory management
* Product management
* Purchase management
* Supplier management
* Point of Sale operations
* Sales management
* Reporting and analytics
* User management
* Receipt generation

Future versions may support:

* M-Pesa integration
* Barcode scanning
* Multi-branch operations
* Mobile applications
* Customer loyalty programs

---

## 1.3 Definitions

| Term          | Definition                                |
| ------------- | ----------------------------------------- |
| POS           | Point of Sale                             |
| SKU           | Stock Keeping Unit                        |
| Inventory     | Available stock for sale                  |
| Purchase      | Acquisition of products from suppliers    |
| Sale          | Transaction between business and customer |
| Stock In      | Increase in inventory quantity            |
| Stock Out     | Reduction in inventory quantity           |
| Reorder Level | Minimum quantity before replenishment     |

---

# 2. Overall Description

## 2.1 Product Perspective

The system will replace manual inventory records and spreadsheet-based sales tracking.

The application will be browser-based and accessible from:

* Desktop computers
* Laptops
* Tablets
* Mobile devices

---

## 2.2 Product Functions

The system shall provide:

### Inventory Functions

* Add products
* Edit products
* Delete products
* Search products
* Categorize products
* Monitor stock levels

### Supplier Functions

* Add suppliers
* Edit supplier information
* Track supplier transactions

### Purchase Functions

* Record purchases
* Receive inventory
* Generate purchase history

### Sales Functions

* Process customer sales
* Generate receipts
* Record payment methods
* Update stock automatically

### Reporting Functions

* Daily sales reports
* Monthly sales reports
* Inventory reports
* Profit reports
* Low stock reports

### User Functions

* Authentication
* Role-based authorization
* User management

---

## 2.3 User Classes

### Administrator

Responsibilities:

* Manage system settings
* Manage users
* View all reports
* Manage inventory
* Manage suppliers

### Store Manager

Responsibilities:

* Manage inventory
* Manage purchases
* View reports

### Cashier

Responsibilities:

* Process sales
* Print receipts
* View products

---

## 2.4 Operating Environment

### Client

* Google Chrome
* Microsoft Edge
* Firefox
* Safari

### Server

* Linux Server
* Node.js Runtime

### Database

* PostgreSQL

---

# 3. Functional Requirements

# FR-001 User Authentication

### Description

The system shall authenticate users before granting access.

### Inputs

* Email
* Password

### Outputs

* Access token
* User session

### Acceptance Criteria

* Valid credentials grant access.
* Invalid credentials are rejected.

---

# FR-002 Product Management

### Description

The system shall allow authorized users to manage products.

### Product Information

* Product Name
* SKU
* Category
* Purchase Price
* Selling Price
* Stock Quantity
* Reorder Level

### Acceptance Criteria

* Products can be created.
* Products can be updated.
* Products can be deleted.
* Products can be searched.

---

# FR-003 Category Management

### Description

The system shall allow products to be organized into categories.

### Categories

* Beer
* Wine
* Whisky
* Vodka
* Gin
* Brandy
* Rum
* Soft Drinks
* Water
* Energy Drinks

---

# FR-004 Supplier Management

### Description

The system shall maintain supplier information.

### Supplier Fields

* Name
* Phone
* Email
* Address

---

# FR-005 Purchase Management

### Description

The system shall record purchases from suppliers.

### Inputs

* Supplier
* Products
* Quantities
* Purchase Cost

### Outputs

* Updated inventory

### Acceptance Criteria

* Purchase records are saved.
* Stock levels increase automatically.

---

# FR-006 Inventory Management

### Description

The system shall track all stock movements.

### Movement Types

* Stock In
* Stock Out
* Damaged
* Returned

### Acceptance Criteria

* Inventory balances remain accurate.
* Complete stock history is available.

---

# FR-007 Point of Sale

### Description

The system shall allow cashiers to process customer purchases.

### Inputs

* Product selection
* Quantity
* Payment method

### Outputs

* Receipt
* Updated inventory

### Payment Methods

* Cash
* Card
* Mobile Money

---

# FR-008 Receipt Generation

### Description

The system shall generate receipts for completed sales.

### Receipt Information

* Business Name
* Date
* Products Sold
* Quantity
* Price
* Total Amount

---

# FR-009 Reporting

### Description

The system shall generate business reports.

### Report Types

#### Daily Sales

* Sales total
* Transactions count
* Profit

#### Monthly Sales

* Revenue
* Cost
* Profit

#### Inventory Report

* Current stock levels

#### Low Stock Report

* Products below reorder level

---

# FR-010 User Management

### Description

Administrators shall manage user accounts.

### Functions

* Create users
* Edit users
* Disable users
* Assign roles

---

# 4. Non-Functional Requirements

## Performance

* Dashboard loads within 3 seconds.
* Sales transactions process within 2 seconds.
* Search results return within 1 second.

---

## Security

* Passwords shall be encrypted.
* JWT authentication shall be used.
* Role-based access control shall be enforced.
* User sessions shall expire automatically.

---

## Reliability

* System uptime target: 99.5%
* Automatic database backups

---

## Scalability

The system shall support:

* Multiple users simultaneously
* Future multi-branch deployment
* Growth to thousands of products

---

## Usability

The user interface shall:

* Be responsive
* Support mobile devices
* Require minimal training

---

# 5. Database Requirements

## Core Tables

### Users

* id
* full_name
* email
* password_hash
* role

### Categories

* id
* name

### Products

*
* id
* category_id
* name
* sku
* purchase_price
* selling_price
* stock_quantity
* reorder_level

### Suppliers

* id
* supplier_name
* phone
* email
* address

### Purchases

* id
* supplier_id
* purchase_date
* total_cost

### Purchase Items

* id
* purchase_id
* product_id
* quantity
* cost

### Sales

* id
* cashier_id
* sale_date
* total_amount
* payment_method

### Sale Items

* id
* sale_id
* product_id
* quantity
* selling_price

### Inventory Transactions

* id
* product_id
* transaction_type
* quantity
* created_at

---

# 6. Future Enhancements

## Phase 2

* Barcode scanner support
* QR code support
* Receipt printer integration

## Phase 3

* M-Pesa integration
* SMS notifications
* Email reports

## Phase 4

* Mobile application
* Customer loyalty program
* Multi-branch inventory

---

# 7. Success Criteria

The project shall be considered successful when:

* Inventory is updated automatically after purchases and sales.
* Sales can be processed without manual calculations.
* Reports accurately reflect business performance.
* Users can access the system securely.
* Stock losses due to poor tracking are reduced.

---

# 8. Approval

Project Name:
Vickers Cottage Inventory & POS System

Version:
1.0

Status:
Approved for Design and Development Phase
