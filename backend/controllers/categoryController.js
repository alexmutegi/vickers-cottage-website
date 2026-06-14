const CategoryModel = require('../models/Category')

// GET /api/categories
const getCategories = async (req, res) => {
  try {
    const categories = await CategoryModel.getAll()
    res.json({ categories })
  } catch (err) {
    console.error('GetCategories error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

// POST /api/categories — Admin/Manager
const createCategory = async (req, res) => {
  try {
    const { name } = req.body
    const existing = await CategoryModel.findByName(name)
    if (existing) {
      return res.status(409).json({ message: 'Category already exists' })
    }
    const category = await CategoryModel.create(name)
    res.status(201).json({ message: 'Category created', category })
  } catch (err) {
    console.error('CreateCategory error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

// PUT /api/categories/:id — Admin/Manager
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params
    const { name } = req.body

    const existing = await CategoryModel.findByName(name)
    if (existing && existing.id !== Number(id)) {
      return res.status(409).json({ message: 'Another category already has this name' })
    }

    const updated = await CategoryModel.update(id, name)
    if (!updated) return res.status(404).json({ message: 'Category not found' })
    res.json({ message: 'Category updated', category: updated })
  } catch (err) {
    console.error('UpdateCategory error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

// DELETE /api/categories/:id — Admin only
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params
    const deleted = await CategoryModel.delete(id)
    if (!deleted) return res.status(404).json({ message: 'Category not found' })
    res.json({ message: 'Category deleted' })
  } catch (err) {
    if (err.message === 'CATEGORY_IN_USE') {
      return res.status(409).json({ message: 'Cannot delete category with assigned products' })
    }
    console.error('DeleteCategory error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = { getCategories, createCategory, updateCategory, deleteCategory }
