const pool = require('../config/db')

class ReportModel {
  // ── Daily Sales Report ───────────────────────────────────────
  static async getDailySales(date) {
    const itemsResult = await pool.query(
      `SELECT
         COALESCE(SUM(si.quantity), 0)::int AS items_sold,
         COALESCE(SUM(si.quantity * (si.selling_price - p.purchase_price)), 0) AS total_profit
       FROM sales s
       JOIN sale_items si ON si.sale_id = s.id
       JOIN products p ON si.product_id = p.id
       WHERE s.sale_date::date = $1::date`,
      [date]
    )

    const totalsResult = await pool.query(
      `SELECT
         COUNT(*)::int AS transaction_count,
         COALESCE(SUM(total_amount), 0) AS total_sales
       FROM sales
       WHERE sale_date::date = $1::date`,
      [date]
    )

    const byPayment = await pool.query(
      `SELECT payment_method, COUNT(*)::int AS count, COALESCE(SUM(total_amount), 0) AS total
       FROM sales
       WHERE sale_date::date = $1::date
       GROUP BY payment_method
       ORDER BY total DESC`,
      [date]
    )

    return {
      transaction_count: totalsResult.rows[0].transaction_count,
      total_sales: totalsResult.rows[0].total_sales,
      items_sold: itemsResult.rows[0].items_sold,
      total_profit: itemsResult.rows[0].total_profit,
      by_payment_method: byPayment.rows,
    }
  }

  // ── Monthly Sales Report ─────────────────────────────────────
  static async getMonthlySales(year, month) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`

    const daily = await pool.query(
      `SELECT
         d.day::date AS day,
         COALESCE(s.transaction_count, 0)::int AS transaction_count,
         COALESCE(s.revenue, 0) AS revenue,
         COALESCE(s.cost, 0) AS cost,
         COALESCE(s.profit, 0) AS profit
       FROM (
         SELECT generate_series(
           $1::date,
           ($1::date + INTERVAL '1 month' - INTERVAL '1 day'),
           INTERVAL '1 day'
         ) AS day
       ) d
       LEFT JOIN (
         SELECT
           s.sale_date::date AS day,
           COUNT(DISTINCT s.id)::int AS transaction_count,
           SUM(s.total_amount) AS revenue,
           SUM(si.quantity * p.purchase_price) AS cost,
           SUM(si.quantity * (si.selling_price - p.purchase_price)) AS profit
         FROM sales s
         JOIN sale_items si ON si.sale_id = s.id
         JOIN products p ON si.product_id = p.id
         WHERE s.sale_date >= $1::date AND s.sale_date < ($1::date + INTERVAL '1 month')
         GROUP BY s.sale_date::date
       ) s ON s.day = d.day::date
       ORDER BY d.day`,
      [startDate]
    )

    const totals = daily.rows.reduce(
      (acc, row) => ({
        transaction_count: acc.transaction_count + row.transaction_count,
        revenue: acc.revenue + Number(row.revenue),
        cost: acc.cost + Number(row.cost),
        profit: acc.profit + Number(row.profit),
      }),
      { transaction_count: 0, revenue: 0, cost: 0, profit: 0 }
    )

    return { year: Number(year), month: Number(month), daily: daily.rows, totals }
  }

  // ── Inventory Report ──────────────────────────────────────────
  static async getInventoryReport() {
    const byCategory = await pool.query(
      `SELECT
         COALESCE(c.name, 'Uncategorized') AS category_name,
         COUNT(p.id)::int AS product_count,
         COALESCE(SUM(p.stock_quantity), 0)::int AS total_units,
         COALESCE(SUM(p.stock_quantity * p.purchase_price), 0) AS cost_value,
         COALESCE(SUM(p.stock_quantity * p.selling_price), 0) AS retail_value
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.is_active = TRUE
       GROUP BY c.name
       ORDER BY c.name ASC`
    )

    const overall = await pool.query(
      `SELECT
         COUNT(*)::int AS total_products,
         COALESCE(SUM(stock_quantity), 0)::int AS total_units,
         COALESCE(SUM(stock_quantity * purchase_price), 0) AS cost_value,
         COALESCE(SUM(stock_quantity * selling_price), 0) AS retail_value
       FROM products
       WHERE is_active = TRUE`
    )

    return { by_category: byCategory.rows, overall: overall.rows[0] }
  }

  // ── Profit Report ─────────────────────────────────────────────
  static async getProfitReport(start_date, end_date) {
    const summary = await pool.query(
      `SELECT
         COUNT(DISTINCT s.id)::int AS transaction_count,
         COALESCE(SUM(si.quantity * si.selling_price), 0) AS revenue,
         COALESCE(SUM(si.quantity * p.purchase_price), 0) AS cost,
         COALESCE(SUM(si.quantity * (si.selling_price - p.purchase_price)), 0) AS profit
       FROM sales s
       JOIN sale_items si ON si.sale_id = s.id
       JOIN products p ON si.product_id = p.id
       WHERE s.sale_date >= $1::date AND s.sale_date < ($2::date + INTERVAL '1 day')`,
      [start_date, end_date]
    )

    const byProduct = await pool.query(
      `SELECT
         p.id, p.name, p.sku,
         SUM(si.quantity)::int AS units_sold,
         SUM(si.quantity * si.selling_price) AS revenue,
         SUM(si.quantity * p.purchase_price) AS cost,
         SUM(si.quantity * (si.selling_price - p.purchase_price)) AS profit
       FROM sale_items si
       JOIN products p ON si.product_id = p.id
       JOIN sales s ON si.sale_id = s.id
       WHERE s.sale_date >= $1::date AND s.sale_date < ($2::date + INTERVAL '1 day')
       GROUP BY p.id, p.name, p.sku
       ORDER BY profit DESC`,
      [start_date, end_date]
    )

    return { start_date, end_date, summary: summary.rows[0], by_product: byProduct.rows }
  }
}

module.exports = ReportModel
