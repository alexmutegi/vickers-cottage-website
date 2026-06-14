const pool = require('../config/db')

class ProductModel {
  static async getAll({ search, category_id, low_stock, page = 1, limit = 50 } = {}) {
    const conditions = ['p.is_active = TRUE']
    const values = []
    let i = 1

    if (search) {
      conditions.push(`(p.name ILIKE $${i} OR p.sku ILIKE $${i})`)
      values.push(`%${search}%`)
      i++
    }
    if (category_id) {
      conditions.push(`p.category_id = $${i}`)
      values.push(category_id)
      i++
    }
    if (low_stock === 'true') {
      conditions.push(`p.stock_quantity <= p.reorder_level`)
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const offset = (page - 1) * limit

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM products p ${where}`,
      values
    )
    const total = parseInt(countResult.rows[0].count)

    values.push(limit, offset)
    const result = await pool.query(
      `SELECT p.*, c.name AS category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       ${where}
       ORDER BY p.name ASC
       LIMIT $${i} OFFSET $${i + 1}`,
      values
    )

    return { products: result.rows, total, page: Number(page), limit: Number(limit) }
  }

  static async findById(id) {
    const result = await pool.query(
      `SELECT p.*, c.name AS category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = $1`,
      [id]
    )
    return result.rows[0] || null
  }

  static async findBySku(sku) {
    const result = await pool.query('SELECT * FROM products WHERE sku = $1', [sku])
    return result.rows[0] || null
  }

  static async create(data) {
    const { category_id, name, sku, purchase_price, selling_price, stock_quantity, reorder_level } = data
    const result = await pool.query(
      `INSERT INTO products (category_id, name, sku, purchase_price, selling_price, stock_quantity, reorder_level)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [category_id, name, sku, purchase_price, selling_price, stock_quantity || 0, reorder_level || 5]
    )
    return result.rows[0]
  }

  static async update(id, data) {
    const allowed = ['category_id', 'name', 'sku', 'purchase_price', 'selling_price', 'reorder_level', 'is_active']
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
      `UPDATE products SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${i}
       RETURNING *`,
      values
    )
    return result.rows[0] || null
  }

  static async softDelete(id) {
    const result = await pool.query(
      `UPDATE products SET is_active = FALSE, updated_at = NOW() WHERE id = $1 RETURNING id`,
      [id]
    )
    return result.rows[0] || null
  }

  // ── Stock adjustments ─────────────────────────────────────────
  static async adjustStock(client, productId, delta) {
    const result = await client.query(
      `UPDATE products SET stock_quantity = stock_quantity + $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, stock_quantity, reorder_level, name`,
      [delta, productId]
    )
    if (!result.rows.length) throw new Error('PRODUCT_NOT_FOUND')
    if (result.rows[0].stock_quantity < 0) throw new Error('INSUFFICIENT_STOCK')
    return result.rows[0]
  }

  static async getLowStock() {
    const result = await pool.query(
      `SELECT p.*, c.name AS category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.is_active = TRUE AND p.stock_quantity <= p.reorder_level
       ORDER BY p.stock_quantity ASC`
    )
    return result.rows
  }

  static async getInventoryValue() {
    const result = await pool.query(
      `SELECT
         COALESCE(SUM(stock_quantity * purchase_price), 0) AS total_cost_value,
         COALESCE(SUM(stock_quantity * selling_price), 0) AS total_retail_value,
         COALESCE(SUM(stock_quantity), 0) AS total_units,
         COUNT(*) AS total_products
       FROM products
       WHERE is_active = TRUE`
    )
    return result.rows[0]
  }
}

module.exports = ProductModel
