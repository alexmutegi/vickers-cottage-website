const pool = require('../config/db')

const VALID_TYPES = ['stock_in', 'stock_out', 'damaged', 'returned']

class InventoryModel {
  // Creates a transaction record AND adjusts product stock atomically
  static async recordTransaction({ product_id, transaction_type, quantity, reference_id, notes, created_by }) {
    if (!VALID_TYPES.includes(transaction_type)) {
      throw new Error('INVALID_TRANSACTION_TYPE')
    }
    if (quantity <= 0) {
      throw new Error('INVALID_QUANTITY')
    }

    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      // stock_in and returned increase stock; stock_out and damaged decrease it
      const delta = (transaction_type === 'stock_in' || transaction_type === 'returned')
        ? quantity
        : -quantity

      const product = await client.query(
        `UPDATE products SET stock_quantity = stock_quantity + $1, updated_at = NOW()
         WHERE id = $2 AND is_active = TRUE
         RETURNING id, name, stock_quantity, reorder_level`,
        [delta, product_id]
      )

      if (!product.rows.length) {
        throw new Error('PRODUCT_NOT_FOUND')
      }
      if (product.rows[0].stock_quantity < 0) {
        throw new Error('INSUFFICIENT_STOCK')
      }

      const txn = await client.query(
        `INSERT INTO inventory_transactions (product_id, transaction_type, quantity, reference_id, notes, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [product_id, transaction_type, quantity, reference_id || null, notes || null, created_by]
      )

      await client.query('COMMIT')
      return { transaction: txn.rows[0], product: product.rows[0] }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  }

  static async getHistory({ product_id, transaction_type, page = 1, limit = 50 } = {}) {
    const conditions = []
    const values = []
    let i = 1

    if (product_id) {
      conditions.push(`it.product_id = $${i}`)
      values.push(product_id)
      i++
    }
    if (transaction_type) {
      conditions.push(`it.transaction_type = $${i}`)
      values.push(transaction_type)
      i++
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const offset = (page - 1) * limit

    const countResult = await pool.query(`SELECT COUNT(*) FROM inventory_transactions it ${where}`, values)
    const total = parseInt(countResult.rows[0].count)

    values.push(limit, offset)
    const result = await pool.query(
      `SELECT it.*, p.name AS product_name, p.sku, u.full_name AS created_by_name
       FROM inventory_transactions it
       JOIN products p ON it.product_id = p.id
       LEFT JOIN users u ON it.created_by = u.id
       ${where}
       ORDER BY it.created_at DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      values
    )

    return { transactions: result.rows, total, page: Number(page), limit: Number(limit) }
  }

  static async getProductHistory(productId) {
    const result = await pool.query(
      `SELECT it.*, u.full_name AS created_by_name
       FROM inventory_transactions it
       LEFT JOIN users u ON it.created_by = u.id
       WHERE it.product_id = $1
       ORDER BY it.created_at DESC
       LIMIT 100`,
      [productId]
    )
    return result.rows
  }
}

module.exports = InventoryModel
