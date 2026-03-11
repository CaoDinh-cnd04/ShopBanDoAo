const express = require('express');
const router = express.Router();
const adminVoucherController = require('../controllers/adminVoucherController');
const { authenticate, authorize } = require('../middleware/auth');

// Tất cả routes yêu cầu Admin role
router.use(authenticate);
router.use(authorize('Admin'));

/**
 * @route   GET /api/admin/vouchers
 * @desc    Lấy tất cả vouchers
 * @access  Admin only
 */
router.get('/', adminVoucherController.getAllVouchers);

/**
 * @route   GET /api/admin/vouchers/stats
 * @desc    Lấy thống kê vouchers
 * @access  Admin only
 */
router.get('/stats', adminVoucherController.getVoucherStats);

/**
 * @route   POST /api/admin/vouchers
 * @desc    Tạo voucher mới
 * @access  Admin only
 */
router.post('/', adminVoucherController.createVoucher);

/**
 * @route   PUT /api/admin/vouchers/:id
 * @desc    Cập nhật voucher
 * @access  Admin only
 */
router.put('/:id', adminVoucherController.updateVoucher);

/**
 * @route   DELETE /api/admin/vouchers/:id
 * @desc    Xóa voucher (soft delete)
 * @access  Admin only
 */
router.delete('/:id', adminVoucherController.deleteVoucher);

module.exports = router;
