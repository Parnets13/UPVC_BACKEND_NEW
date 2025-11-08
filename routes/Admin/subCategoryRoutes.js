const express = require('express');
const {
  createSubCategory,
  getAllSubCategories,
  updateSubCategory,
  deleteSubCategory
} = require('../../controllers/Admin/subCategoryController'); 
const upload = require('../../middlewares/upload');
const authenticateAdmin = require('../../middlewares/adminAuth');
const router = express.Router();

// Public route - allow mobile app to fetch subcategories (NO AUTH REQUIRED)
router.get('/', getAllSubCategories);

// Protected routes - require admin authentication
// Apply authentication middleware only to POST, PATCH, DELETE routes
router.post('/', authenticateAdmin, upload.video('video'), createSubCategory);
router.patch('/:id', authenticateAdmin, upload.video('video'), updateSubCategory);
router.delete('/:id', authenticateAdmin, deleteSubCategory);

module.exports = router;
