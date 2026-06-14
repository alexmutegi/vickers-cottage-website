require('dotenv').config()
const express = require('express')
const cors = require('cors')
const rateLimit = require('express-rate-limit')

const authRoutes = require('./routes/auth')
const userRoutes = require('./routes/users')
const categoryRoutes = require('./routes/categories')
const productRoutes = require('./routes/products')
const inventoryRoutes = require('./routes/inventory')
const supplierRoutes = require('./routes/suppliers')
const purchaseRoutes = require('./routes/purchases')
const saleRoutes = require('./routes/sales')
const reportRoutes = require('./routes/reports')

const app = express()

// ── Middleware ────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Rate limiting — stricter on auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { message: 'Too many requests, please try again later.' },
})

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
})

app.use(globalLimiter)
app.use('/api/auth', authLimiter)

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth',      authRoutes)
app.use('/api/users',     userRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/products',  productRoutes)
app.use('/api/inventory', inventoryRoutes)
app.use('/api/suppliers', supplierRoutes)
app.use('/api/purchases', purchaseRoutes)
app.use('/api/sales',     saleRoutes)
app.use('/api/reports',   reportRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Vickers Cottage API',
    phase: 'Phase 5 — Reporting',
    timestamp: new Date().toISOString(),
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} not found` })
})

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ message: 'Internal server error' })
})

// ── Start ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Vickers Cottage API running on port ${PORT}`)
    console.log(`📋 Phase 1 — Foundation`)
    console.log(`🌐 Health: http://localhost:${PORT}/api/health`)
  })
}

module.exports = app
