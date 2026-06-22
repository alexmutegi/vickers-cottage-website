/**
 * M-Pesa Daraja API integration — STK Push (Lipa Na M-Pesa Online)
 *
 * Required env vars:
 *   MPESA_CONSUMER_KEY
 *   MPESA_CONSUMER_SECRET
 *   MPESA_SHORTCODE           — Business shortcode (e.g. 174379 for sandbox)
 *   MPESA_PASSKEY             — Passkey from Safaricom Developer portal
 *   MPESA_CALLBACK_URL        — Public HTTPS URL (e.g. https://your-api.onrender.com/api/mpesa/callback)
 *   MPESA_ENV                 — 'sandbox' or 'production'
 */

const https = require('https')
const pool = require('../config/db')

const BASE_URL = process.env.MPESA_ENV === 'production'
  ? 'https://api.safaricom.co.ke'
  : 'https://sandbox.safaricom.co.ke'

// ── Get OAuth access token ─────────────────────────────────
async function getAccessToken() {
  const key    = process.env.MPESA_CONSUMER_KEY
  const secret = process.env.MPESA_CONSUMER_SECRET

  if (!key || !secret) {
    throw new Error('M-Pesa credentials not configured. Set MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET.')
  }

  const credentials = Buffer.from(`${key}:${secret}`).toString('base64')
  const url = `${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`

  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: 'GET',
      headers: { Authorization: `Basic ${credentials}` },
    }, res => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          if (!parsed.access_token) reject(new Error('Failed to get M-Pesa access token'))
          else resolve(parsed.access_token)
        } catch (e) {
          reject(new Error('Invalid M-Pesa auth response'))
        }
      })
    })
    req.on('error', reject)
    req.end()
  })
}

// ── STK Push initiation ────────────────────────────────────
async function initiateSTKPush({ phone, amount, accountRef, description }) {
  const token      = await getAccessToken()
  const shortcode  = process.env.MPESA_SHORTCODE
  const passkey    = process.env.MPESA_PASSKEY
  const callbackUrl = process.env.MPESA_CALLBACK_URL

  if (!shortcode || !passkey || !callbackUrl) {
    throw new Error('M-Pesa shortcode, passkey, and callback URL must be configured.')
  }

  // Timestamp format: YYYYMMDDHHmmss
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14)
  const password  = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64')

  // Normalize phone: strip leading 0 or +254, ensure 254 prefix
  const normalizedPhone = phone
    .replace(/\s+/g, '')
    .replace(/^\+/, '')
    .replace(/^0/, '254')

  const body = {
    BusinessShortCode: shortcode,
    Password:          password,
    Timestamp:         timestamp,
    TransactionType:   'CustomerPayBillOnline',
    Amount:            Math.ceil(amount), // M-Pesa requires whole numbers
    PartyA:            normalizedPhone,
    PartyB:            shortcode,
    PhoneNumber:       normalizedPhone,
    CallBackURL:       callbackUrl,
    AccountReference:  accountRef || 'Vickers Cottage',
    TransactionDesc:   description || 'Payment',
  }

  const url = `${BASE_URL}/mpesa/stkpush/v1/processrequest`
  const jsonBody = JSON.stringify(body)

  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }, res => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          resolve(JSON.parse(data))
        } catch (e) {
          reject(new Error('Invalid M-Pesa STK push response'))
        }
      })
    })
    req.on('error', reject)
    req.write(jsonBody)
    req.end()
  })
}

// ── Store pending transaction ──────────────────────────────
async function createMpesaTransaction({ checkout_request_id, phone, amount, sale_id }) {
  const result = await pool.query(
    `INSERT INTO mpesa_transactions
       (checkout_request_id, phone_number, amount, status, sale_id)
     VALUES ($1, $2, $3, 'pending', $4)
     RETURNING *`,
    [checkout_request_id, phone, amount, sale_id || null]
  )
  return result.rows[0]
}

// ── Handle Safaricom callback ──────────────────────────────
async function handleCallback(body) {
  const stk = body?.Body?.stkCallback
  if (!stk) return { ok: false, reason: 'malformed' }

  const checkoutId = stk.CheckoutRequestID
  const resultCode = stk.ResultCode // 0 = success

  if (resultCode === 0) {
    // Extract M-Pesa receipt number from callback metadata
    const items  = stk.CallbackMetadata?.Item || []
    const receipt = items.find(i => i.Name === 'MpesaReceiptNumber')?.Value

    await pool.query(
      `UPDATE mpesa_transactions
       SET status = 'success', mpesa_receipt = $1, updated_at = NOW()
       WHERE checkout_request_id = $2`,
      [receipt || null, checkoutId]
    )
    return { ok: true, receipt }
  } else {
    const reason = stk.ResultDesc || 'Payment failed or cancelled'
    await pool.query(
      `UPDATE mpesa_transactions
       SET status = 'failed', failure_reason = $1, updated_at = NOW()
       WHERE checkout_request_id = $2`,
      [reason, checkoutId]
    )
    return { ok: false, reason }
  }
}

// ── Poll transaction status ────────────────────────────────
async function getTransactionStatus(checkout_request_id) {
  const result = await pool.query(
    `SELECT * FROM mpesa_transactions WHERE checkout_request_id = $1`,
    [checkout_request_id]
  )
  return result.rows[0] || null
}

module.exports = { initiateSTKPush, createMpesaTransaction, handleCallback, getTransactionStatus }
