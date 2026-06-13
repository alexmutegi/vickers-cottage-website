const express = require('express')
const router = express.Router()
const { login, refresh, logout, getMe, changePassword } = require('../controllers/authController')
const { authenticate } = require('../middleware/auth')
const { loginRules, changePasswordRules, handleValidation } = require('../middleware/validate')

router.post('/login',           loginRules, handleValidation, login)
router.post('/refresh',         refresh)
router.post('/logout',          logout)
router.get('/me',               authenticate, getMe)
router.put('/change-password',  authenticate, changePasswordRules, handleValidation, changePassword)

module.exports = router
