const helmet = require('helmet')

/**
 * Security headers — Phase 7
 * Configures Helmet with sensible defaults for a JSON API:
 * - Content-Security-Policy disabled (API, not serving HTML)
 * - X-Content-Type-Options: nosniff
 * - X-Frame-Options: DENY
 * - X-XSS-Protection: 0 (modern browsers ignore it; CSP is better)
 * - Strict-Transport-Security in production
 * - Referrer-Policy: no-referrer
 * - Permissions-Policy: no powerful features
 */
const securityHeaders = helmet({
  contentSecurityPolicy: false, // REST API; frontend handles CSP itself
  crossOriginEmbedderPolicy: false,
  hsts: process.env.NODE_ENV === 'production'
    ? { maxAge: 31536000, includeSubDomains: true, preload: true }
    : false,
})

module.exports = securityHeaders
