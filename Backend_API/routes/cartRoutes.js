const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const cartController = require('../controllers/cartController');
const { authenticate } = require('../middleware/auth');

// Validation
const addToCartValidation = [
    body('variantId').isInt().withMessage('Variant ID không hợp lệ'),
    body('quantity').isInt({ min: 1 }).withMessage('Số lượng phải lớn hơn 0')
];

const updateCartItemValidation = [
    body('quantity').isInt({ min: 0 }).withMessage('Số lượng không hợp lệ')
];

// Routes
router.get('/', authenticate, cartController.getCart);
router.post('/', authenticate, addToCartValidation, cartController.addToCart);
router.put('/:id', authenticate, updateCartItemValidation, cartController.updateCartItem);
router.delete('/:id', authenticate, cartController.removeFromCart);
router.delete('/', authenticate, cartController.clearCart);

module.exports = router;
