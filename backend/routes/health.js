const express = require('express')
const router  = express.Router()
const pool    = require('../config/db')
const logger  = require('../config/logger')

const START_TIME = Date.now()
const VERSION    = process.env.npm_package_version || '1.0.0'

// GET /api/health — lightweight liveness probe (Render uses this)
router.get('/health', (req, res) => {
  res.json({
    status:    'ok',
    service:   'Vickers Cottage API',
    phase:     'Phase 7 — Production',
    version:   VERSION,
    timestamp: new Date().toISOString(),
  })
})

// GET /api/status — full readiness probe with DB connectivity check
router.get('/status', async (req, res) => {
  const uptimeSeconds = Math.floor((Date.now() - START_TIME) / 1000)
  const mem = process.memoryUsage()

  let db = { ok: false }
  try {
    db = await pool.healthCheck()
  } catch (err) {
    logger.warn('DB health check failed', { error: err.message })
    db = { ok: false, error: err.message }
  }

  const status = db.ok ? 'healthy' : 'degraded'
  const httpStatus = db.ok ? 200 : 503

  res.status(httpStatus).json({
    status,
    uptime_seconds: uptimeSeconds,
    uptime_human:   formatUptime(uptimeSeconds),
    version:        VERSION,
    node_version:   process.version,
    environment:    process.env.NODE_ENV || 'development',
    timestamp:      new Date().toISOString(),
    database: {
      ok:      db.ok,
      db_time: db.db_time || null,
      pool: {
        total:   pool.totalCount,
        idle:    pool.idleCount,
        waiting: pool.waitingCount,
      },
    },
    memory: {
      rss_mb:       (mem.rss / 1024 / 1024).toFixed(1),
      heap_used_mb: (mem.heapUsed / 1024 / 1024).toFixed(1),
      heap_total_mb:(mem.heapTotal / 1024 / 1024).toFixed(1),
    },
  })
})

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return [
    d > 0 ? `${d}d` : null,
    h > 0 ? `${h}h` : null,
    m > 0 ? `${m}m` : null,
    `${s}s`,
  ].filter(Boolean).join(' ')
}

module.exports = router
