/**
 * Logger — Phase 7
 * Uses Winston for structured JSON logging in production,
 * and pretty-printed coloured output in development.
 */
const { createLogger, format, transports } = require('winston')
const { combine, timestamp, errors, json, colorize, printf } = format

const isProd = process.env.NODE_ENV === 'production'

// ── Dev format: coloured single-line ──────────────────────
const devFormat = combine(
  colorize(),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : ''
    return `${timestamp} [${level}] ${message}${stack ? `\n${stack}` : ''}${metaStr}`
  })
)

// ── Prod format: JSON for log aggregators ─────────────────
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
)

const logger = createLogger({
  level:      process.env.LOG_LEVEL || (isProd ? 'info' : 'debug'),
  format:     isProd ? prodFormat : devFormat,
  defaultMeta: { service: 'vickers-cottage-api' },
  transports: [
    new transports.Console(),
  ],
  exitOnError: false,
})

// Silence logs completely during tests
if (process.env.NODE_ENV === 'test') {
  logger.silent = true
}

module.exports = logger
