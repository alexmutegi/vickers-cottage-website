const SupplierModel = require('../models/Supplier')

// GET /api/suppliers
const getSuppliers = async (req, res) => {
  try {
    const { search, page, limit } = req.query
    const result = await SupplierModel.getAll({ search, page, limit })
    res.json(result)
  } catch (err) {
    console.error('GetSuppliers error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

// GET /api/suppliers/:id
const getSupplier = async (req, res) => {
  try {
    const supplier = await SupplierModel.findById(req.params.id)
    if (!supplier) return res.status(404).json({ message: 'Supplier not found' })

    const history = await SupplierModel.getPurchaseHistory(req.params.id)
    res.json({ supplier, history })
  } catch (err) {
    console.error('GetSupplier error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

// POST /api/suppliers — Admin/Manager
const createSupplier = async (req, res) => {
  try {
    const supplier = await SupplierModel.create(req.body)
    res.status(201).json({ message: 'Supplier added', supplier })
  } catch (err) {
    console.error('CreateSupplier error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

// PUT /api/suppliers/:id — Admin/Manager
const updateSupplier = async (req, res) => {
  try {
    const updated = await SupplierModel.update(req.params.id, req.body)
    if (!updated) return res.status(404).json({ message: 'Supplier not found' })
    res.json({ message: 'Supplier updated', supplier: updated })
  } catch (err) {
    console.error('UpdateSupplier error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

// DELETE /api/suppliers/:id — Admin only (soft delete)
const deleteSupplier = async (req, res) => {
  try {
    const deleted = await SupplierModel.softDelete(req.params.id)
    if (!deleted) return res.status(404).json({ message: 'Supplier not found' })
    res.json({ message: 'Supplier deactivated' })
  } catch (err) {
    console.error('DeleteSupplier error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = { getSuppliers, getSupplier, createSupplier, updateSupplier, deleteSupplier }
