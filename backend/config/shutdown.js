const logger = require('./logger')

/**
 * Graceful shutdown — Phase 7
 * Registers SIGTERM/SIGINT handlers so the server:
 *   1. Stops accepting new connections
 *   2. Drains the DB connection pool
 *   3. Exits cleanly within the timeout
 *
 * Render sends SIGTERM before force-killing; this gives in-flight
 * requests up to 10 seconds to complete.
 */
const SHUTDOWN_TIMEOUT_MS = 10_000

function registerShutdownHandlers(server, pool) {
  const shutdown = async (signal) => {
    logger.info(`Received ${signal} — starting graceful shutdown`)

    // 1. Stop accepting new HTTP connections
    server.close(async () => {
      logger.info('HTTP server closed')
    })

    // 2. Force exit after timeout if still hanging
    const forceExit = setTimeout(() => {
      logger.error('Graceful shutdown timed out — forcing exit')
      process.exit(1)
    }, SHUTDOWN_TIMEOUT_MS)
    forceExit.unref()

    // 3. Drain DB pool
    try {
      await pool.drain()
    } catch (err) {
      logger.error('Error draining DB pool', { error: err.message })
    }

    logger.info('Graceful shutdown complete')
    process.exit(0)
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT',  () => shutdown('SIGINT'))

  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception', { error: err.message, stack: err.stack })
    shutdown('uncaughtException').catch(() => process.exit(1))
  })

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection', {
      reason: reason instanceof Error ? reason.message : String(reason),
      stack:  reason instanceof Error ? reason.stack : undefined,
    })
  })
}

module.exports = registerShutdownHandlers
