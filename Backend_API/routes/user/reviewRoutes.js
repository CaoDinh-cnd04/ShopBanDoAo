const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const reviewController = require('../../controllers/user/ReviewController');
const { authenticate } = require('../../middleware/auth');

const productReviewValidation = [
    body('productId').notEmpty().withMessage('Product ID không hợp lệ'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating phải từ 1-5')
];

const courtReviewValidation = [
    body('courtId').notEmpty().withMessage('Court ID không hợp lệ'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating phải từ 1-5')
];

router.post('/products', authenticate, productReviewValidation, (req, res, next) => reviewController.createProductReview(req, res, next));
router.post('/courts', authenticate, courtReviewValidation, (req, res, next) => reviewController.createCourtReview(req, res, next));
router.get('/products/:productId', (req, res, next) => reviewController.getProductReviews(req, res, next));

module.exports = router;
