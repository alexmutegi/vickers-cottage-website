const AuthService = require('../services/authService')

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication token required' })
  }

  const token = authHeader.split(' ')[1]
  try {
    const decoded = AuthService.verifyAccessToken(token)
    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' })
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions for this action' })
    }
    next()
  }
}

module.exports = { authenticate, authorize }
