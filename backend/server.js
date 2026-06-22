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
const mpesaRoutes  = require('./routes/mpesa')
const exportRoutes = require('./routes/exports')

const app = express()

// ── Middleware ────────────────────────────────────────────────
// FRONTEND_URL can be a single origin or a comma-separated list
// (e.g. "https://app.vercel.app,http://localhost:5173")
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean)

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, server-to-server, health checks)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true)
    }
    callback(new Error('Not allowed by CORS'))
  },
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
app.use('/api/mpesa',    mpesaRoutes)
app.use('/api/exports',  exportRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Vickers Cottage API',
    phase: 'Phase 6 — Advanced Features',
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
    console.log(`📋 Phase 5 — Reporting (Complete)`)
    console.log(`🌐 Health: http://localhost:${PORT}/api/health`)
  })
}

module.exports = app
