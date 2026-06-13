const express = require('express')
const router = express.Router()
const { getUsers, createUser, updateUser, resetPassword } = require('../controllers/userController')
const { authenticate, authorize } = require('../middleware/auth')
const { createUserRules, resetPasswordRules, handleValidation } = require('../middleware/validate')

// All user management routes require admin role
router.use(authenticate, authorize('admin'))

router.get('/',                         getUsers)
router.post('/',                        createUserRules, handleValidation, createUser)
router.put('/:id',                      updateUser)
router.put('/:id/reset-password',       resetPasswordRules, handleValidation, resetPassword)

module.exports = router
