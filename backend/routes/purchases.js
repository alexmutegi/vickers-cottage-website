const express = require('express')
const router = express.Router()
const { getPurchases, getPurchase, createPurchase } = require('../controllers/purchaseController')
const { authenticate, authorize } = require('../middleware/auth')
const { purchaseRules, handleValidation } = require('../middleware/validate')

router.use(authenticate, authorize('admin', 'manager'))

router.get('/',    getPurchases)
router.get('/:id', getPurchase)
router.post('/',   purchaseRules, handleValidation, createPurchase)

module.exports = router
