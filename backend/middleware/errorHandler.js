const logger = require('../config/logger')

/**
 * Global error handler — must be registered LAST with app.use()
 * Logs the error, optionally captures to Sentry, and sends a clean response.
 */
const errorHandler = (err, req, res, next) => {
  // ── Structured log ───────────────────────────────────────
  const status = err.status || err.statusCode || 500
  const isServerError = status >= 500

  const meta = {
    method:   req.method,
    path:     req.path,
    status,
    userId:   req.user?.id || null,
    userRole: req.user?.role || null,
    stack:    isServerError ? err.stack : undefined,
  }

  if (isServerError) {
    logger.error(err.message || 'Internal server error', meta)
  } else {
    logger.warn(err.message || 'Client error', meta)
  }

  // ── Sentry capture (server errors only) ─────────────────
  if (isServerError && process.env.SENTRY_DSN) {
    try {
      const Sentry = require('@sentry/node')
      Sentry.withScope(scope => {
        if (req.user) scope.setUser({ id: req.user.id, role: req.user.role })
        scope.setTag('method', req.method)
        scope.setTag('path', req.path)
        Sentry.captureException(err)
      })
    } catch { /* Sentry not initialised — skip silently */ }
  }

  // ── Response ─────────────────────────────────────────────
  if (res.headersSent) return next(err)

  res.status(status).json({
    message: isServerError && process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message || 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && isServerError
      ? { stack: err.stack }
      : {}),
  })
}

module.exports = errorHandler
