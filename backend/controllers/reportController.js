const ReportModel = require('../models/Report')
const ProductModel = require('../models/Product')

const todayISO = () => new Date().toISOString().slice(0, 10)

// GET /api/reports/daily-sales?date=YYYY-MM-DD
const getDailySales = async (req, res) => {
  try {
    const date = req.query.date || todayISO()
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(422).json({ message: 'date must be in YYYY-MM-DD format' })
    }
    const report = await ReportModel.getDailySales(date)
    res.json({ date, ...report })
  } catch (err) {
    console.error('GetDailySales error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

// GET /api/reports/monthly-sales?year=YYYY&month=MM
const getMonthlySales = async (req, res) => {
  try {
    const now = new Date()
    const year = parseInt(req.query.year) || now.getFullYear()
    const month = parseInt(req.query.month) || (now.getMonth() + 1)

    if (month < 1 || month > 12) {
      return res.status(422).json({ message: 'month must be between 1 and 12' })
    }

    const report = await ReportModel.getMonthlySales(year, month)
    res.json(report)
  } catch (err) {
    console.error('GetMonthlySales error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

// GET /api/reports/inventory
const getInventoryReport = async (req, res) => {
  try {
    const report = await ReportModel.getInventoryReport()
    res.json(report)
  } catch (err) {
    console.error('GetInventoryReport error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

// GET /api/reports/low-stock
const getLowStockReport = async (req, res) => {
  try {
    const products = await ProductModel.getLowStock()
    res.json({ products, count: products.length })
  } catch (err) {
    console.error('GetLowStockReport error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

// GET /api/reports/profit?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
const getProfitReport = async (req, res) => {
  try {
    let { start_date, end_date } = req.query

    if (!end_date) end_date = todayISO()
    if (!start_date) {
      const d = new Date()
      d.setDate(d.getDate() - 29)
      start_date = d.toISOString().slice(0, 10)
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(start_date) || !/^\d{4}-\d{2}-\d{2}$/.test(end_date)) {
      return res.status(422).json({ message: 'start_date and end_date must be in YYYY-MM-DD format' })
    }
    if (start_date > end_date) {
      return res.status(422).json({ message: 'start_date must be before or equal to end_date' })
    }

    const report = await ReportModel.getProfitReport(start_date, end_date)
    res.json(report)
  } catch (err) {
    console.error('GetProfitReport error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = { getDailySales, getMonthlySales, getInventoryReport, getLowStockReport, getProfitReport }
