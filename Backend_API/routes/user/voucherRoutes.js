const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const voucherController = require('../../controllers/user/VoucherController');
const { authenticate } = require('../../middleware/auth');

router.get('/available', authenticate, (req, res, next) => voucherController.getAvailableVouchers(req, res, next));
router.get('/', authenticate, (req, res, next) => voucherController.getUserVouchers(req, res, next));
router.post('/receive', authenticate, [body('voucherId').notEmpty().withMessage('Voucher ID không hợp lệ')], (req, res, next) => voucherController.receiveVoucher(req, res, next));

module.exports = router;
