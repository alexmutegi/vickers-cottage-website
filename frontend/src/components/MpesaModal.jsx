import { useState, useEffect, useRef } from 'react'
import api from '../api'
import './MpesaModal.css'

const POLL_INTERVAL = 3000 // poll every 3s
const POLL_TIMEOUT  = 90000 // give up after 90s

/**
 * MpesaModal
 * Shows STK push prompt, then polls for payment confirmation.
 *
 * Props:
 *   amount           — amount in KES
 *   saleId           — optional linked sale ID
 *   onSuccess(receipt) — called when payment confirmed
 *   onClose()          — called on dismiss/cancel
 */
export default function MpesaModal({ amount, saleId, onSuccess, onClose }) {
  const [phone, setPhone] = useState('')
  const [step, setStep] = useState('input') // input | pending | success | failed
  const [error, setError] = useState('')
  const [receipt, setReceipt] = useState('')
  const [checkoutId, setCheckoutId] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const pollRef = useRef(null)
  const timerRef = useRef(null)
  const startRef = useRef(null)

  const stopPolling = () => {
    clearInterval(pollRef.current)
    clearInterval(timerRef.current)
  }

  useEffect(() => () => stopPolling(), [])

  const startPolling = (checkoutRequestId) => {
    startRef.current = Date.now()

    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000))
    }, 1000)

    pollRef.current = setInterval(async () => {
      // Timeout check
      if (Date.now() - startRef.current > POLL_TIMEOUT) {
        stopPolling()
        setStep('failed')
        setError('Payment timed out. Please try again.')
        return
      }

      try {
        const { data } = await api.get(`/mpesa/status/${checkoutRequestId}`)
        const txn = data.transaction

        if (txn.status === 'success') {
          stopPolling()
          setReceipt(txn.mpesa_receipt)
          setStep('success')
          onSuccess(txn.mpesa_receipt)
        } else if (txn.status === 'failed') {
          stopPolling()
          setStep('failed')
          setError(txn.failure_reason || 'Payment was declined or cancelled.')
        }
        // if still 'pending', keep polling
      } catch {
        // network error — keep polling
      }
    }, POLL_INTERVAL)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const cleaned = phone.replace(/\s+/g, '').replace(/^\+/, '').replace(/^0/, '254')
    if (!/^2547\d{8}$/.test(cleaned)) {
      setError('Enter a valid Kenyan mobile number (e.g. 0712 345 678)')
      return
    }

    try {
      setStep('pending')
      const { data } = await api.post('/mpesa/stk-push', {
        phone: cleaned,
        amount,
        sale_id: saleId || undefined,
      })
      setCheckoutId(data.checkout_request_id)
      startPolling(data.checkout_request_id)
    } catch (err) {
      setStep('input')
      setError(err.response?.data?.message || 'Failed to send payment request. Check M-Pesa is configured.')
    }
  }

  return (
    <div className="mpesa-overlay" onClick={onClose}>
      <div className="mpesa-modal" onClick={e => e.stopPropagation()}>
        <div className="mpesa-header">
          <div className="mpesa-logo">📱</div>
          <div>
            <h2>Lipa Na M-Pesa</h2>
            <p>KES {Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
          {step !== 'pending' && (
            <button className="mpesa-close" onClick={onClose}>✕</button>
          )}
        </div>

        {step === 'input' && (
          <form onSubmit={handleSubmit} className="mpesa-body">
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-group">
              <label>Customer M-Pesa Phone Number</label>
              <input
                type="tel"
                placeholder="e.g. 0712 345 678"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                autoFocus
              />
              <span className="field-hint">Must be a Safaricom number registered for M-Pesa</span>
            </div>
            <div className="mpesa-actions">
              <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn-mpesa">Send Payment Request →</button>
            </div>
          </form>
        )}

        {step === 'pending' && (
          <div className="mpesa-body mpesa-waiting">
            <div className="mpesa-pulse">
              <div className="mpesa-pulse-ring" />
              <div className="mpesa-pulse-ring" style={{ animationDelay: '0.3s' }} />
              <span className="mpesa-pulse-icon">📲</span>
            </div>
            <h3>Waiting for payment…</h3>
            <p>An M-Pesa prompt has been sent to <strong>{phone}</strong>. Ask the customer to enter their PIN to complete payment.</p>
            <div className="mpesa-timer">{elapsed}s</div>
            <button className="btn-outline" onClick={() => { stopPolling(); setStep('input'); setError('') }}>
              Resend / Change Number
            </button>
          </div>
        )}

        {step === 'success' && (
          <div className="mpesa-body mpesa-result success">
            <div className="result-icon">✅</div>
            <h3>Payment Confirmed!</h3>
            {receipt && <p>M-Pesa Receipt: <strong>{receipt}</strong></p>}
            <p className="amount-display">KES {Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} received</p>
            <button className="btn-primary" onClick={onClose}>Done</button>
          </div>
        )}

        {step === 'failed' && (
          <div className="mpesa-body mpesa-result failed">
            <div className="result-icon">❌</div>
            <h3>Payment Failed</h3>
            <p>{error}</p>
            <div className="mpesa-actions">
              <button className="btn-outline" onClick={onClose}>Cancel</button>
              <button className="btn-mpesa" onClick={() => { setStep('input'); setError('') }}>Try Again</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
