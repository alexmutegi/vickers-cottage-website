const { body, validationResult } = require('express-validator')

const handleValidation = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() })
  }
  next()
}

const loginRules = [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
]

const createUserRules = [
  body('full_name').trim().notEmpty().withMessage('Full name required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain a number'),
  body('role')
    .isIn(['admin', 'manager', 'cashier'])
    .withMessage('Role must be admin, manager, or cashier'),
]

const changePasswordRules = [
  body('current_password').notEmpty().withMessage('Current password required'),
  body('new_password')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Must contain an uppercase letter')
    .matches(/[0-9]/).withMessage('Must contain a number'),
]

const resetPasswordRules = [
  body('new_password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Must contain an uppercase letter')
    .matches(/[0-9]/).withMessage('Must contain a number'),
]

// ── Categories ─────────────────────────────────────────────────
const categoryRules = [
  body('name').trim().notEmpty().withMessage('Category name is required')
    .isLength({ max: 100 }).withMessage('Category name too long'),
]

// ── Products ───────────────────────────────────────────────────
const productRules = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('sku').trim().notEmpty().withMessage('SKU is required')
    .isLength({ max: 100 }).withMessage('SKU too long'),
  body('category_id').optional({ nullable: true }).isInt().withMessage('Invalid category'),
  body('purchase_price').isFloat({ min: 0 }).withMessage('Purchase price must be a positive number'),
  body('selling_price').isFloat({ min: 0 }).withMessage('Selling price must be a positive number'),
  body('stock_quantity').optional().isInt({ min: 0 }).withMessage('Stock quantity must be 0 or more'),
  body('reorder_level').optional().isInt({ min: 0 }).withMessage('Reorder level must be 0 or more'),
]

const productUpdateRules = [
  body('name').optional().trim().notEmpty().withMessage('Product name cannot be empty'),
  body('sku').optional().trim().notEmpty().withMessage('SKU cannot be empty'),
  body('category_id').optional({ nullable: true }).isInt().withMessage('Invalid category'),
  body('purchase_price').optional().isFloat({ min: 0 }).withMessage('Purchase price must be a positive number'),
  body('selling_price').optional().isFloat({ min: 0 }).withMessage('Selling price must be a positive number'),
  body('reorder_level').optional().isInt({ min: 0 }).withMessage('Reorder level must be 0 or more'),
]

// ── Inventory Transactions ────────────────────────────────────
const inventoryTransactionRules = [
  body('product_id').isUUID().withMessage('Valid product ID required'),
  body('transaction_type')
    .isIn(['stock_in', 'stock_out', 'damaged', 'returned'])
    .withMessage('Transaction type must be stock_in, stock_out, damaged, or returned'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('notes').optional().isString(),
]

// ── Suppliers ──────────────────────────────────────────────────
const supplierRules = [
  body('supplier_name').trim().notEmpty().withMessage('Supplier name is required')
    .isLength({ max: 200 }).withMessage('Supplier name too long'),
  body('phone').optional({ checkFalsy: true }).isString().isLength({ max: 20 }).withMessage('Phone number too long'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Invalid email address'),
  body('address').optional({ checkFalsy: true }).isString(),
]

const supplierUpdateRules = [
  body('supplier_name').optional().trim().notEmpty().withMessage('Supplier name cannot be empty'),
  body('phone').optional({ checkFalsy: true }).isString().isLength({ max: 20 }).withMessage('Phone number too long'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Invalid email address'),
  body('address').optional({ checkFalsy: true }).isString(),
]

// ── Purchases ──────────────────────────────────────────────────
const purchaseRules = [
  body('supplier_id').optional({ nullable: true }).isUUID().withMessage('Invalid supplier'),
  body('purchase_date').optional({ checkFalsy: true }).isISO8601().withMessage('Invalid date'),
  body('notes').optional().isString(),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.product_id').isUUID().withMessage('Each item needs a valid product ID'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Each item quantity must be at least 1'),
  body('items.*.cost').isFloat({ min: 0 }).withMessage('Each item cost must be 0 or more'),
]

// ── Sales (POS) ──────────────────────────────────────────────────
const saleRules = [
  body('payment_method')
    .isIn(['cash', 'card', 'mobile_money'])
    .withMessage('Payment method must be cash, card, or mobile_money'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.product_id').isUUID().withMessage('Each item needs a valid product ID'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Each item quantity must be at least 1'),
]

module.exports = {
  handleValidation,
  loginRules,
  createUserRules,
  changePasswordRules,
  resetPasswordRules,
  categoryRules,
  productRules,
  productUpdateRules,
  inventoryTransactionRules,
  supplierRules,
  supplierUpdateRules,
  purchaseRules,
  saleRules,
}
