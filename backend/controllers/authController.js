const UserModel = require('../models/User')
const AuthService = require('../services/authService')

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await UserModel.findByEmail(email)
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    if (!user.is_active) {
      return res.status(403).json({ message: 'Your account has been disabled. Contact the administrator.' })
    }

    const passwordMatch = await AuthService.comparePassword(password, user.password_hash)
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const payload = { id: user.id, email: user.email, role: user.role }

    const accessToken = AuthService.generateAccessToken(payload)
    const refreshToken = AuthService.generateRefreshToken(payload)
    const refreshExpiry = AuthService.getRefreshTokenExpiry()

    await UserModel.saveRefreshToken(user.id, refreshToken, refreshExpiry)

    res.json({
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      },
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ message: 'Server error during login' })
  }
}

// POST /api/auth/refresh
const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token required' })
    }

    // Verify token signature
    let decoded
    try {
      decoded = AuthService.verifyRefreshToken(refreshToken)
    } catch {
      return res.status(401).json({ message: 'Invalid or expired refresh token' })
    }

    // Check token exists in DB
    const stored = await UserModel.findRefreshToken(refreshToken)
    if (!stored || !stored.is_active) {
      return res.status(401).json({ message: 'Refresh token revoked or expired' })
    }

    const payload = { id: decoded.id, email: decoded.email, role: decoded.role }
    const newAccessToken = AuthService.generateAccessToken(payload)

    res.json({ accessToken: newAccessToken })
  } catch (err) {
    console.error('Refresh error:', err)
    res.status(500).json({ message: 'Server error during token refresh' })
  }
}

// POST /api/auth/logout
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body
    if (refreshToken) {
      await UserModel.deleteRefreshToken(refreshToken)
    }
    res.json({ message: 'Logged out successfully' })
  } catch (err) {
    console.error('Logout error:', err)
    res.status(500).json({ message: 'Server error during logout' })
  }
}

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id)
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json({ user })
  } catch (err) {
    console.error('GetMe error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

// POST /api/auth/change-password
const changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body
    const pool = require('../config/db')

    const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id])
    const user = result.rows[0]
    if (!user) return res.status(404).json({ message: 'User not found' })

    const match = await AuthService.comparePassword(current_password, user.password_hash)
    if (!match) return res.status(400).json({ message: 'Current password is incorrect' })

    const newHash = await AuthService.hashPassword(new_password)
    await pool.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newHash, req.user.id])
    await UserModel.deleteAllUserTokens(req.user.id)

    res.json({ message: 'Password changed successfully. Please log in again.' })
  } catch (err) {
    console.error('Change password error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = { login, refresh, logout, getMe, changePassword }
