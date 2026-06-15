const express = require('express')
const router = express.Router()
const {
  getDailySales, getMonthlySales, getInventoryReport, getLowStockReport, getProfitReport,
} = require('../controllers/reportController')
const { authenticate, authorize } = require('../middleware/auth')

// Reports are visible to admins and managers only
router.use(authenticate, authorize('admin', 'manager'))

router.get('/daily-sales',   getDailySales)
router.get('/monthly-sales', getMonthlySales)
router.get('/inventory',     getInventoryReport)
router.get('/low-stock',     getLowStockReport)
router.get('/profit',        getProfitReport)

module.exports = router
