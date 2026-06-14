const pool = require('../config/db')

class SupplierModel {
  static async getAll({ search, page = 1, limit = 50 } = {}) {
    const conditions = ['is_active = TRUE']
    const values = []
    let i = 1

    if (search) {
      conditions.push(`(supplier_name ILIKE $${i} OR phone ILIKE $${i} OR email ILIKE $${i})`)
      values.push(`%${search}%`)
      i++
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const offset = (page - 1) * limit

    const countResult = await pool.query(`SELECT COUNT(*) FROM suppliers ${where}`, values)
    const total = parseInt(countResult.rows[0].count)

    values.push(limit, offset)
    const result = await pool.query(
      `SELECT s.*,
              COUNT(p.id)::int AS purchase_count,
              COALESCE(SUM(p.total_cost), 0) AS total_purchased
       FROM suppliers s
       LEFT JOIN purchases p ON p.supplier_id = s.id
       ${where}
       GROUP BY s.id
       ORDER BY s.supplier_name ASC
       LIMIT $${i} OFFSET $${i + 1}`,
      values
    )

    return { suppliers: result.rows, total, page: Number(page), limit: Number(limit) }
  }

  static async findById(id) {
    const result = await pool.query('SELECT * FROM suppliers WHERE id = $1', [id])
    return result.rows[0] || null
  }

  static async create(data) {
    const { supplier_name, phone, email, address } = data
    const result = await pool.query(
      `INSERT INTO suppliers (supplier_name, phone, email, address)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [supplier_name, phone || null, email || null, address || null]
    )
    return result.rows[0]
  }

  static async update(id, data) {
    const allowed = ['supplier_name', 'phone', 'email', 'address', 'is_active']
    const updates = []
    const values = []
    let i = 1

    for (const key of allowed) {
      if (data[key] !== undefined) {
        updates.push(`${key} = $${i}`)
        values.push(data[key])
        i++
      }
    }
    if (!updates.length) return null

    values.push(id)
    const result = await pool.query(
      `UPDATE suppliers SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${i}
       RETURNING *`,
      values
    )
    return result.rows[0] || null
  }

  static async softDelete(id) {
    const result = await pool.query(
      `UPDATE suppliers SET is_active = FALSE, updated_at = NOW() WHERE id = $1 RETURNING id`,
      [id]
    )
    return result.rows[0] || null
  }

  // Purchase history for a single supplier
  static async getPurchaseHistory(id) {
    const result = await pool.query(
      `SELECT p.*, u.full_name AS created_by_name,
              COUNT(pi.id)::int AS item_count
       FROM purchases p
       LEFT JOIN users u ON p.created_by = u.id
       LEFT JOIN purchase_items pi ON pi.purchase_id = p.id
       WHERE p.supplier_id = $1
       GROUP BY p.id, u.full_name
       ORDER BY p.purchase_date DESC, p.created_at DESC`,
      [id]
    )
    return result.rows
  }
}

module.exports = SupplierModel
