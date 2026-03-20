const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const cartController = require('../../controllers/user/CartController');
const { authenticate } = require('../../middleware/auth');

const addToCartValidation = [
    body('variantId').notEmpty().withMessage('Variant ID không hợp lệ'),
    body('quantity').isInt({ min: 1 }).withMessage('Số lượng phải lớn hơn 0')
];

const updateCartItemValidation = [
    body('quantity').isInt({ min: 0 }).withMessage('Số lượng không hợp lệ')
];

router.get('/', authenticate, (req, res, next) => cartController.getCart(req, res, next));
router.post('/', authenticate, addToCartValidation, (req, res, next) => cartController.addToCart(req, res, next));
router.put('/:id', authenticate, updateCartItemValidation, (req, res, next) => cartController.updateCartItem(req, res, next));
router.delete('/:id', authenticate, (req, res, next) => cartController.removeFromCart(req, res, next));
router.delete('/', authenticate, (req, res, next) => cartController.clearCart(req, res, next));

module.exports = router;
