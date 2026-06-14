const express = require('express')
const router = express.Router()
const {
  getProducts, getProduct, createProduct, updateProduct, deleteProduct,
  getLowStockProducts, getInventoryValue,
} = require('../controllers/productController')
const { authenticate, authorize } = require('../middleware/auth')
const { productRules, productUpdateRules, handleValidation } = require('../middleware/validate')

router.use(authenticate)

// Specific routes before /:id to avoid conflicts
router.get('/low-stock',       authorize('admin', 'manager'), getLowStockProducts)
router.get('/inventory-value', authorize('admin', 'manager'), getInventoryValue)

router.get('/',     getProducts)
router.get('/:id',  getProduct)
router.post('/',    authorize('admin', 'manager'), productRules, handleValidation, createProduct)
router.put('/:id',  authorize('admin', 'manager'), productUpdateRules, handleValidation, updateProduct)
router.delete('/:id', authorize('admin'), deleteProduct)

module.exports = router
