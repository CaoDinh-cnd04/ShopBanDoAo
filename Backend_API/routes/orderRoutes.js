const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const orderController = require('../controllers/orderController');
const { authenticate } = require('../middleware/auth');

// Validation
const createOrderValidation = [
    body('addressId').isInt().withMessage('Địa chỉ không hợp lệ'),
    body('shippingMethodId').isInt().withMessage('Phương thức vận chuyển không hợp lệ'),
    body('items').isArray({ min: 1 }).withMessage('Giỏ hàng không được trống'),
    body('items.*.variantId').isInt().withMessage('Variant ID không hợp lệ'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Số lượng phải lớn hơn 0')
];

// Routes
router.post('/', authenticate, createOrderValidation, orderController.createOrder);
router.get('/', authenticate, orderController.getUserOrders);
router.get('/:id', authenticate, orderController.getOrderById);

module.exports = router;
