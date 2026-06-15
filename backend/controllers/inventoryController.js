const InventoryModel = require('../models/Inventory')

// POST /api/inventory/transactions — Admin/Manager
const createTransaction = async (req, res) => {
  try {
    const { product_id, transaction_type, quantity, notes } = req.body

    const result = await InventoryModel.recordTransaction({
      product_id,
      transaction_type,
      quantity,
      notes,
      created_by: req.user.id,
    })

    res.status(201).json({
      message: `Stock ${transaction_type.replace('_', ' ')} recorded successfully`,
      ...result,
    })
  } catch (err) {
    if (err.message === 'PRODUCT_NOT_FOUND') {
      return res.status(404).json({ message: 'Product not found' })
    }
    if (err.message === 'INSUFFICIENT_STOCK') {
      return res.status(409).json({ message: 'Insufficient stock for this operation' })
    }
    if (err.message === 'INVALID_TRANSACTION_TYPE') {
      return res.status(422).json({ message: 'Invalid transaction type' })
    }
    if (err.message === 'INVALID_QUANTITY') {
      return res.status(422).json({ message: 'Quantity must be greater than zero' })
    }
    console.error('CreateTransaction error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

// GET /api/inventory/transactions
const getTransactions = async (req, res) => {
  try {
    const { product_id, transaction_type, page, limit } = req.query
    const result = await InventoryModel.getHistory({ product_id, transaction_type, page, limit })
    res.json(result)
  } catch (err) {
    console.error('GetTransactions error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = { createTransaction, getTransactions }
