const morgan = require('morgan')
const logger  = require('../config/logger')

// Custom token for response time in ms
morgan.token('body-size', (req, res) => res.getHeader('content-length') || '-')

// Stream Morgan output through Winston
const stream = {
  write: (message) => logger.http(message.trim()),
}

// Skip health check + callback noise in logs
const skip = (req) => {
  const url = req.originalUrl
  return (
    url === '/api/health' ||
    url === '/api/status' ||
    url.startsWith('/api/mpesa/callback')
  )
}

const format = process.env.NODE_ENV === 'production'
  ? ':remote-addr :method :url :status :res[content-length] - :response-time ms'
  : ':method :url :status :response-time ms - :body-size bytes'

module.exports = morgan(format, { stream, skip })
