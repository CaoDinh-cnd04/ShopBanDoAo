const express = require('express');
const router = express.Router();
const adminCategoryController = require('../controllers/adminCategoryController');
const { authenticate, authorize } = require('../middleware/auth');

// Tất cả routes yêu cầu Admin role
router.use(authenticate);
router.use(authorize('Admin'));

// ==================== CATEGORY ROUTES ====================

/**
 * @route   POST /api/admin/categories
 * @desc    Tạo category mới
 * @access  Admin only
 */
router.post('/', adminCategoryController.createCategory);

/**
 * @route   PUT /api/admin/categories/:id
 * @desc    Cập nhật category
 * @access  Admin only
 */
router.put('/:id', adminCategoryController.updateCategory);

/**
 * @route   DELETE /api/admin/categories/:id
 * @desc    Xóa category (soft delete)
 * @access  Admin only
 */
router.delete('/:id', adminCategoryController.deleteCategory);

/**
 * @route   POST /api/admin/categories/subcategories
 * @desc    Tạo subcategory mới
 * @access  Admin only
 */
router.post('/subcategories', adminCategoryController.createSubCategory);

// ==================== BRAND ROUTES ====================

/**
 * @route   GET /api/admin/brands
 * @desc    Lấy tất cả brands
 * @access  Admin only
 */
router.get('/brands', adminCategoryController.getAllBrands);

/**
 * @route   POST /api/admin/brands
 * @desc    Tạo brand mới
 * @access  Admin only
 */
router.post('/brands', adminCategoryController.createBrand);

/**
 * @route   PUT /api/admin/brands/:id
 * @desc    Cập nhật brand
 * @access  Admin only
 */
router.put('/brands/:id', adminCategoryController.updateBrand);

/**
 * @route   DELETE /api/admin/brands/:id
 * @desc    Xóa brand (soft delete)
 * @access  Admin only
 */
router.delete('/brands/:id', adminCategoryController.deleteBrand);

module.exports = router;
