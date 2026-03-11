const express = require('express');
const router = express.Router();
const adminBookingController = require('../controllers/adminBookingController');
const { authenticate, authorize } = require('../middleware/auth');

// Tất cả routes yêu cầu Admin role
router.use(authenticate);
router.use(authorize('Admin'));

/**
 * @route   GET /api/admin/bookings
 * @desc    Lấy tất cả bookings với phân trang và filter
 * @access  Admin only
 */
router.get('/', adminBookingController.getAllBookings);

/**
 * @route   GET /api/admin/bookings/stats
 * @desc    Lấy thống kê bookings
 * @access  Admin only
 */
router.get('/stats', adminBookingController.getBookingStats);

/**
 * @route   PUT /api/admin/bookings/:id/status
 * @desc    Cập nhật trạng thái booking
 * @access  Admin only
 */
router.put('/:id/status', adminBookingController.updateBookingStatus);

/**
 * @route   PUT /api/admin/bookings/:id/cancel
 * @desc    Hủy booking
 * @access  Admin only
 */
router.put('/:id/cancel', adminBookingController.cancelBooking);

module.exports = router;
