const express = require('express');
const router = express.Router();
const adminOrderController = require('../controllers/adminOrderController');
const { authenticate, authorize } = require('../middleware/auth');

// Tất cả routes yêu cầu Admin role
router.use(authenticate);
router.use(authorize('Admin'));

/**
 * @route   GET /api/admin/orders
 * @desc    Lấy tất cả đơn hàng với phân trang và filter
 * @access  Admin only
 */
router.get('/', adminOrderController.getAllOrders);

/**
 * @route   GET /api/admin/orders/stats
 * @desc    Lấy thống kê đơn hàng
 * @access  Admin only
 */
router.get('/stats', adminOrderController.getOrderStats);

/**
 * @route   PUT /api/admin/orders/:id/status
 * @desc    Cập nhật trạng thái đơn hàng
 * @access  Admin only
 */
router.put('/:id/status', adminOrderController.updateOrderStatus);

/**
 * @route   PUT /api/admin/orders/:id/cancel
 * @desc    Hủy đơn hàng
 * @access  Admin only
 */
router.put('/:id/cancel', adminOrderController.cancelOrder);

module.exports = router;
