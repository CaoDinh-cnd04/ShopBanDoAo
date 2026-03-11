const express = require('express');
const router = express.Router();
const adminReviewController = require('../controllers/adminReviewController');
const { authenticate, authorize } = require('../middleware/auth');

// Tất cả routes yêu cầu Admin role
router.use(authenticate);
router.use(authorize('Admin'));

/**
 * @route   GET /api/admin/reviews
 * @desc    Lấy tất cả reviews (product + court)
 * @access  Admin only
 * @query   page, limit, type (product/court/all), isApproved, rating
 */
router.get('/', adminReviewController.getAllReviews);

/**
 * @route   GET /api/admin/reviews/stats
 * @desc    Lấy thống kê reviews
 * @access  Admin only
 */
router.get('/stats', adminReviewController.getReviewStats);

/**
 * @route   PUT /api/admin/reviews/:id/status
 * @desc    Approve/Reject review
 * @access  Admin only
 */
router.put('/:id/status', adminReviewController.updateReviewStatus);

/**
 * @route   DELETE /api/admin/reviews/:id
 * @desc    Xóa review
 * @access  Admin only
 */
router.delete('/:id', adminReviewController.deleteReview);

module.exports = router;
