const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
require('dotenv').config()

const SALT_ROUNDS = 10

class AuthService {
  static async hashPassword(password) {
    return bcrypt.hash(password, SALT_ROUNDS)
  }

  static async comparePassword(password, hash) {
    return bcrypt.compare(password, hash)
  }

  static generateAccessToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    })
  }

  static generateRefreshToken(payload) {
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    })
  }

  static verifyAccessToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET)
  }

  static verifyRefreshToken(token) {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET)
  }

  static getRefreshTokenExpiry() {
    const days = 7
    const expiry = new Date()
    expiry.setDate(expiry.getDate() + days)
    return expiry
  }
}

module.exports = AuthService
