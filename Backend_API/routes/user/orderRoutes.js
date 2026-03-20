const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const orderController = require('../../controllers/user/OrderController');
const { authenticate } = require('../../middleware/auth');

const createOrderValidation = [
    body('addressId').notEmpty().withMessage('Địa chỉ không hợp lệ'),
    body('shippingMethodId').notEmpty().withMessage('Phương thức vận chuyển không hợp lệ'),
    body('items').isArray({ min: 1 }).withMessage('Giỏ hàng không được trống'),
    body('items.*.variantId').notEmpty().withMessage('Variant ID không hợp lệ'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Số lượng phải lớn hơn 0')
];

router.post('/', authenticate, createOrderValidation, (req, res, next) => orderController.createOrder(req, res, next));
router.get('/', authenticate, (req, res, next) => orderController.getUserOrders(req, res, next));
router.get('/:id', authenticate, (req, res, next) => orderController.getOrderById(req, res, next));

module.exports = router;
