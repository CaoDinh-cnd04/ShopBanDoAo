const express = require('express');
const router = express.Router();
const adminCourtController = require('../controllers/adminCourtController');
const { authenticate, authorize } = require('../middleware/auth');

// Tất cả routes yêu cầu Admin role
router.use(authenticate);
router.use(authorize('Admin'));

/**
 * @route   GET /api/admin/courts
 * @desc    Lấy tất cả courts
 * @access  Admin only
 */
router.get('/', adminCourtController.getAllCourts);

/**
 * @route   GET /api/admin/courts/stats
 * @desc    Lấy thống kê courts
 * @access  Admin only
 */
router.get('/stats', adminCourtController.getCourtStats);

/**
 * @route   POST /api/admin/courts
 * @desc    Tạo court mới
 * @access  Admin only
 */
router.post('/', adminCourtController.createCourt);

/**
 * @route   PUT /api/admin/courts/:id
 * @desc    Cập nhật court
 * @access  Admin only
 */
router.put('/:id', adminCourtController.updateCourt);

/**
 * @route   DELETE /api/admin/courts/:id
 * @desc    Xóa court (soft delete)
 * @access  Admin only
 */
router.delete('/:id', adminCourtController.deleteCourt);

/**
 * @route   POST /api/admin/courts/types
 * @desc    Tạo court type mới
 * @access  Admin only
 */
router.post('/types', adminCourtController.createCourtType);

module.exports = router;
