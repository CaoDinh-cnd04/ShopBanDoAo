const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const voucherController = require('../controllers/voucherController');
const { authenticate } = require('../middleware/auth');

// Routes
router.get('/available', authenticate, voucherController.getAvailableVouchers);
router.get('/', authenticate, voucherController.getUserVouchers);
router.post('/receive', authenticate, [
    body('voucherId').isInt({ min: 1 }).withMessage('Voucher ID không hợp lệ')
], voucherController.receiveVoucher);

module.exports = router;
