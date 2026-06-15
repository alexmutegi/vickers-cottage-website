const SaleModel = require('../models/Sale')

// GET /api/sales
const getSales = async (req, res) => {
  try {
    const { cashier_id, start_date, end_date, page, limit } = req.query

    // Cashiers can only see their own sales
    const effectiveCashierId = req.user.role === 'cashier' ? req.user.id : cashier_id

    const result = await SaleModel.getAll({ cashier_id: effectiveCashierId, start_date, end_date, page, limit })
    res.json(result)
  } catch (err) {
    console.error('GetSales error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

// GET /api/sales/:id
const getSale = async (req, res) => {
  try {
    const sale = await SaleModel.findById(req.params.id)
    if (!sale) return res.status(404).json({ message: 'Sale not found' })

    // Cashiers can only view their own sales
    if (req.user.role === 'cashier' && sale.cashier_id !== req.user.id) {
      return res.status(403).json({ message: 'You can only view your own sales' })
    }

    res.json({ sale })
  } catch (err) {
    console.error('GetSale error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

// POST /api/sales — All authenticated roles (cashier, manager, admin)
const createSale = async (req, res) => {
  try {
    const { payment_method, items } = req.body

    const result = await SaleModel.create({
      cashier_id: req.user.id,
      payment_method,
      items,
    })

    res.status(201).json({
      message: 'Sale completed and inventory updated',
      ...result,
    })
  } catch (err) {
    if (err.message === 'NO_ITEMS') {
      return res.status(422).json({ message: 'A sale must include at least one item' })
    }
    if (err.message === 'INVALID_ITEM') {
      return res.status(422).json({ message: 'Each item needs a product and a positive quantity' })
    }
    if (err.message === 'INVALID_PAYMENT_METHOD') {
      return res.status(422).json({ message: 'Payment method must be cash, card, or mobile_money' })
    }
    if (err.message === 'PRODUCT_NOT_FOUND') {
      return res.status(404).json({ message: 'One or more products were not found or are inactive' })
    }
    if (err.message === 'INSUFFICIENT_STOCK') {
      return res.status(409).json({
        message: `Insufficient stock for "${err.product?.name}" — only ${err.product?.stock_quantity} available`,
        product: err.product,
      })
    }
    console.error('CreateSale error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

// GET /api/sales/dashboard/summary — Admin/Manager
const getDashboardSummary = async (req, res) => {
  try {
    const [today, topProducts, recentSales] = await Promise.all([
      SaleModel.getTodaySummary(),
      SaleModel.getTopProducts(5),
      SaleModel.getRecentSales(5),
    ])
    res.json({ today, topProducts, recentSales })
  } catch (err) {
    console.error('GetDashboardSummary error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = { getSales, getSale, createSale, getDashboardSummary }
