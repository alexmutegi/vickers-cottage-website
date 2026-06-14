const express = require('express')
const router = express.Router()
const {
  getSuppliers, getSupplier, createSupplier, updateSupplier, deleteSupplier,
} = require('../controllers/supplierController')
const { authenticate, authorize } = require('../middleware/auth')
const { supplierRules, supplierUpdateRules, handleValidation } = require('../middleware/validate')

router.use(authenticate, authorize('admin', 'manager'))

router.get('/',     getSuppliers)
router.get('/:id',  getSupplier)
router.post('/',    supplierRules, handleValidation, createSupplier)
router.put('/:id',  supplierUpdateRules, handleValidation, updateSupplier)
router.delete('/:id', authorize('admin'), deleteSupplier)

module.exports = router
