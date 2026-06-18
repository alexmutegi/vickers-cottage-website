const mpesa = require('../services/mpesa')

// POST /api/mpesa/stk-push
// Initiates an STK push (sends payment prompt to customer's phone)
const initiatePayment = async (req, res) => {
  try {
    const { phone, amount, sale_id } = req.body

    if (!phone || !amount) {
      return res.status(422).json({ message: 'phone and amount are required' })
    }
    if (amount <= 0) {
      return res.status(422).json({ message: 'amount must be greater than 0' })
    }

    const response = await mpesa.initiateSTKPush({
      phone,
      amount,
      accountRef: `VC-${sale_id || Date.now()}`,
      description: 'Vickers Cottage Payment',
    })

    if (response.ResponseCode !== '0') {
      return res.status(400).json({
        message: response.ResponseDescription || 'STK push failed',
        detail: response,
      })
    }

    // Store pending transaction
    const txn = await mpesa.createMpesaTransaction({
      checkout_request_id: response.CheckoutRequestID,
      phone,
      amount,
      sale_id: sale_id || null,
    })

    res.status(201).json({
      message: 'Payment prompt sent to phone',
      checkout_request_id: response.CheckoutRequestID,
      merchant_request_id: response.MerchantRequestID,
      transaction: txn,
    })
  } catch (err) {
    console.error('M-Pesa STK push error:', err)
    if (err.message.includes('not configured') || err.message.includes('credentials')) {
      return res.status(503).json({ message: err.message })
    }
    res.status(500).json({ message: 'M-Pesa payment initiation failed', detail: err.message })
  }
}

// POST /api/mpesa/callback  (called by Safaricom servers — no auth)
const handleCallback = async (req, res) => {
  try {
    const result = await mpesa.handleCallback(req.body)
    console.log('M-Pesa callback:', result)
    // Always respond 200 to Safaricom
    res.json({ ResultCode: 0, ResultDesc: 'Success' })
  } catch (err) {
    console.error('M-Pesa callback error:', err)
    res.json({ ResultCode: 0, ResultDesc: 'Accepted' })
  }
}

// GET /api/mpesa/status/:checkout_request_id  — poll payment status
const getStatus = async (req, res) => {
  try {
    const txn = await mpesa.getTransactionStatus(req.params.checkout_request_id)
    if (!txn) return res.status(404).json({ message: 'Transaction not found' })
    res.json({ transaction: txn })
  } catch (err) {
    console.error('M-Pesa status error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = { initiatePayment, handleCallback, getStatus }
