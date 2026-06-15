const express = require('express')
const router = express.Router()
const { getSales, getSale, createSale, getDashboardSummary } = require('../controllers/saleController')
const { authenticate, authorize } = require('../middleware/auth')
const { saleRules, handleValidation } = require('../middleware/validate')

// All authenticated roles can use POS (cashier, manager, admin)
router.use(authenticate)

router.get('/dashboard/summary', authorize('admin', 'manager'), getDashboardSummary)

router.get('/',    getSales)
router.get('/:id', getSale)
router.post('/',   saleRules, handleValidation, createSale)

module.exports = router
