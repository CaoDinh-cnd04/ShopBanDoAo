const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const reviewController = require('../controllers/reviewController');
const { authenticate } = require('../middleware/auth');

// Validation
const reviewValidation = [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating phải từ 1-5'),
    body('reviewTitle').optional().trim().isLength({ max: 255 }).withMessage('Tiêu đề không được quá 255 ký tự')
];

const productReviewValidation = [
    ...reviewValidation,
    body('productId').isInt({ min: 1 }).withMessage('Product ID không hợp lệ')
];

const courtReviewValidation = [
    ...reviewValidation,
    body('courtId').isInt({ min: 1 }).withMessage('Court ID không hợp lệ'),
    body('bookingId').optional().isInt({ min: 1 }).withMessage('Booking ID không hợp lệ')
];

// Routes
router.post('/products', authenticate, productReviewValidation, reviewController.createProductReview);
router.post('/courts', authenticate, courtReviewValidation, reviewController.createCourtReview);
router.get('/products/:productId', reviewController.getProductReviews);

module.exports = router;
