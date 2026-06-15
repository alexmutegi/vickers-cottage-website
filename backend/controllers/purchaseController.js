const PurchaseModel = require('../models/Purchase')

// GET /api/purchases
const getPurchases = async (req, res) => {
  try {
    const { supplier_id, page, limit } = req.query
    const result = await PurchaseModel.getAll({ supplier_id, page, limit })
    res.json(result)
  } catch (err) {
    console.error('GetPurchases error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

// GET /api/purchases/:id
const getPurchase = async (req, res) => {
  try {
    const purchase = await PurchaseModel.findById(req.params.id)
    if (!purchase) return res.status(404).json({ message: 'Purchase not found' })
    res.json({ purchase })
  } catch (err) {
    console.error('GetPurchase error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

// POST /api/purchases — Admin/Manager
const createPurchase = async (req, res) => {
  try {
    const { supplier_id, purchase_date, notes, items } = req.body

    const result = await PurchaseModel.create({
      supplier_id,
      purchase_date,
      notes,
      items,
      created_by: req.user.id,
    })

    res.status(201).json({
      message: 'Purchase recorded and inventory updated',
      ...result,
    })
  } catch (err) {
    if (err.message === 'NO_ITEMS') {
      return res.status(422).json({ message: 'A purchase must include at least one item' })
    }
    if (err.message === 'INVALID_ITEM') {
      return res.status(422).json({ message: 'Each item needs a product, positive quantity, and non-negative cost' })
    }
    if (err.message === 'PRODUCT_NOT_FOUND') {
      return res.status(404).json({ message: 'One or more products were not found or are inactive' })
    }
    console.error('CreatePurchase error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = { getPurchases, getPurchase, createPurchase }
