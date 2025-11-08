const express = require('express');
const {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory
} = require('../../controllers/Admin/categoryController');
const authenticateAdmin = require('../../middlewares/adminAuth');

const router = express.Router();
router.get('/', getAllCategories);
router.use(authenticateAdmin);

// Categories only require name, no video upload needed
router.post('/', createCategory);
router.patch('/:id', updateCategory);
router.delete('/:id', deleteCategory);

module.exports = router;
