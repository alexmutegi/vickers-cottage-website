const { Pool } = require('pg')
const logger = require('./logger')
require('dotenv').config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,

  // ── Pool tuning ──────────────────────────────────────────
  max:              parseInt(process.env.DB_POOL_MAX)     || 10,  // max connections
  min:              parseInt(process.env.DB_POOL_MIN)     || 2,   // keep alive connections
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
  connectionTimeoutMillis: 5000,
  allowExitOnIdle:  false,
})

pool.on('connect', (client) => {
  if (process.env.NODE_ENV !== 'test') {
    logger.debug('DB client connected', { totalCount: pool.totalCount })
  }
})

pool.on('error', (err) => {
  logger.error('Unexpected DB client error', { error: err.message, stack: err.stack })
  // Don't exit — let the pool recover; Render will restart if truly broken
})

// ── Health check ─────────────────────────────────────────
pool.healthCheck = async () => {
  const client = await pool.connect()
  try {
    const result = await client.query('SELECT 1 AS ok, NOW() AS db_time')
    return { ok: true, db_time: result.rows[0].db_time }
  } finally {
    client.release()
  }
}

// ── Graceful drain ───────────────────────────────────────
pool.drain = async () => {
  logger.info('Draining DB pool…')
  await pool.end()
  logger.info('DB pool closed')
}

module.exports = pool
