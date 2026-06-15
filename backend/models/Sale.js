const pool = require('../config/db')

const VALID_PAYMENT_METHODS = ['cash', 'card', 'mobile_money']

class SaleModel {
  // Creates a sale + sale_items, decreases product stock atomically,
  // and logs a 'stock_out' inventory_transaction for each item.
  static async create({ cashier_id, payment_method, items }) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('NO_ITEMS')
    }
    if (!VALID_PAYMENT_METHODS.includes(payment_method)) {
      throw new Error('INVALID_PAYMENT_METHOD')
    }

    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      let total_amount = 0
      const lineItems = []

      for (const item of items) {
        if (!item.product_id || !item.quantity || item.quantity <= 0) {
          throw new Error('INVALID_ITEM')
        }

        // Lock the product row, check stock, get current selling price
        const productResult = await client.query(
          `SELECT id, name, sku, selling_price, stock_quantity
           FROM products
           WHERE id = $1 AND is_active = TRUE
           FOR UPDATE`,
          [item.product_id]
        )
        if (!productResult.rows.length) {
          throw new Error('PRODUCT_NOT_FOUND')
        }
        const product = productResult.rows[0]

        if (product.stock_quantity < item.quantity) {
          const err = new Error('INSUFFICIENT_STOCK')
          err.product = product
          throw err
        }

        const selling_price = item.selling_price != null ? Number(item.selling_price) : Number(product.selling_price)
        total_amount += selling_price * item.quantity

        lineItems.push({ ...item, selling_price, product })
      }

      // Create the sale record
      const saleResult = await client.query(
        `INSERT INTO sales (cashier_id, total_amount, payment_method)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [cashier_id, total_amount, payment_method]
      )
      const sale = saleResult.rows[0]

      const itemResults = []
      for (const item of lineItems) {
        // Insert sale item
        const itemResult = await client.query(
          `INSERT INTO sale_items (sale_id, product_id, quantity, selling_price)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
          [sale.id, item.product_id, item.quantity, item.selling_price]
        )

        // Decrease product stock
        const updated = await client.query(
          `UPDATE products SET stock_quantity = stock_quantity - $1, updated_at = NOW()
           WHERE id = $2
           RETURNING id, name, sku, stock_quantity, reorder_level`,
          [item.quantity, item.product_id]
        )

        // Log inventory transaction referencing this sale
        await client.query(
          `INSERT INTO inventory_transactions (product_id, transaction_type, quantity, reference_id, notes, created_by)
           VALUES ($1, 'stock_out', $2, $3, $4, $5)`,
          [item.product_id, item.quantity, sale.id, 'Point of Sale transaction', cashier_id]
        )

        itemResults.push({
          ...itemResult.rows[0],
          product_name: item.product.name,
          sku: item.product.sku,
          remaining_stock: updated.rows[0].stock_quantity,
        })
      }

      await client.query('COMMIT')
      return { sale, items: itemResults }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  }

  static async getAll({ cashier_id, start_date, end_date, page = 1, limit = 50 } = {}) {
    const conditions = []
    const values = []
    let i = 1

    if (cashier_id) {
      conditions.push(`s.cashier_id = $${i}`)
      values.push(cashier_id)
      i++
    }
    if (start_date) {
      conditions.push(`s.sale_date >= $${i}`)
      values.push(start_date)
      i++
    }
    if (end_date) {
      conditions.push(`s.sale_date <= $${i}`)
      values.push(end_date)
      i++
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const offset = (page - 1) * limit

    const countResult = await pool.query(`SELECT COUNT(*) FROM sales s ${where}`, values)
    const total = parseInt(countResult.rows[0].count)

    values.push(limit, offset)
    const result = await pool.query(
      `SELECT s.*, u.full_name AS cashier_name,
              COUNT(si.id)::int AS item_count,
              COALESCE(SUM(si.quantity), 0)::int AS total_units
       FROM sales s
       LEFT JOIN users u ON s.cashier_id = u.id
       LEFT JOIN sale_items si ON si.sale_id = s.id
       ${where}
       GROUP BY s.id, u.full_name
       ORDER BY s.sale_date DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      values
    )

    return { sales: result.rows, total, page: Number(page), limit: Number(limit) }
  }

  static async findById(id) {
    const saleResult = await pool.query(
      `SELECT s.*, u.full_name AS cashier_name
       FROM sales s
       LEFT JOIN users u ON s.cashier_id = u.id
       WHERE s.id = $1`,
      [id]
    )
    if (!saleResult.rows.length) return null

    const itemsResult = await pool.query(
      `SELECT si.*, p.name AS product_name, p.sku
       FROM sale_items si
       JOIN products p ON si.product_id = p.id
       WHERE si.sale_id = $1
       ORDER BY p.name ASC`,
      [id]
    )

    return { ...saleResult.rows[0], items: itemsResult.rows }
  }

  // ── Dashboard helpers ────────────────────────────────────────
  static async getTodaySummary() {
    const result = await pool.query(
      `SELECT
         COALESCE(SUM(s.total_amount), 0) AS total_sales,
         COUNT(s.id)::int AS transaction_count,
         COALESCE(SUM(
           (SELECT SUM(si.quantity * (si.selling_price - p.purchase_price))
            FROM sale_items si
            JOIN products p ON si.product_id = p.id
            WHERE si.sale_id = s.id)
         ), 0) AS total_profit
       FROM sales s
       WHERE s.sale_date >= CURRENT_DATE`
    )
    return result.rows[0]
  }

  static async getTopProducts(limit = 5) {
    const result = await pool.query(
      `SELECT p.id, p.name, p.sku,
              SUM(si.quantity)::int AS units_sold,
              SUM(si.quantity * si.selling_price) AS revenue
       FROM sale_items si
       JOIN products p ON si.product_id = p.id
       JOIN sales s ON si.sale_id = s.id
       WHERE s.sale_date >= CURRENT_DATE - INTERVAL '30 days'
       GROUP BY p.id, p.name, p.sku
       ORDER BY units_sold DESC
       LIMIT $1`,
      [limit]
    )
    return result.rows
  }

  static async getRecentSales(limit = 5) {
    const result = await pool.query(
      `SELECT s.id, s.sale_date, s.total_amount, s.payment_method, u.full_name AS cashier_name,
              COUNT(si.id)::int AS item_count
       FROM sales s
       LEFT JOIN users u ON s.cashier_id = u.id
       LEFT JOIN sale_items si ON si.sale_id = s.id
       GROUP BY s.id, u.full_name
       ORDER BY s.sale_date DESC
       LIMIT $1`,
      [limit]
    )
    return result.rows
  }
}

module.exports = SaleModel
