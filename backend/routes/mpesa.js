const express = require('express')
const router = express.Router()
const { initiatePayment, handleCallback, getStatus } = require('../controllers/mpesaController')
const { authenticate } = require('../middleware/auth')

// Callback is called by Safaricom — no auth token
router.post('/callback', handleCallback)

// STK push and status require authenticated user
router.post('/stk-push', authenticate, initiatePayment)
router.get('/status/:checkout_request_id', authenticate, getStatus)

module.exports = router
