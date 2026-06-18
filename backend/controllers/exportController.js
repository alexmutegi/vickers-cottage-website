/**
 * Export Controller — Phase 6
 * Generates downloadable reports in CSV and XLSX format.
 * All endpoints are admin/manager only (enforced in route).
 */
const ExcelJS = require('exceljs')
const ReportModel = require('../models/Report')
const ProductModel = require('../models/Product')

const todayISO = () => new Date().toISOString().slice(0, 10)

// ── Shared helpers ─────────────────────────────────────────
const fmt = (n) => Number(n || 0).toFixed(2)

function setDownloadHeaders(res, filename, contentType) {
  res.setHeader('Content-Type', contentType)
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
}

async function makeWorkbook(sheetName, columns, rows) {
  const wb = new ExcelJS.Workbook()
  wb.creator  = 'Vickers Cottage POS'
  wb.created  = new Date()

  const ws = wb.addWorksheet(sheetName)

  // Header row styling
  ws.columns = columns
  ws.getRow(1).font    = { bold: true, color: { argb: 'FFFFFFFF' } }
  ws.getRow(1).fill    = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } }
  ws.getRow(1).alignment = { horizontal: 'center' }

  rows.forEach(row => ws.addRow(row))

  // Auto-fit columns
  ws.columns.forEach(col => {
    let max = col.header?.length || 10
    col.eachCell({ includeEmpty: false }, cell => {
      const len = String(cell.value || '').length
      if (len > max) max = len
    })
    col.width = Math.min(max + 4, 40)
  })

  return wb
}

// ── GET /api/exports/sales?format=csv|xlsx&start_date&end_date ──
const exportSales = async (req, res) => {
  try {
    const { format = 'csv', start_date, end_date } = req.query
    const sd = start_date || (() => { const d = new Date(); d.setDate(d.getDate() - 29); return d.toISOString().slice(0, 10) })()
    const ed = end_date || todayISO()

    const report = await ReportModel.getProfitReport(sd, ed)
    const rows   = report.by_product

    if (format === 'xlsx') {
      const columns = [
        { header: 'Product',    key: 'name',       width: 30 },
        { header: 'SKU',        key: 'sku',        width: 16 },
        { header: 'Units Sold', key: 'units_sold', width: 12 },
        { header: 'Revenue (KES)', key: 'revenue', width: 16 },
        { header: 'Cost (KES)', key: 'cost',       width: 16 },
        { header: 'Profit (KES)', key: 'profit',   width: 16 },
      ]
      const dataRows = rows.map(r => [
        r.name, r.sku, r.units_sold,
        Number(r.revenue), Number(r.cost), Number(r.profit),
      ])
      const wb = await makeWorkbook('Sales Report', columns, dataRows)

      // Summary row
      const ws = wb.getWorksheet('Sales Report')
      const totals = report.summary
      const summaryRow = ws.addRow([
        'TOTAL', '', totals.transaction_count,
        Number(totals.revenue), Number(totals.cost), Number(totals.profit),
      ])
      summaryRow.font = { bold: true }
      summaryRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F4F8' } }

      setDownloadHeaders(res, `sales-report-${sd}-to-${ed}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      await wb.xlsx.write(res)
    } else {
      // CSV
      const lines = [
        'Product,SKU,Units Sold,Revenue (KES),Cost (KES),Profit (KES)',
        ...rows.map(r => `"${r.name}",${r.sku},${r.units_sold},${fmt(r.revenue)},${fmt(r.cost)},${fmt(r.profit)}`),
        `TOTAL,,${report.summary.transaction_count},${fmt(report.summary.revenue)},${fmt(report.summary.cost)},${fmt(report.summary.profit)}`,
      ]
      setDownloadHeaders(res, `sales-report-${sd}-to-${ed}.csv`, 'text/csv')
      res.send(lines.join('\n'))
    }
  } catch (err) {
    console.error('Export sales error:', err)
    res.status(500).json({ message: 'Export failed' })
  }
}

// ── GET /api/exports/inventory?format=csv|xlsx ─────────────
const exportInventory = async (req, res) => {
  try {
    const { format = 'csv' } = req.query
    const report = await ReportModel.getInventoryReport()
    const rows   = report.by_category

    if (format === 'xlsx') {
      const columns = [
        { header: 'Category',     key: 'category_name', width: 20 },
        { header: 'Products',     key: 'product_count', width: 12 },
        { header: 'Units in Stock', key: 'total_units', width: 16 },
        { header: 'Cost Value (KES)', key: 'cost_value', width: 18 },
        { header: 'Retail Value (KES)', key: 'retail_value', width: 20 },
        { header: 'Potential Profit (KES)', key: 'potential', width: 22 },
      ]
      const dataRows = rows.map(r => [
        r.category_name, r.product_count, r.total_units,
        Number(r.cost_value), Number(r.retail_value),
        Number(r.retail_value) - Number(r.cost_value),
      ])
      const wb = await makeWorkbook('Inventory Report', columns, dataRows)
      setDownloadHeaders(res, `inventory-report-${todayISO()}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      await wb.xlsx.write(res)
    } else {
      const lines = [
        'Category,Products,Units in Stock,Cost Value (KES),Retail Value (KES),Potential Profit (KES)',
        ...rows.map(r => `"${r.category_name}",${r.product_count},${r.total_units},${fmt(r.cost_value)},${fmt(r.retail_value)},${fmt(Number(r.retail_value) - Number(r.cost_value))}`),
      ]
      setDownloadHeaders(res, `inventory-report-${todayISO()}.csv`, 'text/csv')
      res.send(lines.join('\n'))
    }
  } catch (err) {
    console.error('Export inventory error:', err)
    res.status(500).json({ message: 'Export failed' })
  }
}

// ── GET /api/exports/low-stock?format=csv|xlsx ─────────────
const exportLowStock = async (req, res) => {
  try {
    const { format = 'csv' } = req.query
    const products = await ProductModel.getLowStock()

    if (format === 'xlsx') {
      const columns = [
        { header: 'Product',       key: 'name',           width: 30 },
        { header: 'SKU',           key: 'sku',            width: 16 },
        { header: 'Category',      key: 'category_name',  width: 20 },
        { header: 'Current Stock', key: 'stock_quantity', width: 16 },
        { header: 'Reorder Level', key: 'reorder_level',  width: 16 },
        { header: 'Shortfall',     key: 'shortfall',      width: 12 },
      ]
      const dataRows = products.map(p => [
        p.name, p.sku, p.category_name || 'Uncategorized',
        p.stock_quantity, p.reorder_level,
        Math.max(0, p.reorder_level - p.stock_quantity),
      ])
      const wb = await makeWorkbook('Low Stock Report', columns, dataRows)

      // Highlight low stock rows in red
      const ws = wb.getWorksheet('Low Stock Report')
      for (let i = 2; i <= products.length + 1; i++) {
        ws.getRow(i).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDECEA' } }
      }

      setDownloadHeaders(res, `low-stock-report-${todayISO()}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      await wb.xlsx.write(res)
    } else {
      const lines = [
        'Product,SKU,Category,Current Stock,Reorder Level,Shortfall',
        ...products.map(p => `"${p.name}",${p.sku},"${p.category_name || 'Uncategorized'}",${p.stock_quantity},${p.reorder_level},${Math.max(0, p.reorder_level - p.stock_quantity)}`),
      ]
      setDownloadHeaders(res, `low-stock-report-${todayISO()}.csv`, 'text/csv')
      res.send(lines.join('\n'))
    }
  } catch (err) {
    console.error('Export low-stock error:', err)
    res.status(500).json({ message: 'Export failed' })
  }
}

module.exports = { exportSales, exportInventory, exportLowStock }
