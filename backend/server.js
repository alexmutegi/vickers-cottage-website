'use strict'
require('dotenv').config()

const express    = require('express')
const cors       = require('cors')
const rateLimit  = require('express-rate-limit')

const logger          = require('./config/logger')
const pool            = require('./config/db')
const { initSentry, sentryErrorHandler } = require('./config/sentry')
const securityHeaders = require('./middleware/security')
const requestLogger   = require('./middleware/requestLogger')
const errorHandler    = require('./middleware/errorHandler')
const registerShutdown = require('./config/shutdown')

// ── Routes ────────────────────────────────────────────────
const healthRoutes    = require('./routes/health')
const authRoutes      = require('./routes/auth')
const userRoutes      = require('./routes/users')
const categoryRoutes  = require('./routes/categories')
const productRoutes   = require('./routes/products')
const inventoryRoutes = require('./routes/inventory')
const supplierRoutes  = require('./routes/suppliers')
const purchaseRoutes  = require('./routes/purchases')
const saleRoutes      = require('./routes/sales')
const reportRoutes    = require('./routes/reports')
const mpesaRoutes     = require('./routes/mpesa')
const exportRoutes    = require('./routes/exports')

// ── App ───────────────────────────────────────────────────
const app = express()

// Sentry must be first (no-op if SENTRY_DSN not set)
initSentry(app)

// ── Security headers ──────────────────────────────────────
app.use(securityHeaders)

// ── CORS ──────────────────────────────────────────────────
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean)

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
    logger.warn('CORS blocked', { origin })
    callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
}))

// ── Body parsing ──────────────────────────────────────────
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))

// ── Request logging ───────────────────────────────────────
app.use(requestLogger)

// ── Rate limiting ─────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 300,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { message: 'Too many requests — please slow down.' },
  skip: (req) => req.path === '/api/health' || req.path === '/api/status',
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { message: 'Too many login attempts — try again in 15 minutes.' },
})

app.use(globalLimiter)
app.use('/api/auth', authLimiter)

// ── Trust proxy (needed for rate limiting behind Render/Vercel) ──
app.set('trust proxy', 1)

// ── Routes ────────────────────────────────────────────────
app.use('/api',           healthRoutes)   // /api/health + /api/status
app.use('/api/auth',      authRoutes)
app.use('/api/users',     userRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/products',  productRoutes)
app.use('/api/inventory', inventoryRoutes)
app.use('/api/suppliers', supplierRoutes)
app.use('/api/purchases', purchaseRoutes)
app.use('/api/sales',     saleRoutes)
app.use('/api/reports',   reportRoutes)
app.use('/api/mpesa',     mpesaRoutes)
app.use('/api/exports',   exportRoutes)

// ── 404 ───────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} not found` })
})

// ── Error handling (Sentry first, then our handler) ───────
app.use(sentryErrorHandler())
app.use(errorHandler)

// ── Start ─────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT) || 5000

if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(PORT, () => {
    logger.info(`🚀 Vickers Cottage API started`, {
      port: PORT,
      env:  process.env.NODE_ENV || 'development',
      phase: 'Phase 7 — Production Hardening',
    })
  })

  registerShutdown(server, pool)
}

module.exports = app
