/**
 * Sentry error monitoring — Phase 7
 * Only initialises when SENTRY_DSN is set in environment.
 * Safe to import even without the DSN — it's a no-op.
 *
 * To enable:
 *   1. Create a project at sentry.io (free tier is fine)
 *   2. Copy the DSN from Settings → Client Keys
 *   3. Add SENTRY_DSN=https://xxx@oxx.ingest.sentry.io/xxx to Render env vars
 */
let Sentry = null

function initSentry(app) {
  if (!process.env.SENTRY_DSN) return

  try {
    Sentry = require('@sentry/node')
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      release: process.env.npm_package_version || '1.0.0',

      // Capture 10% of transactions as performance traces in prod,
      // 100% in dev so you can verify it's working.
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

      // Don't send PII (IP addresses stripped)
      sendDefaultPii: false,
    })

    // Attach request handler (must be FIRST middleware)
    app.use(Sentry.Handlers.requestHandler())
    app.use(Sentry.Handlers.tracingHandler())

    const logger = require('./logger')
    logger.info('Sentry initialised', { dsn: process.env.SENTRY_DSN.replace(/:[^@]+@/, ':***@') })
  } catch (err) {
    const logger = require('./logger')
    logger.warn('Sentry failed to initialise', { error: err.message })
  }
}

function sentryErrorHandler() {
  if (!Sentry) return (err, req, res, next) => next(err) // pass-through
  return Sentry.Handlers.errorHandler({
    shouldHandleError: (err) => (err.status || 500) >= 500,
  })
}

module.exports = { initSentry, sentryErrorHandler }
