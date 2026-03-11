const express = require('express');
const router = express.Router();
const adminUserController = require('../controllers/adminUserController');
const { authenticate, authorize } = require('../middleware/auth');

// Tất cả routes yêu cầu Admin role
router.use(authenticate);
router.use(authorize('Admin'));

/**
 * @route   GET /api/admin/users
 * @desc    Lấy danh sách tất cả users với phân trang và filter
 * @access  Admin only
 * @query   page, limit, search, role, isActive, sortBy, sortOrder
 */
router.get('/', adminUserController.getAllUsers);

/**
 * @route   GET /api/admin/users/stats
 * @desc    Lấy thống kê users
 * @access  Admin only
 */
router.get('/stats', adminUserController.getUserStats);

/**
 * @route   GET /api/admin/users/:id
 * @desc    Lấy chi tiết user theo ID
 * @access  Admin only
 */
router.get('/:id', adminUserController.getUserById);

/**
 * @route   PUT /api/admin/users/:id
 * @desc    Cập nhật thông tin user
 * @access  Admin only
 */
router.put('/:id', adminUserController.updateUser);

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Xóa user (soft delete)
 * @access  Admin only
 */
router.delete('/:id', adminUserController.deleteUser);

/**
 * @route   PUT /api/admin/users/:id/status
 * @desc    Kích hoạt/Vô hiệu hóa user
 * @access  Admin only
 */
router.put('/:id/status', adminUserController.toggleUserStatus);

module.exports = router;
