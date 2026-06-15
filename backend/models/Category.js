const pool = require('../config/db')

class CategoryModel {
  static async getAll() {
    const result = await pool.query(
      `SELECT c.id, c.name, c.created_at,
              COUNT(p.id)::int AS product_count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id AND p.is_active = TRUE
       GROUP BY c.id
       ORDER BY c.name ASC`
    )
    return result.rows
  }

  static async findById(id) {
    const result = await pool.query('SELECT * FROM categories WHERE id = $1', [id])
    return result.rows[0] || null
  }

  static async findByName(name) {
    const result = await pool.query('SELECT * FROM categories WHERE LOWER(name) = LOWER($1)', [name])
    return result.rows[0] || null
  }

  static async create(name) {
    const result = await pool.query(
      'INSERT INTO categories (name) VALUES ($1) RETURNING *',
      [name]
    )
    return result.rows[0]
  }

  static async update(id, name) {
    const result = await pool.query(
      'UPDATE categories SET name = $1 WHERE id = $2 RETURNING *',
      [name, id]
    )
    return result.rows[0] || null
  }

  static async delete(id) {
    // Prevent deletion if products reference this category
    const inUse = await pool.query('SELECT COUNT(*) FROM products WHERE category_id = $1', [id])
    if (parseInt(inUse.rows[0].count) > 0) {
      throw new Error('CATEGORY_IN_USE')
    }
    const result = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING id', [id])
    return result.rows[0] || null
  }
}

module.exports = CategoryModel
