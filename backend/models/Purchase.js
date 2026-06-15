const pool = require('../config/db')

class PurchaseModel {
  // Creates a purchase + purchase_items, increases product stock,
  // and logs an inventory_transaction (stock_in) for each item — all atomically.
  static async create({ supplier_id, purchase_date, notes, items, created_by }) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('NO_ITEMS')
    }

    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      // Validate products exist and calculate total cost
      let total_cost = 0
      for (const item of items) {
        if (!item.product_id || !item.quantity || item.quantity <= 0 || item.cost == null || item.cost < 0) {
          throw new Error('INVALID_ITEM')
        }
        total_cost += Number(item.cost) * Number(item.quantity)
      }

      // Create the purchase record
      const purchaseResult = await client.query(
        `INSERT INTO purchases (supplier_id, purchase_date, total_cost, notes, created_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [supplier_id || null, purchase_date || new Date().toISOString().slice(0, 10), total_cost, notes || null, created_by]
      )
      const purchase = purchaseResult.rows[0]

      const itemResults = []
      for (const item of items) {
        // Insert purchase item
        const itemResult = await client.query(
          `INSERT INTO purchase_items (purchase_id, product_id, quantity, cost)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
          [purchase.id, item.product_id, item.quantity, item.cost]
        )

        // Increase product stock
        const productResult = await client.query(
          `UPDATE products SET stock_quantity = stock_quantity + $1, updated_at = NOW()
           WHERE id = $2 AND is_active = TRUE
           RETURNING id, name, sku, stock_quantity`,
          [item.quantity, item.product_id]
        )
        if (!productResult.rows.length) {
          throw new Error('PRODUCT_NOT_FOUND')
        }

        // Log inventory transaction referencing this purchase
        await client.query(
          `INSERT INTO inventory_transactions (product_id, transaction_type, quantity, reference_id, notes, created_by)
           VALUES ($1, 'stock_in', $2, $3, $4, $5)`,
          [item.product_id, item.quantity, purchase.id, `Purchase from supplier`, created_by]
        )

        itemResults.push({ ...itemResult.rows[0], product: productResult.rows[0] })
      }

      await client.query('COMMIT')
      return { purchase, items: itemResults }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  }

  static async getAll({ supplier_id, page = 1, limit = 50 } = {}) {
    const conditions = []
    const values = []
    let i = 1

    if (supplier_id) {
      conditions.push(`p.supplier_id = $${i}`)
      values.push(supplier_id)
      i++
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const offset = (page - 1) * limit

    const countResult = await pool.query(`SELECT COUNT(*) FROM purchases p ${where}`, values)
    const total = parseInt(countResult.rows[0].count)

    values.push(limit, offset)
    const result = await pool.query(
      `SELECT p.*, s.supplier_name, u.full_name AS created_by_name,
              COUNT(pi.id)::int AS item_count
       FROM purchases p
       LEFT JOIN suppliers s ON p.supplier_id = s.id
       LEFT JOIN users u ON p.created_by = u.id
       LEFT JOIN purchase_items pi ON pi.purchase_id = p.id
       ${where}
       GROUP BY p.id, s.supplier_name, u.full_name
       ORDER BY p.purchase_date DESC, p.created_at DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      values
    )

    return { purchases: result.rows, total, page: Number(page), limit: Number(limit) }
  }

  static async findById(id) {
    const purchaseResult = await pool.query(
      `SELECT p.*, s.supplier_name, u.full_name AS created_by_name
       FROM purchases p
       LEFT JOIN suppliers s ON p.supplier_id = s.id
       LEFT JOIN users u ON p.created_by = u.id
       WHERE p.id = $1`,
      [id]
    )
    if (!purchaseResult.rows.length) return null

    const itemsResult = await pool.query(
      `SELECT pi.*, pr.name AS product_name, pr.sku
       FROM purchase_items pi
       JOIN products pr ON pi.product_id = pr.id
       WHERE pi.purchase_id = $1
       ORDER BY pr.name ASC`,
      [id]
    )

    return { ...purchaseResult.rows[0], items: itemsResult.rows }
  }
}

module.exports = PurchaseModel
