const express = require('express');
const router = express.Router();
const adminReviewController = require('../../controllers/admin/ReviewController');
const { authenticate, authorize } = require('../../middleware/auth');

router.use(authenticate);
router.use(authorize('Admin'));

router.get('/', (req, res, next) => adminReviewController.getAllReviews(req, res, next));
router.get('/stats', (req, res, next) => adminReviewController.getReviewStats(req, res, next));
router.put('/:id/status', (req, res, next) => adminReviewController.updateReviewStatus(req, res, next));
router.delete('/:id', (req, res, next) => adminReviewController.deleteReview(req, res, next));

module.exports = router;
