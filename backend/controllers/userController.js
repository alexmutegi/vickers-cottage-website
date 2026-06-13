const UserModel = require('../models/User')
const AuthService = require('../services/authService')

// GET /api/users — Admin only
const getUsers = async (req, res) => {
  try {
    const users = await UserModel.getAll()
    res.json({ users })
  } catch (err) {
    console.error('GetUsers error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

// POST /api/users — Admin only
const createUser = async (req, res) => {
  try {
    const { full_name, email, password, role } = req.body

    const existing = await UserModel.findByEmail(email)
    if (existing) {
      return res.status(409).json({ message: 'Email already in use' })
    }

    const password_hash = await AuthService.hashPassword(password)
    const user = await UserModel.create({ full_name, email, password_hash, role })

    res.status(201).json({ message: 'User created successfully', user })
  } catch (err) {
    console.error('CreateUser error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

// PUT /api/users/:id — Admin only
const updateUser = async (req, res) => {
  try {
    const { id } = req.params
    const { full_name, email, role, is_active } = req.body

    const updated = await UserModel.update(id, { full_name, email, role, is_active })
    if (!updated) return res.status(404).json({ message: 'User not found' })

    res.json({ message: 'User updated', user: updated })
  } catch (err) {
    console.error('UpdateUser error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

// PUT /api/users/:id/reset-password — Admin only
const resetPassword = async (req, res) => {
  try {
    const { id } = req.params
    const { new_password } = req.body
    const pool = require('../config/db')

    const hash = await AuthService.hashPassword(new_password)
    const result = await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2 RETURNING id',
      [hash, id]
    )
    if (!result.rows.length) return res.status(404).json({ message: 'User not found' })

    await UserModel.deleteAllUserTokens(id)
    res.json({ message: 'Password reset successfully' })
  } catch (err) {
    console.error('ResetPassword error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = { getUsers, createUser, updateUser, resetPassword }
