const express = require('express')
const router = express.Router()
const { getCategories, createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController')
const { authenticate, authorize } = require('../middleware/auth')
const { categoryRules, handleValidation } = require('../middleware/validate')

router.use(authenticate)

router.get('/',     getCategories)
router.post('/',    authorize('admin', 'manager'), categoryRules, handleValidation, createCategory)
router.put('/:id',  authorize('admin', 'manager'), categoryRules, handleValidation, updateCategory)
router.delete('/:id', authorize('admin'), deleteCategory)

module.exports = router
