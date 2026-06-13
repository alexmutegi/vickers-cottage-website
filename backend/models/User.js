const pool = require('../config/db')

class UserModel {
  static async findByEmail(email) {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = TRUE',
      [email]
    )
    return result.rows[0] || null
  }

  static async findById(id) {
    const result = await pool.query(
      'SELECT id, full_name, email, role, is_active, created_at FROM users WHERE id = $1',
      [id]
    )
    return result.rows[0] || null
  }

  static async create({ full_name, email, password_hash, role }) {
    const result = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, full_name, email, role, created_at`,
      [full_name, email, password_hash, role]
    )
    return result.rows[0]
  }

  static async update(id, fields) {
    const allowed = ['full_name', 'email', 'role', 'is_active']
    const updates = []
    const values = []
    let i = 1

    for (const key of allowed) {
      if (fields[key] !== undefined) {
        updates.push(`${key} = $${i}`)
        values.push(fields[key])
        i++
      }
    }
    if (!updates.length) return null

    values.push(id)
    const result = await pool.query(
      `UPDATE users SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${i}
       RETURNING id, full_name, email, role, is_active, updated_at`,
      values
    )
    return result.rows[0]
  }

  static async getAll() {
    const result = await pool.query(
      'SELECT id, full_name, email, role, is_active, created_at FROM users ORDER BY created_at DESC'
    )
    return result.rows
  }

  static async saveRefreshToken(user_id, token, expires_at) {
    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [user_id, token, expires_at]
    )
  }

  static async findRefreshToken(token) {
    const result = await pool.query(
      `SELECT rt.*, u.role, u.is_active FROM refresh_tokens rt
       JOIN users u ON rt.user_id = u.id
       WHERE rt.token = $1 AND rt.expires_at > NOW()`,
      [token]
    )
    return result.rows[0] || null
  }

  static async deleteRefreshToken(token) {
    await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [token])
  }

  static async deleteAllUserTokens(user_id) {
    await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [user_id])
  }
}

module.exports = UserModel
