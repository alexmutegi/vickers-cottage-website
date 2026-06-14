const express = require('express')
const router = express.Router()
const { createTransaction, getTransactions } = require('../controllers/inventoryController')
const { authenticate, authorize } = require('../middleware/auth')
const { inventoryTransactionRules, handleValidation } = require('../middleware/validate')

router.use(authenticate, authorize('admin', 'manager'))

router.get('/transactions',  getTransactions)
router.post('/transactions', inventoryTransactionRules, handleValidation, createTransaction)

module.exports = router
