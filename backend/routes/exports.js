const express = require('express')
const router = express.Router()
const { exportSales, exportInventory, exportLowStock } = require('../controllers/exportController')
const { authenticate, authorize } = require('../middleware/auth')

router.use(authenticate, authorize('admin', 'manager'))

router.get('/sales',     exportSales)
router.get('/inventory', exportInventory)
router.get('/low-stock', exportLowStock)

module.exports = router
