const ProductModel = require('../models/Product')
const InventoryModel = require('../models/Inventory')

// GET /api/products
const getProducts = async (req, res) => {
  try {
    const { search, category_id, low_stock, page, limit } = req.query
    const result = await ProductModel.getAll({ search, category_id, low_stock, page, limit })
    res.json(result)
  } catch (err) {
    console.error('GetProducts error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

// GET /api/products/:id
const getProduct = async (req, res) => {
  try {
    const product = await ProductModel.findById(req.params.id)
    if (!product) return res.status(404).json({ message: 'Product not found' })

    const history = await InventoryModel.getProductHistory(req.params.id)
    res.json({ product, history })
  } catch (err) {
    console.error('GetProduct error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

// POST /api/products — Admin/Manager
const createProduct = async (req, res) => {
  try {
    const { sku } = req.body
    const existing = await ProductModel.findBySku(sku)
    if (existing) {
      return res.status(409).json({ message: 'A product with this SKU already exists' })
    }

    const product = await ProductModel.create(req.body)

    // If initial stock provided, log it as a stock_in transaction
    if (req.body.stock_quantity && req.body.stock_quantity > 0) {
      await InventoryModel.recordTransaction({
        product_id: product.id,
        transaction_type: 'stock_in',
        quantity: req.body.stock_quantity,
        notes: 'Initial stock on product creation',
        created_by: req.user.id,
      }).catch(() => {}) // product already has stock set via create; this just logs history
    }

    res.status(201).json({ message: 'Product created', product })
  } catch (err) {
    console.error('CreateProduct error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

// PUT /api/products/:id — Admin/Manager
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params

    if (req.body.sku) {
      const existing = await ProductModel.findBySku(req.body.sku)
      if (existing && existing.id !== id) {
        return res.status(409).json({ message: 'Another product already uses this SKU' })
      }
    }

    const updated = await ProductModel.update(id, req.body)
    if (!updated) return res.status(404).json({ message: 'Product not found' })
    res.json({ message: 'Product updated', product: updated })
  } catch (err) {
    console.error('UpdateProduct error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

// DELETE /api/products/:id — Admin only (soft delete)
const deleteProduct = async (req, res) => {
  try {
    const deleted = await ProductModel.softDelete(req.params.id)
    if (!deleted) return res.status(404).json({ message: 'Product not found' })
    res.json({ message: 'Product deactivated' })
  } catch (err) {
    console.error('DeleteProduct error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

// GET /api/products/low-stock
const getLowStockProducts = async (req, res) => {
  try {
    const products = await ProductModel.getLowStock()
    res.json({ products, count: products.length })
  } catch (err) {
    console.error('GetLowStock error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

// GET /api/products/inventory-value
const getInventoryValue = async (req, res) => {
  try {
    const value = await ProductModel.getInventoryValue()
    res.json(value)
  } catch (err) {
    console.error('GetInventoryValue error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
  getInventoryValue,
}
